import { createHash, randomInt } from 'crypto';

export function generateRideOtp() {
  const code = randomInt(100000, 1000000).toString();

  return {
    code,
    hash: createHash('sha256').update(code).digest('hex'),
  };
}

export function hashRideOtp(code: string) {
  return createHash('sha256').update(code).digest('hex');
}
