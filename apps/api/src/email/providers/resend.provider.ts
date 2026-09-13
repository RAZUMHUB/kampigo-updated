import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../email.provider';

/**
 * Resend-backed implementation. Requires RESEND_API_KEY in the environment.
 * Falls back to console logging in non-production environments when no key
 * is configured, so local development / demos don't hard-fail.
 */
@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger('ResendEmailProvider');
  private readonly apiKey = process.env.RESEND_API_KEY;

  async send(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('RESEND_API_KEY is required in production');
      }

      this.logger.warn(
        `RESEND_API_KEY not set - logging email instead of sending: to=${params.to} subject="${params.subject}"`,
      );
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM_ADDRESS ?? 'noreply@campuslostfound.app',
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend API error (${response.status}): ${body}`);
    }
  }
}
