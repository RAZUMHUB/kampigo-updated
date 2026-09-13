import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AlertsService } from './alerts.service';
import { RazorpayService } from './razorpay.service';
import { WalletController } from './wallet.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [WalletService, AlertsService, RazorpayService],
  controllers: [WalletController],
  exports: [WalletService, AlertsService],
})
export class WalletModule {}
