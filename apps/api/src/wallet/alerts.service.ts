import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WalletService } from './wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

const ALERT_COOLDOWN_HOURS = 6;

/**
 * University-wide paid Lost Item Alert purchase flow (Rs. 29).
 *
 * Hard requirements enforced here:
 *  - only the item's owner may purchase an alert for it
 *  - item must be ACTIVE
 *  - the notification target university is ALWAYS resolved server-side from
 *    the LostItem + authenticated owner - a client can never supply or
 *    influence the target university
 *  - one alert per item per cooldown window, to prevent notification spam
 *  - atomic wallet debit before the alert/notification fan-out is queued
 */
@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly notifications: NotificationsService,
  ) {}

  async purchaseAlert(userId: string, universityId: string, lostItemId: string, idempotencyKey: string) {
    const existingAlert = await this.prisma.universityAlert.findUnique({ where: { idempotencyKey } });
    if (existingAlert) return existingAlert;

    const item = await this.prisma.lostItem.findUnique({ where: { id: lostItemId } });
    if (!item || item.universityId !== universityId) throw new BadRequestException('Lost item not found');
    if (item.ownerId !== userId) throw new ForbiddenException('Only the report owner may purchase this alert');
    if (item.status !== 'ACTIVE') throw new BadRequestException('Lost item report is not active');

    const cooldownStart = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);
    const recentAlert = await this.prisma.universityAlert.findFirst({
      where: { lostItemId, createdAt: { gte: cooldownStart } },
    });
    if (recentAlert) {
      throw new BadRequestException(
        `An alert was already sent for this item recently. Please wait before sending another.`,
      );
    }

    // Debit happens first and atomically; if this throws (insufficient balance),
    // no alert/notification is ever created.
    const ledgerEntry = await this.walletService.debitForAlert(userId, universityId, idempotencyKey);

    const messagePreview = this.buildMessagePreview(item);

    // The authoritative notification target is `item.universityId` (== universityId,
    // already re-verified above) - never a client-supplied value.
    const alert = await this.prisma.universityAlert.create({
      data: {
        universityId: item.universityId,
        lostItemId: item.id,
        purchasedById: userId,
        ledgerEntryId: ledgerEntry.id,
        idempotencyKey,
        status: 'PENDING',
        messagePreview,
      },
    });

    await this.notifications.enqueueUniversityAlertFanout(alert.id);

    return alert;
  }

  private buildMessagePreview(item: { title: string; nearbyLandmark: string | null; lostTimeApprox: string | null }) {
    // Generated strictly from the report; never arbitrary free text from the user,
    // and never includes private ownership details.
    const location = item.nearbyLandmark ? ` near ${item.nearbyLandmark}` : '';
    const time = item.lostTimeApprox ? ` around ${item.lostTimeApprox}` : '';
    return `Lost Item Alert: ${item.title} lost${location}${time}. Open the app to view details.`;
  }
}
