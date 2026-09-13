import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Standard JWT verification. On success, request.user is populated with
 * { id, universityId, role, institutionalEmail } from the JwtStrategy.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
