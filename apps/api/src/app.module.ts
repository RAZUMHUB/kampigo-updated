import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UniversityModule } from './university/university.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { MatchingModule } from './matching/matching.module';
import { ClaimsModule } from './claims/claims.module';
import { ChatModule } from './chat/chat.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RidesModule } from './rides/rides.module';
import { RentalsModule } from './rentals/rentals.module';
import { RedisThrottlerStorage } from './common/throttling/redis-throttler.storage';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      storage: new RedisThrottlerStorage(),
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: process.env.REDIS_PORT
          ? parseInt(process.env.REDIS_PORT, 10)
          : 6379,
      },
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UniversityModule,
    UsersModule,
    ItemsModule,
    MatchingModule,
    ClaimsModule,
    ChatModule,
    WalletModule,
    NotificationsModule,
    AdminModule,
    StorageModule,
    EmailModule,
    SearchModule,
    DashboardModule,
    RidesModule,
    RentalsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
