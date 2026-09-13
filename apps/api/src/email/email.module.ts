import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ResendEmailProvider } from './providers/resend.provider';

@Module({
  providers: [
    EmailService,
    ResendEmailProvider,
  ],
  exports: [
    EmailService,
  ],
})
export class EmailModule {}