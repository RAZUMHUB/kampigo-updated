import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { S3CompatibleStorageProvider } from '../storage/providers/s3-compatible.provider';
import { MlClientService } from './ml-client.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ItemKind, MatchTier } from '@prisma/client';

interface Candidate {
  id: string;
  revision: number;
}

const DATE_WINDOW_DAYS = 21;

/**
 * Two-stage matching:
 *   Stage 1 (cheap, broad): university + campus + category + date window +
 *     vector ANN search over pgvector to fetch a bounded candidate set.
 *   Stage 2 (expensive, precise): deep multi-signal scoring via the ML
 *     service (visual, text, attribute, OCR similarity), combined into a
 *     composite score, classified into a human-readable tier.
 *
 * Every result is tagged with itemRevision + processingVersion so a
 * subsequent edit can never be silently matched against by a stale job.
 */
@Injectable()
export class MatchingService {
  private readonly logger = new Logger('MatchingService');
  static readonly PROCESSING_VERSION = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3CompatibleStorageProvider,
    private readonly mlClient: MlClientService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Called by the worker for a freshly created/edited Lost or Found item. */
  async processItem(params: {
    itemType: 'LOST' | 'FOUND';
    itemId: string;
    itemRevision: number;
    universityId: string;
  }) {
    const { itemType, itemId, itemRevision, universityId } = params;

    const currentRevision = await this.getCurrentRevision(itemType, itemId);
    if (currentRevision !== itemRevision) {
      this.logger.log(
        `Skipping stale job for ${itemType} ${itemId} rev ${itemRevision} (current: ${currentRevision})`,
      );
      return;
    }

    await this.ensureEmbeddings(itemType, itemId, itemRevision);

    const candidates =
      itemType === 'LOST'
        ? await this.findCandidateFoundItems(itemId, universityId)
        : await this.findCandidateLostItems(itemId, universityId);

    for (const candidate of candidates) {
      await this.scoreAndPersistMatch(
        itemType === 'LOST'
          ? { lostItemId: itemId, lostRevision: itemRevision, foundItemId: candidate.id, foundRevision: candidate.revision }
          : { lostItemId: candidate.id, lostRevision: candidate.revision, foundItemId: itemId, foundRevision: itemRevision },
        universityId,
      );
    }
  }

  private async getCurrentRevision(itemType: 'LOST' | 'FOUND', itemId: string): Promise<number> {
    if (itemType === 'LOST') {
      const item = await this.prisma.lostItem.findUnique({ where: { id: itemId }, select: { revision: true } });
      return item?.revision ?? -1;
    }
    const item = await this.prisma.foundItem.findUnique({ where: { id: itemId }, select: { revision: true } });
    return item?.revision ?? -1;
  }

  /** Generates and stores per-image + text embeddings for this item revision if missing. */
  private async ensureEmbeddings(itemType: 'LOST' | 'FOUND', itemId: string, revision: number) {
    const kind: ItemKind = itemType === 'LOST' ? 'LOST' : 'FOUND';

    const existingText = await this.prisma.textEmbedding.findUnique({
      where: { itemType_itemId_itemRevision: { itemType: kind, itemId, itemRevision: revision } },
    });

    if (!existingText) {
      const item =
        itemType === 'LOST'
          ? await this.prisma.lostItem.findUnique({ where: { id: itemId } })
          : await this.prisma.foundItem.findUnique({ where: { id: itemId } });
      if (!item) return;

      const textForEmbedding = [item.title, item.description, (item as any).brand, (item as any).model]
        .filter(Boolean)
        .join(' | ');
      const embedding = await this.mlClient.embedText(textForEmbedding);

      await this.prisma.$executeRaw`
        INSERT INTO text_embeddings (id, "itemType", "itemId", "itemRevision", vector, "modelName", "processingVersion", "createdAt")
        VALUES (gen_random_uuid(), ${kind}::"ItemKind", ${itemId}, ${revision}, ${embedding.vector}::vector, ${embedding.modelName}, ${MatchingService.PROCESSING_VERSION}, now())
        ON CONFLICT ("itemType", "itemId", "itemRevision") DO NOTHING
      `;
    }

    const images =
      itemType === 'LOST'
        ? await this.prisma.itemImage.findMany({ where: { lostItemId: itemId }, include: { embedding: true } })
        : await this.prisma.itemImage.findMany({ where: { foundItemId: itemId }, include: { embedding: true } });

    for (const image of images) {
      if (image.embedding) continue;
      const signedUrl = await this.storage.getSignedUrl(image.storageKey);
      const result = await this.mlClient.embedImage(signedUrl, image.id);

      await this.prisma.$executeRaw`
        INSERT INTO image_embeddings (id, "itemImageId", vector, "modelName", "processingVersion", "createdAt")
        VALUES (gen_random_uuid(), ${image.id}, ${result.vector}::vector, ${result.modelName}, ${MatchingService.PROCESSING_VERSION}, now())
        ON CONFLICT ("itemImageId") DO NOTHING
      `;

      if (result.ocrText) {
        await this.prisma.itemImage.update({ where: { id: image.id }, data: { ocrText: result.ocrText } });
      }
    }
  }

