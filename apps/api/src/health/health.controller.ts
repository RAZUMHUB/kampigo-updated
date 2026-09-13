import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import Redis from 'ioredis';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'campigo-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready() {
    const checks = {
      database: false,
      redis: false,
    };

    let redis: Redis | null = null;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;

      redis = new Redis({
        host: process.env.REDIS_HOST ?? 'redis',
        port: Number(process.env.REDIS_PORT ?? 6379),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
      });

      await redis.connect();

      const pong = await redis.ping();
      checks.redis = pong === 'PONG';

      if (!checks.database || !checks.redis) {
        throw new ServiceUnavailableException({
          status: 'not_ready',
          checks,
        });
      }

      return {
        status: 'ready',
        checks,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        status: 'not_ready',
        checks,
      });
    } finally {
      if (redis) {
        redis.disconnect();
      }
    }
  }
}
