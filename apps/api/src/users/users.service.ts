import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        role: true,
        institutionalEmail: true,
        universityId: true,
        university: { select: { name: true, slug: true } },
        createdAt: true,
      },
    });
  }

  async myLostItems(userId: string, universityId: string) {
    return this.prisma.lostItem.findMany({
      where: { ownerId: userId, universityId },
      orderBy: { createdAt: 'desc' },
      include: { images: true },
    });
  }

  async myFoundItems(userId: string, universityId: string) {
    return this.prisma.foundItem.findMany({
      where: { finderId: userId, universityId },
      orderBy: { createdAt: 'desc' },
      include: { images: true },
    });
  }
}
