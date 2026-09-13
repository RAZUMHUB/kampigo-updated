import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RentalCategory } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';

@Injectable()
export class RentalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, universityId: string, dto: CreateRentalDto) {
    return this.prisma.rental.create({
      data: {
        universityId,
        ownerId: userId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        campusId: dto.campusId,
        pricePerDay: dto.pricePerDay,
        securityDeposit: dto.securityDeposit ?? 0,
        available: dto.available ?? true,
      },
    });
  }

  /** All available rentals, scoped to the caller's own university. */
  async findAll(universityId: string, category?: RentalCategory) {
    return this.prisma.rental.findMany({
      where: { universityId, ...(category ? { category } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, displayName: true } },
      },
    });
  }

  /** Listings owned by the caller, regardless of availability. */
  async findMine(userId: string, universityId: string) {
    return this.prisma.rental.findMany({
      where: { ownerId: userId, universityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, universityId: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, displayName: true } },
      },
    });

    if (!rental || rental.universityId !== universityId) {
      throw new NotFoundException('Rental not found');
    }

    return rental;
  }

  private async findOwned(id: string, userId: string, universityId: string) {
    const rental = await this.prisma.rental.findUnique({ where: { id } });

    if (!rental || rental.universityId !== universityId) {
      throw new NotFoundException('Rental not found');
    }

    if (rental.ownerId !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }

    return rental;
  }

  async update(
    id: string,
    userId: string,
    universityId: string,
    dto: UpdateRentalDto,
  ) {
    await this.findOwned(id, userId, universityId);

    return this.prisma.rental.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string, universityId: string) {
    await this.findOwned(id, userId, universityId);

    return this.prisma.rental.delete({
      where: { id },
    });
  }
}
