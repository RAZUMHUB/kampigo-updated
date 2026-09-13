import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFoundItemDto } from './dto/create-found-item.dto';
import { SearchItemsDto } from './dto/search-items.dto';
import { MatchingProducer } from '../matching/matching.producer';
import { toPublicFoundItem } from './items.serializer';

@Injectable()
export class FoundItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingProducer: MatchingProducer,
  ) {}

  async create(userId: string, universityId: string, dto: CreateFoundItemDto) {
    const item = await this.prisma.foundItem.create({
      data: {
        universityId,
        finderId: userId,
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
        foundDate: new Date(dto.foundDate),
        foundTimeApprox: dto.foundTimeApprox,
        custodyStatus: dto.custodyStatus,
        authorityOffice: dto.authorityOffice,
        storageLocation: dto.storageLocation,
        recoveryRefNumber: dto.recoveryRefNumber,
      },
    });

    await this.matchingProducer.enqueueItemForMatching({
      itemType: 'FOUND',
      itemId: item.id,
      itemRevision: item.revision,
      universityId,
    });

    return toPublicFoundItem(item);
  }

  async findById(id: string, requesterUniversityId: string) {
    const item = await this.prisma.foundItem.findUnique({ where: { id }, include: { images: true } });
    if (!item || item.universityId !== requesterUniversityId) throw new NotFoundException('Found item not found');
    return toPublicFoundItem(item);
  }

  async search(universityId: string, dto: SearchItemsDto) {
    const where: any = { universityId };
    if (dto.categoryId) where.categoryId = dto.categoryId;
    if (dto.campusId) where.campusId = dto.campusId;
    if (dto.status) where.status = dto.status;
    if (dto.brand) where.brand = { contains: dto.brand, mode: 'insensitive' };
    if (dto.q) {
      where.OR = [
        { title: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.foundItem.findMany({
        where,
        include: { images: { take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prisma.foundItem.count({ where }),
    ]);

    return { items: items.map(toPublicFoundItem), total, page: dto.page, pageSize: dto.pageSize };
  }

  async updateCustody(id: string, universityId: string, custodyStatus: string, refNumber?: string) {
    const existing = await this.prisma.foundItem.findUnique({ where: { id } });
    if (!existing || existing.universityId !== universityId) throw new NotFoundException();

    return this.prisma.foundItem.update({
      where: { id },
      data: { custodyStatus: custodyStatus as any, recoveryRefNumber: refNumber, revision: { increment: 1 } },
    });
  }
}
