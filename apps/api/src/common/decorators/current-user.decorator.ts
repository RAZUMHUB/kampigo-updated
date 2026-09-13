import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  universityId: string;
  role: 'STUDENT' | 'STAFF' | 'CAMPUS_AUTHORITY' | 'UNIVERSITY_ADMIN' | 'PLATFORM_SUPER_ADMIN';
  institutionalEmail: string;
}

/**
 * Pulls the authenticated user (attached by JwtAuthGuard) off the request.
 * `universityId` on this object is the ONLY source of truth for tenant scoping
 * in every service method - never trust a universityId passed in a request body.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
