import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose } from '@prisma/client';
import { createHmac, randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma/prisma.service';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async requestRegistrationOtp(
    universityId: string,
    campusId: string,
    institutionalEmail: string,
    displayName: string,
    password: string,
    ip?: string,
  ) {
    const email = this.normalizeEmail(institutionalEmail);

    const existing = await this.prisma.user.findUnique({
      where: {
        institutionalEmail: email,
      },
    });

    if (existing) {
      throw new ConflictException(
        'An account already exists for this email. Try logging in.',
      );
    }

    const campus = await this.prisma.campus.findFirst({
      where: {
        id: campusId,
        universityId,
      },
    });

    if (!campus) {
      throw new BadRequestException(
        'Selected campus does not belong to this university',
      );
    }

    if (displayName.trim().length < 2) {
      throw new BadRequestException('Please enter your full name');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    return this.otpService.requestOtp({
      universityId,
      institutionalEmail: email,
      purpose: OtpPurpose.REGISTRATION,
      requestIp: ip,
    });
  }

  async verifyRegistration(params: {
    universityId: string;
    campusId: string;
    institutionalEmail: string;
    code: string;
    displayName: string;
    password: string;
  }) {
    const email = this.normalizeEmail(params.institutionalEmail);

    const existing = await this.prisma.user.findUnique({
      where: {
        institutionalEmail: email,
      },
    });

    if (existing) {
      throw new ConflictException(
        'An account already exists for this email. Try logging in.',
      );
    }

    const campus = await this.prisma.campus.findFirst({
      where: {
        id: params.campusId,
        universityId: params.universityId,
      },
    });

    if (!campus) {
      throw new BadRequestException(
        'Selected campus does not belong to this university',
      );
    }

    await this.otpService.verifyOtp({
      universityId: params.universityId,
      institutionalEmail: email,
      code: params.code,
      purpose: OtpPurpose.REGISTRATION,
    });

    const passwordHash = await argon2.hash(params.password);

    const user = await this.prisma.user.create({
      data: {
        universityId: params.universityId,
        campusId: params.campusId,
        institutionalEmail: email,
        displayName: params.displayName.trim(),
        passwordHash,
      },
    });

    await this.prisma.wallet.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        universityId: user.universityId,
      },
      update: {},
    });

    return this.issueTokens(user.id, user.universityId, user.role);
  }

  async requestLoginOtp(
    universityId: string,
    institutionalEmail: string,
    password: string,
    ip?: string,
  ) {
    const email = this.normalizeEmail(institutionalEmail);

    const user = await this.prisma.user.findUnique({
      where: {
        institutionalEmail: email,
      },
    });

    if (
      !user ||
      user.universityId !== universityId ||
      !user.isActive ||
      !user.passwordHash
    ) {
      throw new UnauthorizedException('Invalid university, email or password');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid university, email or password');
    }

    return this.otpService.requestOtp({
      universityId,
      institutionalEmail: email,
      purpose: OtpPurpose.LOGIN,
      requestIp: ip,
    });
  }

  async verifyLogin(params: {
    universityId: string;
    institutionalEmail: string;
    code: string;
  }) {
    const email = this.normalizeEmail(params.institutionalEmail);

    const user = await this.prisma.user.findUnique({
      where: {
        institutionalEmail: email,
      },
    });

    if (
      !user ||
      user.universityId !== params.universityId ||
      !user.isActive ||
      !user.passwordHash
    ) {
      throw new UnauthorizedException('Account not found for this university');
    }

    await this.otpService.verifyOtp({
      universityId: params.universityId,
      institutionalEmail: email,
      code: params.code,
      purpose: OtpPurpose.LOGIN,
    });

    return this.issueTokens(user.id, user.universityId, user.role);
  }

  async requestPasswordResetOtp(
    universityId: string,
    institutionalEmail: string,
    ip?: string,
  ) {
    const email = this.normalizeEmail(institutionalEmail);

    const user = await this.prisma.user.findUnique({
      where: {
        institutionalEmail: email,
      },
    });

    /*
     * Keep the response identical whether the account exists.
     * This prevents account enumeration through the password-reset endpoint.
     */
    if (!user || user.universityId !== universityId || !user.isActive) {
      return {
        message:
          'If an account exists for this email, a verification code has been sent.',
      };
    }

    await this.otpService.requestOtp({
      universityId,
      institutionalEmail: email,
      purpose: OtpPurpose.PASSWORD_RESET,
      requestIp: ip,
    });

    return {
      message:
        'If an account exists for this email, a verification code has been sent.',
    };
  }

  async verifyPasswordResetOtp(params: {
    universityId: string;
    institutionalEmail: string;
    code: string;
  }) {
    const email = this.normalizeEmail(params.institutionalEmail);

    const user = await this.prisma.user.findUnique({
      where: {
        institutionalEmail: email,
      },
    });

    if (
      !user ||
      user.universityId !== params.universityId ||
      !user.isActive
    ) {
      throw new UnauthorizedException('Invalid password reset request');
    }

    await this.otpService.verifyOtp({
      universityId: params.universityId,
      institutionalEmail: email,
      code: params.code,
      purpose: OtpPurpose.PASSWORD_RESET,
    });

    const token = randomBytes(32).toString('base64url');
    const secret = process.env.AUTH_TOKEN_HASH_SECRET;

    if (!secret) {
      throw new Error('AUTH_TOKEN_HASH_SECRET is not configured');
    }

    const tokenHash = createHmac('sha256', secret)
      .update(token)
      .digest('hex');

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return {
      resetToken: token,
    };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    if (newPassword.length < 8 || newPassword.length > 128) {
      throw new BadRequestException(
        'Password must be between 8 and 128 characters',
      );
    }

    const secret = process.env.AUTH_TOKEN_HASH_SECRET;

    if (!secret) {
      throw new Error('AUTH_TOKEN_HASH_SECRET is not configured');
    }

    const tokenHash = createHmac('sha256', secret)
      .update(resetToken)
      .digest('hex');

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt.getTime() <= Date.now() ||
      !resetRecord.user.isActive
    ) {
      throw new UnauthorizedException(
        'Password reset token has expired or is invalid',
      );
    }

    const passwordHash = await argon2.hash(newPassword);

    const now = new Date();

    await this.prisma.$transaction(async tx => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetRecord.id,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      if (consumed.count !== 1) {
        throw new UnauthorizedException(
          'Password reset token has expired or is invalid',
        );
      }

      await tx.user.update({
        where: {
          id: resetRecord.userId,
        },
        data: {
          passwordHash,
          passwordChangedAt: now,
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetRecord.userId,
          id: {
            not: resetRecord.id,
          },
        },
      });
    });

    return {
      message: 'Password changed successfully. Please sign in again.',
    };
  }

  private issueTokens(userId: string, universityId: string, role: string) {
    const payload = {
      sub: userId,
      universityId,
      role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET!,
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
