import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProvider } from '../email.provider';

@Injectable()
export class GmailEmailProvider implements EmailProvider {
  private readonly logger = new Logger(GmailEmailProvider.name);

  async send(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    const user = process.env.GMAIL_SMTP_USER;
    const appPassword = process.env.GMAIL_APP_PASSWORD;

    if (!user || !appPassword) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'GMAIL_SMTP_USER and GMAIL_APP_PASSWORD are required in production',
        );
      }

      this.logger.warn(
        `Gmail SMTP not configured - logging email instead of sending: to=${params.to} subject="${params.subject}"`,
      );

      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: appPassword,
      },
    });

    try {
      const info = await transporter.sendMail({
        from:
          process.env.EMAIL_FROM_ADDRESS ??
          `Campigo <${user}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      this.logger.log(
        `Email sent successfully: messageId=${info.messageId} to=${params.to}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Gmail SMTP send failed: to=${params.to} error=${message}`,
      );

      throw new Error(`Gmail SMTP error: ${message}`);
    }
  }
}
