import { Injectable, Logger } from '@nestjs/common';
import {
  App,
  cert,
  getApps,
  initializeApp,
  ServiceAccount,
} from 'firebase-admin/app';
import {
  getMessaging,
  Messaging,
} from 'firebase-admin/messaging';

export interface PushSendResult {
  pushToken: string;
  success: boolean;
  shouldInvalidateToken?: boolean;
}

interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

@Injectable()
export class FcmProvider {
  private readonly logger = new Logger('FcmProvider');

  private readonly messaging: Messaging | null;

  constructor() {
    this.messaging = this.createMessagingClient();
  }

  async sendBatch(
    tokens: string[],
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<PushSendResult[]> {
    if (tokens.length === 0) {
      return [];
    }

    if (!this.messaging) {
      this.logger.warn(
        `FCM not configured - skipping ${tokens.length} pushes`,
      );

      return tokens.map((pushToken) => ({
        pushToken,
        success: false,
      }));
    }

    const results: PushSendResult[] = [];

    for (
      let index = 0;
      index < tokens.length;
      index += 500
    ) {
      const batchTokens = tokens.slice(
        index,
        index + 500,
      );

      try {
        const response =
          await this.messaging.sendEachForMulticast({
            tokens: batchTokens,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: payload.data,
          });

        response.responses.forEach(
          (result, responseIndex) => {
            const pushToken =
              batchTokens[responseIndex];

            if (result.success) {
              results.push({
                pushToken,
                success: true,
              });

              return;
            }

            const code = result.error?.code;

            results.push({
              pushToken,
              success: false,
              shouldInvalidateToken:
                code ===
                  'messaging/registration-token-not-registered' ||
                code ===
                  'messaging/invalid-registration-token',
            });
          },
        );
      } catch (error) {
        this.logger.error(
          `FCM batch send failed for ${batchTokens.length} devices`,
          error instanceof Error
            ? error.stack
            : String(error),
        );

        results.push(
          ...batchTokens.map((pushToken) => ({
            pushToken,
            success: false,
          })),
        );
      }
    }

    return results;
  }

  private createMessagingClient(): Messaging | null {
    const encodedServiceAccount =
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!encodedServiceAccount) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_JSON not configured',
      );

      return null;
    }

    try {
      const decoded = Buffer.from(
        encodedServiceAccount,
        'base64',
      ).toString('utf8');

      const serviceAccount = JSON.parse(
        decoded,
      ) as FirebaseServiceAccount;

      if (
        !serviceAccount.project_id ||
        !serviceAccount.client_email ||
        !serviceAccount.private_key
      ) {
        throw new Error(
          'Firebase service account is missing required fields',
        );
      }

      const app =
        this.getOrCreateFirebaseApp(serviceAccount);

      return getMessaging(app);
    } catch (error) {
      this.logger.error(
        'Failed to initialize Firebase Admin',
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return null;
    }
  }

  private getOrCreateFirebaseApp(
    serviceAccount: FirebaseServiceAccount,
  ): App {
    const existingApp = getApps()[0];

    if (existingApp) {
      return existingApp;
    }

    return initializeApp({
      credential: cert(
        serviceAccount as ServiceAccount,
      ),
    });
  }
}
