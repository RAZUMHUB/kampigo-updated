import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ALERT_FANOUT_QUEUE, AlertFanoutJobPayload } from './notification-queue.constants';
import { PrismaService } from '../common/prisma/prisma.service';
import { DevicesService } from './devices/devices.service';
import { FcmProvider } from './fcm/fcm.provider';

/**
 * Fans a purchased UniversityAlert out to eligible push devices.
 *
 * Isolation guarantee: the device query is filtered by `alert.universityId`,
 * which was itself resolved server-side (never client-supplied) at purchase
 * time - so this worker can never leak an alert across university tenants
 * even if it wanted to.
 *
 * A notification is only counted as "sent" once the provider call returns
 * success for that token; queuing alone never counts as delivered.
 */
@Processor(ALERT_FANOUT_QUEUE)
export class AlertFanoutProcessor extends WorkerHost {
  private readonly logger = new Logger('AlertFanoutProcessor');

  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
    private readonly fcm: FcmProvider,
  ) {
    super();
  }

  async process(job: Job<AlertFanoutJobPayload>): Promise<void> {
    const alert = await this.prisma.universityAlert.findUnique({ where: { id: job.data.alertId } });
    if (!alert) return;
    if (alert.status === 'SENT') return; // idempotent - already processed

    const devices = await this.devicesService.getEligibleDevices(alert.universityId);
    const tokens = devices.map((d: any) => d.pushToken);

    const results = await this.fcm.sendBatch(tokens, {
      title: 'University Lost Item Alert',
      body: alert.messagePreview,
      data: { alertId: alert.id, type: 'UNIVERSITY_LOST_ITEM_ALERT' },
    });

    const sentCount = results.filter((r: any) => r.success).length;
    const failedCount = results.length - sentCount;

    for (const result of results) {
      if (result.shouldInvalidateToken) {
        await this.devicesService.markTokenInvalid(result.pushToken);
      }
    }

    // Deduped in-app notifications for each recipient with an eligible device.
    for (const device of devices) {
      await this.prisma.notification.upsert({
        where: { userId_dedupeKey: { userId: device.userId, dedupeKey: `university-alert:${alert.id}` } },
        create: {
          userId: device.userId,
          type: 'UNIVERSITY_LOST_ITEM_ALERT',
          title: 'University Lost Item Alert',
          body: alert.messagePreview,
          dedupeKey: `university-alert:${alert.id}`,
          data: { alertId: alert.id },
        },
        update: {},
      });
    }

    await this.prisma.universityAlert.update({
      where: { id: alert.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        eligibleDeviceCount: devices.length,
        sentCount,
        failedCount,
      },
    });

    this.logger.log(`Alert ${alert.id} fanout complete: sent=${sentCount} failed=${failedCount}`);
  }
}
