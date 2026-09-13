import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
  imports: [NotificationsModule, EncryptionModule],
  providers: [ClaimsService],
  controllers: [ClaimsController],
  exports: [ClaimsService],
})
export class ClaimsModule {}
