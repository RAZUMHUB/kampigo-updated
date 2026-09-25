import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { createHmac, randomInt } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OtpPurpose } from '@prisma/client';

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 45;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_RESENDS_PER_HOUR = 5;
const OTP_MAX_REQUESTS_PER_IP_PER_HOUR = 20;

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/**
 * Institutional-email OTP issuance & verification.
 *
 * Security properties enforced here:
 *  - codes are hashed (never stored in plaintext)
 *  - expiry + max verification attempts per challenge
 *  - resend cooldown + hourly resend cap per email
 *  - IP-based rate limiting per hour
 *  - domain allowlist check happens BEFORE any OTP is issued
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private hashCode(code: string): string {
    const secret = process.env.OTP_HASH_SECRET;

    if (!secret) {
      throw new Error('OTP_HASH_SECRET is not configured');
    }

    return createHmac('sha256', secret).update(code).digest('hex');
  }

  private extractDomain(email: string): string {
    const parts = email.toLowerCase().split('@');
    if (parts.length !== 2)
      throw new BadRequestException('Invalid email address');
    return parts[1];
  }

  async requestOtp(params: {
    universityId: string;
    institutionalEmail: string;
    purpose?: OtpPurpose;
    requestIp?: string;
  }) {
    const {
      universityId,
      institutionalEmail,
      purpose = OtpPurpose.REGISTRATION,
      requestIp,
    } = params;

    const domain = this.extractDomain(institutionalEmail);
    const approved = await this.prisma.approvedEmailDomain.findFirst({
      where: { universityId, domain },
    });
    if (!approved) {
      throw new ForbiddenException(
        'This email domain is not approved for the selected university',
      );
    }

    if (requestIp) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const ipRequestCount = await this.prisma.otpChallenge.count({
        where: { requestIp, createdAt: { gte: oneHourAgo } },
      });
      if (ipRequestCount >= OTP_MAX_REQUESTS_PER_IP_PER_HOUR) {
        throw new TooManyRequestsException(
          'Too many OTP requests from this network. Try later.',
        );
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentForEmail = await this.prisma.otpChallenge.count({
      where: {
        email: institutionalEmail,
        universityId,
        purpose,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentForEmail >= OTP_MAX_RESENDS_PER_HOUR) {
      throw new TooManyRequestsException(
        'Too many OTP requests for this email. Try later.',
      );
    }

    const lastChallenge = await this.prisma.otpChallenge.findFirst({
      where: {
        email: institutionalEmail,
        universityId,
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (lastChallenge) {
      const secondsSinceLast =
        (Date.now() - lastChallenge.lastSentAt.getTime()) / 1000;
      if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
        throw new TooManyRequestsException(
          `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code`,
        );
      }
    }

    const code = randomInt(100000, 999999).toString();
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        email: institutionalEmail,
        universityId,
        codeHash,
        purpose,
        expiresAt,
        requestIp,
        maxAttempts: OTP_MAX_ATTEMPTS,
      },
    });

    if (
      process.env.NODE_ENV === 'test' &&
      process.env.E2E_OTP_CAPTURE === 'true'
    ) {
      console.log(
        `[E2E_OTP_CAPTURE] challengeId=${challenge.id} email=${institutionalEmail} code=${code}`,
      );
    } else {
      await this.emailService.sendOtpEmail(
        institutionalEmail,
        code,
        OTP_TTL_MINUTES,
      );
    }

    return { challengeId: challenge.id, expiresAt };
  }

  async verifyOtp(params: {
    universityId: string;
    institutionalEmail: string;
    code: string;
    purpose: OtpPurpose;
  }) {
    const { universityId, institutionalEmail, code, purpose } = params;

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        email: institutionalEmail,
        universityId,
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new NotFoundException(
        'No active OTP challenge found. Please request a new code.',
      );
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'OTP has expired. Please request a new code.',
      );
    }

    if (challenge.attemptsMade >= challenge.maxAttempts) {
      throw new ForbiddenException(
        'Maximum verification attempts exceeded. Request a new code.',
      );
    }

    const isMatch = this.hashCode(code) === challenge.codeHash;

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attemptsMade: { increment: 1 } },
    });

    if (!isMatch) {
      throw new BadRequestException('Incorrect verification code');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return { verified: true, challengeId: challenge.id };
  }
}
