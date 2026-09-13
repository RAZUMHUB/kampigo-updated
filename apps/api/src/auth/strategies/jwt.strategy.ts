import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

interface JwtPayload {
  sub: string;
  universityId: string;
  role?: string;
  purpose?: string;
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.purpose === 'PASSWORD_RESET') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account not found or disabled');
    }

    if (
      user.passwordChangedAt &&
      payload.iat &&
      payload.iat * 1000 <= user.passwordChangedAt.getTime()
    ) {
      throw new UnauthorizedException(
        'Session expired because the password was changed',
      );
    }
    // Re-read universityId/role from DB rather than trusting only the JWT claim,
    // so a role change or tenant reassignment takes effect immediately, and a
    // stale/forged token cannot grant cross-tenant access.
    return {
      id: user.id,
      universityId: user.universityId,
      role: user.role,
      institutionalEmail: user.institutionalEmail,
    };
  }
}