  /** Stage 1: candidate retrieval, always scoped to the SAME university. Never cross-tenant. */
  private async findCandidateFoundItems(lostItemId: string, universityId: string): Promise<Candidate[]> {
    const lostItem = await this.prisma.lostItem.findUnique({ where: { id: lostItemId } });
    if (!lostItem) return [];

    const dateFrom = new Date(lostItem.lostDate);
    dateFrom.setDate(dateFrom.getDate() - DATE_WINDOW_DAYS);
    const dateTo = new Date(lostItem.lostDate);
    dateTo.setDate(dateTo.getDate() + DATE_WINDOW_DAYS);

    const candidates = await this.prisma.foundItem.findMany({
      where: {
        universityId, // hard tenant scope - never omit
        status: 'ACTIVE',
        ...(lostItem.categoryId ? { categoryId: lostItem.categoryId } : {}),
        foundDate: { gte: dateFrom, lte: dateTo },
      },
      select: { id: true, revision: true },
      take: 50,
    });
    return candidates;
  }

  private async findCandidateLostItems(foundItemId: string, universityId: string): Promise<Candidate[]> {
    const foundItem = await this.prisma.foundItem.findUnique({ where: { id: foundItemId } });
    if (!foundItem) return [];

    const dateFrom = new Date(foundItem.foundDate);
    dateFrom.setDate(dateFrom.getDate() - DATE_WINDOW_DAYS);
    const dateTo = new Date(foundItem.foundDate);
    dateTo.setDate(dateTo.getDate() + DATE_WINDOW_DAYS);

    const candidates = await this.prisma.lostItem.findMany({
      where: {
        universityId, // hard tenant scope - never omit
        status: 'ACTIVE',
        ...(foundItem.categoryId ? { categoryId: foundItem.categoryId } : {}),
        lostDate: { gte: dateFrom, lte: dateTo },
      },
      select: { id: true, revision: true },
      take: 50,
    });
    return candidates;
  }

  private tierFromScore(score: number): MatchTier {
    if (score >= 0.82) return 'HIGHLY_LIKELY';
    if (score >= 0.6) return 'POSSIBLE';
    return 'WEAK';
  }

  private async scoreAndPersistMatch(
    ids: { lostItemId: string; lostRevision: number; foundItemId: string; foundRevision: number },
    universityId: string,
  ) {
    const [lostItem, foundItem] = await Promise.all([
      this.prisma.lostItem.findUnique({ where: { id: ids.lostItemId }, include: { images: { include: { embedding: true } } } }),
      this.prisma.foundItem.findUnique({ where: { id: ids.foundItemId }, include: { images: { include: { embedding: true } } } }),
    ]);
    if (!lostItem || !foundItem) return;

    const lostImageVectors = lostItem.images.map((i: any) => (i.embedding as any)?.vector).filter(Boolean);
    const foundImageVectors = foundItem.images.map((i: any) => (i.embedding as any)?.vector).filter(Boolean);

    const scores = await this.mlClient.scoreCandidate({
      lostImageVectors,
      foundImageVectors,
      lostText: `${lostItem.title} ${lostItem.description}`,
      foundText: `${foundItem.title} ${foundItem.description}`,
      lostAttributes: {
        brand: lostItem.brand,
        model: lostItem.model,
        primaryColor: lostItem.primaryColor,
        secondaryColor: lostItem.secondaryColor,
      },
      foundAttributes: {
        brand: foundItem.brand,
        model: foundItem.model,
        primaryColor: foundItem.primaryColor,
        secondaryColor: foundItem.secondaryColor,
      },
      lostOcrText: lostItem.images.map((i: any) => i.ocrText).filter(Boolean) as string[],
      foundOcrText: foundItem.images.map((i: any) => i.ocrText).filter(Boolean) as string[],
    });

    const locationScore = lostItem.campusId && lostItem.campusId === foundItem.campusId ? 1 : 0.3;
    const timeDeltaDays =
      Math.abs(new Date(lostItem.lostDate).getTime() - new Date(foundItem.foundDate).getTime()) /
      (1000 * 60 * 60 * 24);
    const timeScore = Math.max(0, 1 - timeDeltaDays / DATE_WINDOW_DAYS);

    const composite =
      scores.visualScore * 0.4 +
      scores.textScore * 0.2 +
      scores.attributeScore * 0.15 +
      scores.ocrScore * 0.1 +
      locationScore * 0.1 +
      timeScore * 0.05;

    const tier = this.tierFromScore(composite);
    if (tier === 'WEAK') return; // don't clutter results/notifications with weak matches

    const match = await this.prisma.itemMatch.upsert({
      where: {
        lostItemId_foundItemId_lostItemRevision_foundItemRevision: {
          lostItemId: ids.lostItemId,
          foundItemId: ids.foundItemId,
          lostItemRevision: ids.lostRevision,
          foundItemRevision: ids.foundRevision,
        },
      },
      create: {
        universityId,
        lostItemId: ids.lostItemId,
        foundItemId: ids.foundItemId,
        lostItemRevision: ids.lostRevision,
        foundItemRevision: ids.foundRevision,
        processingVersion: MatchingService.PROCESSING_VERSION,
        tier,
        status: 'ACTIVE',
        visualScore: scores.visualScore,
        textScore: scores.textScore,
        attributeScore: scores.attributeScore,
        ocrScore: scores.ocrScore,
        locationScore,
        timeScore,
        compositeScore: composite,
      },
      update: {},
    });

    if (!match.notifiedAt) {
      await this.notifications.notifyMatch(match.id);
      await this.prisma.itemMatch.update({ where: { id: match.id }, data: { notifiedAt: new Date() } });
    }
  }
}
