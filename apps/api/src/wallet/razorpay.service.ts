import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Thin wrapper around the Razorpay Orders + Webhook APIs.
 *
 * IMPORTANT (payment architecture): the frontend "payment success" callback
 * must NEVER directly credit the wallet. It only confirms the checkout UI
 * flow completed; actual wallet credit happens exclusively in
 * WalletService.handleVerifiedTopup, invoked from the webhook handler after
 * verifyWebhookSignature() succeeds. This defends against a compromised or
 * spoofed client claiming payment success without Razorpay actually
 * capturing funds.
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger('RazorpayService');
  private readonly keyId = process.env.RAZORPAY_KEY_ID;
  private readonly keySecret = process.env.RAZORPAY_KEY_SECRET;
  private readonly webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  getCheckoutKeyId(): string | null {
    return this.keyId ?? null;
  }

  async createOrder(amountInPaise: number, receipt: string) {
    if (!this.keyId || !this.keySecret) {
      this.logger.warn('Razorpay credentials not configured - returning a mock order for local dev');
      return { id: `order_mock_${receipt}`, amount: amountInPaise, currency: 'INR', status: 'created' };
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt }),
    });
    if (!res.ok) throw new Error(`Razorpay order creation failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  /** Verifies the `X-Razorpay-Signature` header against the raw webhook body. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET not configured - rejecting webhook by default in this state');
      return false;
    }
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const signatureBuffer = Buffer.from(signatureHeader, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, signatureBuffer);
  }
}
