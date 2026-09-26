import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnApplicationShutdown
{
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
      maxRetriesPerRequest: null,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${redisKey}:blocked`;
    const now = Date.now();

    const result = (await this.redis.eval(
      `
      local blocked = redis.call('PTTL', KEYS[2])

      if blocked > 0 then
        local ttl = redis.call('PTTL', KEYS[1])
        return { redis.call('GET', KEYS[1]) or '0', ttl, 1, blocked }
      end

      local current = redis.call('INCR', KEYS[1])

      if current == 1 then
        redis.call('PEXPIRE', KEYS[1], ARGV[1])
      end

      local ttl = redis.call('PTTL', KEYS[1])

      if current > tonumber(ARGV[2]) and tonumber(ARGV[3]) > 0 then
        redis.call('SET', KEYS[2], '1', 'PX', ARGV[3])
        blocked = tonumber(ARGV[3])
        return { current, ttl, 1, blocked }
      end

      return { current, ttl, 0, 0 }
      `,
      2,
      redisKey,
      blockKey,
      ttl,
      limit,
      blockDuration,
    )) as [string, number, number, number];

    const totalHits = Number(result[0]);
    const timeToExpire = Number(result[1]);
    const isBlocked = Number(result[2]) === 1;
    const timeToBlockExpire = isBlocked ? now + Number(result[3]) : 0;

    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
