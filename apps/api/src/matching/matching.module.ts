import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MATCHING_QUEUE } from './matching.queue.constants';
import { MatchingProducer } from './matching.producer';
import { MatchingProcessor } from './matching.processor';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { MlClientService } from './ml-client.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MATCHING_QUEUE,
    }),
    NotificationsModule,
    StorageModule,
  ],
  providers: [
    MatchingProducer,
    MatchingProcessor,
    MatchingService,
    MlClientService,
  ],
  controllers: [
    MatchingController,
  ],
  exports: [
    MatchingProducer,
    MatchingService,
  ],
})
export class MatchingModule {}
