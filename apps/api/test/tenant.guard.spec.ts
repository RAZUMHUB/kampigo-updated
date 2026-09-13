import { BadRequestException } from '@nestjs/common';
import { TenantGuard } from '../src/common/guards/tenant.guard';

function makeContext(user: any, body: any = {}, query: any = {}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, body, query }),
    }),
  } as any;
}

describe('TenantGuard', () => {
  const guard = new TenantGuard();
  const user = { id: 'u1', universityId: 'uni-a', role: 'STUDENT' };

  it('allows requests with no client-supplied universityId', () => {
    expect(guard.canActivate(makeContext(user, { title: 'lost keys' }))).toBe(true);
  });

  it('allows requests where client-supplied universityId matches the token', () => {
    expect(guard.canActivate(makeContext(user, { universityId: 'uni-a' }))).toBe(true);
  });

  it('rejects requests attempting to target a different university via body', () => {
    expect(() => guard.canActivate(makeContext(user, { universityId: 'uni-b' }))).toThrow(
      BadRequestException,
    );
  });

  it('rejects requests attempting to target a different university via query', () => {
    expect(() => guard.canActivate(makeContext(user, {}, { universityId: 'uni-b' }))).toThrow(
      BadRequestException,
    );
  });

  it('is a no-op for unauthenticated (public) routes', () => {
    expect(guard.canActivate(makeContext(undefined, { universityId: 'uni-b' }))).toBe(true);
  });
});
