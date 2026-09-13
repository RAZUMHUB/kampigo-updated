import type { Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { ALERT_FANOUT_QUEUE } from './notification-queue.constants';

/**
 * In-app notification creation with deduplication (via the unique
 * (userId, dedupeKey) constraint) and the entry points that queue
 * background push fan-out work.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(ALERT_FANOUT_QUEUE) private readonly alertQueue: Queue,
  ) {}

  private async createDeduped(params: {
    userId: string;
    type: any;
    title: string;
    body: string;
    dedupeKey: string;
    data?: Record<string, unknown>;
  }) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          body: params.body,
          dedupeKey: params.dedupeKey,
          data: params.data as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Unique constraint violation on (userId, dedupeKey) - already notified, no-op.
        return null;
      }
      throw err;
    }
  }

  async notifyMatch(matchId: string) {
    const match = await this.prisma.itemMatch.findUnique({
      where: { id: matchId },
      include: { lostItem: true, foundItem: true },
    });
    if (!match) return;

    const tierLabel = match.tier === 'HIGHLY_LIKELY' ? 'Highly Likely Match' : 'Possible Match';
    const notificationType = match.tier === 'HIGHLY_LIKELY' ? 'HIGH_CONFIDENCE_MATCH' : 'POSSIBLE_MATCH';

    await this.createDeduped({
      userId: match.lostItem.ownerId,
      type: notificationType,
      title: tierLabel,
      body: `A ${tierLabel.toLowerCase()} was found for your lost item "${match.lostItem.title}".`,
      dedupeKey: `match:${match.id}:lost-owner`,
      data: { matchId: match.id, lostItemId: match.lostItemId, foundItemId: match.foundItemId },
    });

    await this.createDeduped({
      userId: match.foundItem.finderId,
      type: notificationType,
      title: tierLabel,
      body: `Your found item report "${match.foundItem.title}" ${tierLabel.toLowerCase()}es a lost item report.`,
      dedupeKey: `match:${match.id}:found-finder`,
      data: { matchId: match.id, lostItemId: match.lostItemId, foundItemId: match.foundItemId },
    });
  }

  async notifyClaimReceived(finderId: string, claimId: string) {
    await this.createDeduped({
      userId: finderId,
      type: 'CLAIM_RECEIVED',
      title: 'New claim received',
      body: 'Someone has submitted a claim on an item you reported as found.',
      dedupeKey: `claim-received:${claimId}`,
      data: { claimId },
    });
  }

  async notifyNewChatMessage(recipientId: string, conversationId: string) {
    await this.createDeduped({
      userId: recipientId,
      type: 'NEW_CHAT_MESSAGE',
      title: 'New message',
      body: 'You have a new message.',
      dedupeKey: `chat:${conversationId}:${Date.now()}`, // chat notifications are not deduped long-term by design
      data: { conversationId },
    });
  }

  /** Queues the background fan-out job for a purchased UniversityAlert (idempotent by alertId). */
  async enqueueUniversityAlertFanout(alertId: string) {
    await this.alertQueue.add(
      'fanout',
      { alertId },
      { jobId: `alert-fanout:${alertId}`, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }
}
