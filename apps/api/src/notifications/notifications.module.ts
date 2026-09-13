import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ALERT_FANOUT_QUEUE } from './notification-queue.constants';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AlertFanoutProcessor } from './alert-fanout.processor';
import { DevicesService } from './devices/devices.service';
import { FcmProvider } from './fcm/fcm.provider';
import { WebPushProvider } from './webpush/webpush.provider';

@Module({
  imports: [BullModule.registerQueue({ name: ALERT_FANOUT_QUEUE })],
  providers: [NotificationsService, AlertFanoutProcessor, DevicesService, FcmProvider, WebPushProvider],
  controllers: [NotificationsController],
  exports: [NotificationsService, DevicesService],
})
export class NotificationsModule {}
