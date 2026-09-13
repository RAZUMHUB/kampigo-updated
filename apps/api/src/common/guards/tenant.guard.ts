import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

/**
 * Defense-in-depth tenant isolation guard.
 *
 * Every controller in this codebase must never accept a client-supplied
 * `universityId` as an authoritative filter. This guard runs on every
 * protected route and strips/validates any `universityId` present in the
 * request body or query string against the authenticated user's own
 * universityId. If a client explicitly sends a *different* universityId,
 * the request is rejected outright rather than silently corrected - a
 * mismatch here is a strong signal of a cross-tenant access attempt and is
 * audit-logged upstream by the AuditInterceptor.
 *
 * This guard is a safety net. The authoritative enforcement lives in each
 * service's Prisma queries, which must ALWAYS filter by
 * `user.universityId` sourced from the JWT - never from client input.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true; // public route, nothing to check

    const bodyUniversityId = request.body?.universityId;
    const queryUniversityId = request.query?.universityId;

    if (bodyUniversityId && bodyUniversityId !== user.universityId) {
      throw new BadRequestException(
        'universityId in request body must not be supplied by the client',
      );
    }
    if (queryUniversityId && queryUniversityId !== user.universityId) {
      throw new BadRequestException(
        'universityId in query params must not be supplied by the client',
      );
    }
    return true;
  }
}
