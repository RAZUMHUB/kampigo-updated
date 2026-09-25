import { Injectable } from '@nestjs/common';
import { ItemStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard(universityId: string) {
    const [
      lostItems,
      returnedItems,
      students,
      recentLostItems,
      recentFoundItems,
    ] = await Promise.all([
      this.prisma.lostItem.count({
        where: {
          universityId,
        },
      }),

      this.prisma.lostItem.count({
        where: {
          universityId,
          status: ItemStatus.RECOVERED,
        },
      }),

      this.prisma.user.count({
        where: {
          universityId,
        },
      }),

      this.prisma.lostItem.findMany({
        where: {
          universityId,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),

      this.prisma.foundItem.findMany({
        where: {
          universityId,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      stats: {
        lostItems,
        returnedItems,
        students,
        activeRides: 0,
        clothesListings: 0,
      },

      recentActivity: [
        ...recentLostItems.map(item => ({
          type: 'LOST',
          ...item,
        })),

        ...recentFoundItems.map(item => ({
          type: 'FOUND',
          ...item,
        })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      ),

      quickActions: [
        {
          title: 'Report Lost Item',
          path: '/report/lost',
        },
        {
          title: 'Report Found Item',
          path: '/report/found',
        },
      ],
    };
  }
}