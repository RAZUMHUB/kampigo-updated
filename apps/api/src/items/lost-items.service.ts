import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateLostItemDto } from './dto/create-lost-item.dto';
import { SearchItemsDto } from './dto/search-items.dto';
import { MatchingProducer } from '../matching/matching.producer';
import { FieldEncryptionService } from '../common/encryption/field-encryption.service';
import { toPublicLostItem } from './items.serializer';

const QUICK_MATCH_TIMEOUT_MS = 1200;

@Injectable()
export class LostItemsService {
  private readonly logger = new Logger('LostItemsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingProducer: MatchingProducer,
    private readonly encryption: FieldEncryptionService,
  ) {}

  async create(userId: string, universityId: string, dto: CreateLostItemDto) {
    // Private ownership details are encrypted at the field level before storage.
    const privateDetails = dto.privateDetails
      ? Object.fromEntries(
          Object.entries(dto.privateDetails)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, this.encryption.encrypt(String(v))]),
        )
      : undefined;

    const item = await this.prisma.lostItem.create({
      data: {
        universityId,
        ownerId: userId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        brand: dto.brand,
        model: dto.model,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        distinctiveMarks: dto.distinctiveMarks,
        campusId: dto.campusId,
        buildingId: dto.buildingId,
        floorOrZone: dto.floorOrZone,
        nearbyLandmark: dto.nearbyLandmark,
        lostDate: new Date(dto.lostDate),
        lostTimeApprox: dto.lostTimeApprox,
        privateDetails,
      },
    });

    // Quick, best-effort pre-publish match search. Never blocks publishing.
    const quickMatches = await this.quickMatchSearch(universityId, item.categoryId, item.campusId).catch(
      (err) => {
        this.logger.warn(`Quick match search failed, continuing anyway: ${err.message}`);
        return [];
      },
    );

    // Full background matching always runs regardless of quick-match outcome.
    await this.matchingProducer.enqueueItemForMatching({
      itemType: 'LOST',
      itemId: item.id,
      itemRevision: item.revision,
      universityId,
    });

    return { item: toPublicLostItem(item), quickMatches };
  }

  private async quickMatchSearch(universityId: string, categoryId: string | null, campusId: string | null) {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('quick match timeout')), QUICK_MATCH_TIMEOUT_MS),
    );
    const query = this.prisma.foundItem.findMany({
      where: {
        universityId,
        status: 'ACTIVE',
        ...(categoryId ? { categoryId } : {}),
        ...(campusId ? { campusId } : {}),
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { images: { take: 1 } },
    });
    return Promise.race([query, timeout]);
  }

  async findById(id: string, requesterId: string, requesterUniversityId: string) {
    const item = await this.prisma.lostItem.findUnique({ where: { id }, include: { images: true } });
    if (!item || item.universityId !== requesterUniversityId) {
      throw new NotFoundException('Lost item not found');
    }
    // Public DTO strips privateDetails unconditionally; only the owner ever
    // sees them, and even then via a separate explicit endpoint - never in
    // the general item payload.
    return toPublicLostItem(item, item.ownerId === requesterId);
  }

  async search(universityId: string, dto: SearchItemsDto) {
    const where: any = { universityId };
    if (dto.categoryId) where.categoryId = dto.categoryId;
    if (dto.campusId) where.campusId = dto.campusId;
    if (dto.status) where.status = dto.status;
    if (dto.brand) where.brand = { contains: dto.brand, mode: 'insensitive' };
    if (dto.color) {
      where.OR = [
        { primaryColor: { contains: dto.color, mode: 'insensitive' } },
        { secondaryColor: { contains: dto.color, mode: 'insensitive' } },
      ];
    }
    if (dto.q) {
      where.OR = [
        ...(where.OR ?? []),
        { title: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
      ];
    }
    if (dto.dateFrom || dto.dateTo) {
      where.lostDate = {};
      if (dto.dateFrom) where.lostDate.gte = new Date(dto.dateFrom);
      if (dto.dateTo) where.lostDate.lte = new Date(dto.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.lostItem.findMany({
        where,
        include: { images: { take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prisma.lostItem.count({ where }),
    ]);

    return { items: items.map((i) => toPublicLostItem(i)), total, page: dto.page, pageSize: dto.pageSize };
  }

  /** Edits bump `revision`, invalidating stale ML jobs/matches per the revision-handling requirement. */
  async update(id: string, userId: string, universityId: string, patch: Partial<CreateLostItemDto>) {
    const existing = await this.prisma.lostItem.findUnique({ where: { id } });
    if (!existing || existing.universityId !== universityId) throw new NotFoundException();
    if (existing.ownerId !== userId) throw new ForbiddenException();

    const item = await this.prisma.lostItem.update({
      where: { id },
      data: {
        ...patch,
        lostDate: patch.lostDate ? new Date(patch.lostDate) : undefined,
        privateDetails: undefined, // private details updated via a dedicated endpoint only
        revision: { increment: 1 },
      },
    });

    await this.matchingProducer.enqueueItemForMatching({
      itemType: 'LOST',
      itemId: item.id,
      itemRevision: item.revision,
      universityId,
    });

    return toPublicLostItem(item, true);
  }
}
