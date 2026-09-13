import { Injectable, Logger } from '@nestjs/common';
import * as webPush from 'web-push';

interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class WebPushProvider {
  private readonly logger = new Logger('WebPushProvider');

  private readonly publicKey =
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY;

  private readonly privateKey =
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY;

  private readonly subject =
    process.env.WEB_PUSH_VAPID_SUBJECT ??
    'mailto:admin@lostfound.local';

  private readonly configured = Boolean(
    this.publicKey && this.privateKey,
  );

  constructor() {
    if (this.configured) {
      webPush.setVapidDetails(
        this.subject,
        this.publicKey as string,
        this.privateKey as string,
      );
    }
  }

  async send(
    subscription: unknown,
    payload: {
      title: string;
      body: string;
    },
  ): Promise<boolean> {
    if (!this.configured) {
      this.logger.warn(
        'Web Push VAPID keys not configured - skipping send',
      );

      return false;
    }

    if (!this.isValidSubscription(subscription)) {
      this.logger.warn(
        'Invalid Web Push subscription - skipping send',
      );

      return false;
    }

    try {
      await webPush.sendNotification(
        subscription,
        JSON.stringify(payload),
      );

      return true;
    } catch (error) {
      const statusCode = this.getStatusCode(error);

      if (statusCode === 404 || statusCode === 410) {
        this.logger.warn(
          `Web Push subscription expired or removed: status=${statusCode}`,
        );

        return false;
      }

      this.logger.error(
        'Web Push send failed',
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return false;
    }
  }

  private isValidSubscription(
    subscription: unknown,
  ): subscription is WebPushSubscription {
    if (
      typeof subscription !== 'object' ||
      subscription === null
    ) {
      return false;
    }

    const candidate =
      subscription as Partial<WebPushSubscription>;

    return Boolean(
      candidate.endpoint &&
        typeof candidate.endpoint === 'string' &&
        candidate.keys &&
        typeof candidate.keys.p256dh === 'string' &&
        typeof candidate.keys.auth === 'string',
    );
  }

  private getStatusCode(
    error: unknown,
  ): number | undefined {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error
    ) {
      const statusCode = (
        error as { statusCode?: unknown }
      ).statusCode;

      return typeof statusCode === 'number'
        ? statusCode
        : undefined;
    }

    return undefined;
  }
}
