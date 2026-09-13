import { Injectable } from '@nestjs/common';
import { ItemStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard() {
    const [
      lostItems,
      returnedItems,
      students,
      recentLostItems,
      recentFoundItems,
    ] = await Promise.all([
      this.prisma.lostItem.count(),

      this.prisma.lostItem.count({
        where: {
          status: ItemStatus.RECOVERED,
        },
      }),

      this.prisma.user.count(),

      this.prisma.lostItem.findMany({
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
