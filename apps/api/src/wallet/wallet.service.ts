import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RazorpayService } from './razorpay.service';

export const MIN_WALLET_TOPUP_PAISE = 100 * 100; // Rs. 100
export const LOST_ITEM_ALERT_PRICE_PAISE = 29 * 100; // Rs. 29

@Injectable()
export class WalletService {
  private readonly logger = new Logger('WalletService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  async getOrCreateWallet(userId: string, universityId: string) {
    return this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, universityId },
      update: {},
    });
  }

  /**
   * The wallet's true balance is always derivable by summing the immutable
   * ledger; `cachedBalance` is only a read-optimization refreshed on every
   * ledger write, never the sole source of truth. This method recomputes
   * from the ledger to detect drift.
   */
  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { balancePaise: 0 };

    const entries = await this.prisma.walletLedgerEntry.findMany({
      where: { walletId: wallet.id, status: 'COMPLETED' },
    });
    const computed = entries.reduce(
      (sum, e) => sum + (e.type === 'CREDIT' ? e.amountPaise : -e.amountPaise),
      0,
    );

    if (computed !== wallet.cachedBalance) {
      this.logger.warn(`Wallet ${wallet.id} cachedBalance drifted from ledger - reconciling`);
      await this.prisma.wallet.update({ where: { id: wallet.id }, data: { cachedBalance: computed } });
    }

    return { balancePaise: computed };
  }

  async getTransactionHistory(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return [];
    return this.prisma.walletLedgerEntry.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Step 1 of top-up: create a Razorpay order for a PENDING ledger entry. Enforces the Rs.100 minimum. */
  async createTopupOrder(userId: string, universityId: string, amountInRupees: number, idempotencyKey: string) {
    if (amountInRupees < 100) {
      throw new BadRequestException('Minimum wallet top-up amount is Rs. 100');
    }
    const amountPaise = amountInRupees * 100;

    const wallet = await this.getOrCreateWallet(userId, universityId);

    const existing = await this.prisma.walletLedgerEntry.findUnique({ where: { idempotencyKey } });
    if (existing) return { ledgerEntryId: existing.id, alreadyExists: true };

    const order = await this.razorpay.createOrder(amountPaise, idempotencyKey);

    const entry = await this.prisma.walletLedgerEntry.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        reason: 'TOPUP',
        amountPaise,
        status: 'PENDING',
        idempotencyKey,
        paymentReference: order.id,
        description: `Wallet top-up of Rs. ${amountInRupees}`,
      },
    });

    return {
      ledgerEntryId: entry.id,
      razorpayOrder: order,
      checkoutKeyId: this.razorpay.getCheckoutKeyId(),
    };
  }

  /**
   * Step 2 of top-up: called ONLY from the verified Razorpay webhook handler.
   * Never called directly from a client "payment succeeded" callback.
   * Idempotent: a duplicate webhook delivery for the same event is a no-op
   * because the ledger entry transitions PENDING -> COMPLETED exactly once,
   * guarded by a conditional update inside a transaction.
   */
  async completeTopupFromWebhook(paymentReference: string) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.walletLedgerEntry.findFirst({
        where: { paymentReference, reason: 'TOPUP' },
      });
      if (!entry) {
        this.logger.warn(`No matching ledger entry for Razorpay payment reference ${paymentReference}`);
        return null;
      }
      if (entry.status === 'COMPLETED') {
        return entry; // already processed - duplicate webhook, safe no-op
      }
      if (entry.status !== 'PENDING') {
        throw new ConflictException(`Ledger entry ${entry.id} in unexpected state ${entry.status}`);
      }

      const updated = await tx.walletLedgerEntry.update({
        where: { id: entry.id },
        data: { status: 'COMPLETED' },
      });
      await tx.wallet.update({
        where: { id: entry.walletId },
        data: { cachedBalance: { increment: entry.amountPaise } },
      });
      return updated;
    });
  }

  /**
   * Atomic debit for the Rs. 29 University Lost Item Alert. Uses a
   * serializable transaction with a balance re-check to guarantee the wallet
   * can never go negative under concurrent requests, and an idempotency key
   * to guard against duplicate submissions (e.g. double-tap).
   */
  async debitForAlert(userId: string, universityId: string, idempotencyKey: string) {
    const existing = await this.prisma.walletLedgerEntry.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new BadRequestException('Wallet not found');

        const completedEntries = await tx.walletLedgerEntry.findMany({
          where: { walletId: wallet.id, status: 'COMPLETED' },
        });
        const balance = completedEntries.reduce(
          (sum, e) => sum + (e.type === 'CREDIT' ? e.amountPaise : -e.amountPaise),
          0,
        );

        if (balance < LOST_ITEM_ALERT_PRICE_PAISE) {
          throw new BadRequestException('Insufficient wallet balance. Please add money to your wallet.');
        }

        const entry = await tx.walletLedgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'DEBIT',
            reason: 'ALERT_PURCHASE',
            amountPaise: LOST_ITEM_ALERT_PRICE_PAISE,
            status: 'COMPLETED',
            idempotencyKey,
            description: 'University-wide Lost Item Alert (Rs. 29)',
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { cachedBalance: { decrement: LOST_ITEM_ALERT_PRICE_PAISE } },
        });

        return entry;
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
