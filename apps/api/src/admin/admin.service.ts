import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TenantStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // University Admin
  // ---------------------------------------------------------------------------

  async universityOverview(universityId: string) {
    const [
      lostCount,
      foundCount,
      activeAlerts,
      pendingClaims,
      openReports,
    ] = await Promise.all([
      this.prisma.lostItem.count({
        where: { universityId },
      }),
      this.prisma.foundItem.count({
        where: { universityId },
      }),
      this.prisma.universityAlert.count({
        where: {
          universityId,
          status: { in: ['PENDING', 'QUEUED'] },
        },
      }),
      this.prisma.claim.count({
        where: {
          foundItem: { universityId },
          status: { in: ['PENDING', 'VERIFICATION_REQUIRED'] },
        },
      }),
      this.countUniversityOpenReports(universityId),
    ]);

    return {
      lostCount,
      foundCount,
      activeAlerts,
      pendingClaims,
      openReports,
    };
  }

  async recoveryAnalytics(universityId: string) {
    const [totalLost, recovered] = await Promise.all([
      this.prisma.lostItem.count({
        where: { universityId },
      }),
      this.prisma.lostItem.count({
        where: {
          universityId,
          status: 'RECOVERED',
        },
      }),
    ]);

    return {
      totalLost,
      recovered,
      recoveryRate: totalLost ? recovered / totalLost : 0,
    };
  }

  async listAlertActivity(universityId: string) {
    return this.prisma.universityAlert.findMany({
      where: { universityId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listContentReports(universityId: string) {
    const reports = await this.prisma.contentReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            displayName: true,
            institutionalEmail: true,
            universityId: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            displayName: true,
            institutionalEmail: true,
            universityId: true,
          },
        },
      },
    });

    const targetIds = {
      lostItems: reports
        .filter((report) => report.targetType === 'LOST_ITEM')
        .map((report) => report.targetId),
      foundItems: reports
        .filter((report) => report.targetType === 'FOUND_ITEM')
        .map((report) => report.targetId),
      chatMessages: reports
        .filter((report) => report.targetType === 'CHAT_MESSAGE')
        .map((report) => report.targetId),
    };

    const [lostItems, foundItems, chatMessages] = await Promise.all([
      targetIds.lostItems.length
        ? this.prisma.lostItem.findMany({
            where: {
              id: { in: targetIds.lostItems },
              universityId,
            },
            select: { id: true },
          })
        : [],
      targetIds.foundItems.length
        ? this.prisma.foundItem.findMany({
            where: {
              id: { in: targetIds.foundItems },
              universityId,
            },
            select: { id: true },
          })
        : [],
      targetIds.chatMessages.length
        ? this.prisma.chatMessage.findMany({
            where: {
              id: { in: targetIds.chatMessages },
              conversation: {
                participants: {
                  some: {
                    user: { universityId },
                  },
                },
              },
            },
            select: { id: true },
          })
        : [],
    ]);

    const validTargets = new Set([
      ...lostItems.map((item) => `LOST_ITEM:${item.id}`),
      ...foundItems.map((item) => `FOUND_ITEM:${item.id}`),
      ...chatMessages.map((message) => `CHAT_MESSAGE:${message.id}`),
    ]);

    return reports.filter((report) => {
      if (report.reporter.universityId === universityId) {
        return true;
      }

      if (report.targetType === 'USER') {
        return report.reportedUser?.universityId === universityId;
      }

      return validTargets.has(`${report.targetType}:${report.targetId}`);
    });
  }

  async resolveContentReport(
    universityId: string,
    reportId: string,
    note: string,
  ) {
    const reports = await this.listContentReports(universityId);
    const report = reports.find((item) => item.id === reportId);

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const resolved = await tx.contentReport.update({
        where: { id: reportId },
        data: { resolved: true },
      });

      await tx.auditLog.create({
        data: {
          universityId,
          action: 'CONTENT_REPORT_RESOLVED',
          targetType: 'CONTENT_REPORT',
          targetId: reportId,
          metadata: {
            note: note.trim(),
          },
        },
      });

      return resolved;
    });
  }

  private async countUniversityOpenReports(universityId: string) {
    const reports = await this.prisma.contentReport.findMany({
      where: { resolved: false },
      select: {
        id: true,
        reporter: {
          select: { universityId: true },
        },
        reportedUser: {
          select: { universityId: true },
        },
        targetType: true,
        targetId: true,
      },
    });

    const directCount = reports.filter(
      (report) =>
        report.reporter.universityId === universityId ||
        report.reportedUser?.universityId === universityId,
    ).length;

    const remainingReports = reports.filter(
      (report) =>
        report.reporter.universityId !== universityId &&
        report.reportedUser?.universityId !== universityId &&
        ['LOST_ITEM', 'FOUND_ITEM', 'CHAT_MESSAGE'].includes(
          report.targetType,
        ),
    );

    if (!remainingReports.length) {
      return directCount;
    }

    const [lostItems, foundItems, chatMessages] = await Promise.all([
      this.prisma.lostItem.findMany({
        where: {
          id: {
            in: remainingReports
              .filter((report) => report.targetType === 'LOST_ITEM')
              .map((report) => report.targetId),
          },
          universityId,
        },
        select: { id: true },
      }),
      this.prisma.foundItem.findMany({
        where: {
          id: {
            in: remainingReports
              .filter((report) => report.targetType === 'FOUND_ITEM')
              .map((report) => report.targetId),
          },
          universityId,
        },
        select: { id: true },
      }),
      this.prisma.chatMessage.findMany({
        where: {
          id: {
            in: remainingReports
              .filter((report) => report.targetType === 'CHAT_MESSAGE')
              .map((report) => report.targetId),
          },
          conversation: {
            participants: {
              some: {
                user: { universityId },
              },
            },
          },
        },
        select: { id: true },
      }),
    ]);

    const targetIds = new Set([
      ...lostItems.map((item) => `LOST_ITEM:${item.id}`),
      ...foundItems.map((item) => `FOUND_ITEM:${item.id}`),
      ...chatMessages.map((message) => `CHAT_MESSAGE:${message.id}`),
    ]);

    return (
      directCount +
      remainingReports.filter((report) =>
        targetIds.has(`${report.targetType}:${report.targetId}`),
      ).length
    );
  }

  // ---------------------------------------------------------------------------
  // Campus Authority
  // ---------------------------------------------------------------------------

  async manageCampusAuthority(
    universityId: string,
    userId: string,
  ) {
    const user = await this.getUniversityUser(universityId, userId);

    if (
      user.role === UserRole.UNIVERSITY_ADMIN ||
      user.role === UserRole.PLATFORM_SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Privileged administrator role cannot be replaced with Campus Authority',
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Disabled users cannot be assigned as Campus Authority',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.CAMPUS_AUTHORITY },
      select: {
        id: true,
        displayName: true,
        institutionalEmail: true,
        universityId: true,
        role: true,
        isActive: true,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // University Admin: User / Account Controls
  // ---------------------------------------------------------------------------

  async listUniversityUsers(universityId: string) {
    return this.prisma.user.findMany({
      where: { universityId },
      select: {
        id: true,
        displayName: true,
        institutionalEmail: true,
        role: true,
        isActive: true,
        campusId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserStatus(
    universityId: string,
    userId: string,
    status: 'ACTIVE' | 'DISABLED',
  ) {
    const user = await this.getUniversityUser(universityId, userId);

    if (
      user.role === UserRole.UNIVERSITY_ADMIN ||
      user.role === UserRole.PLATFORM_SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Administrator accounts cannot be disabled from this endpoint',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: status === 'ACTIVE',
      },
      select: {
        id: true,
        displayName: true,
        institutionalEmail: true,
        role: true,
        isActive: true,
        universityId: true,
      },
    });
  }

  async updateUserRole(
    universityId: string,
    userId: string,
    role: UserRole,
  ) {
    const user = await this.getUniversityUser(universityId, userId);

    if (
      user.role === UserRole.PLATFORM_SUPER_ADMIN ||
      role === UserRole.PLATFORM_SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Platform Super Admin role cannot be managed by a University Admin',
      );
    }

    if (user.role === UserRole.UNIVERSITY_ADMIN) {
      throw new ForbiddenException(
        'University Admin accounts cannot be changed from this endpoint',
      );
    }

    if (role === UserRole.UNIVERSITY_ADMIN) {
      throw new ForbiddenException(
        'University Admin accounts can only be provisioned through a dedicated privileged workflow',
      );
    }

    if (
      !user.isActive &&
      role === UserRole.CAMPUS_AUTHORITY
    ) {
      throw new ForbiddenException(
        'Disabled users cannot be assigned as Campus Authority',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        displayName: true,
        institutionalEmail: true,
        role: true,
        isActive: true,
        universityId: true,
      },
    });
  }

  private async getUniversityUser(
    universityId: string,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        institutionalEmail: true,
        universityId: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.universityId !== universityId) {
      throw new ForbiddenException(
        'User does not belong to this university',
      );
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // Campus Authority scope
  // ---------------------------------------------------------------------------

  async authorityHeldItems(universityId: string) {
    return this.prisma.foundItem.findMany({
      where: {
        universityId,
        custodyStatus: {
          in: [
            'SUBMITTED_TO_SECURITY',
            'SUBMITTED_TO_OFFICE',
            'SECURED_BY_AUTHORITY',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Platform Super Admin
  // ---------------------------------------------------------------------------

  async listAllUniversities() {
    return this.prisma.university.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async onboardUniversity(name: string, slug: string) {
    const normalizedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();

    const existing = await this.prisma.university.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'A university with this slug already exists',
      );
    }

    return this.prisma.university.create({
      data: {
        name: normalizedName,
        slug: normalizedSlug,
        status: TenantStatus.ONBOARDING,
      },
    });
  }

  async setUniversityStatus(
    universityId: string,
    status: TenantStatus,
  ) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
      select: { id: true },
    });

    if (!university) {
      throw new NotFoundException('University not found');
    }

    return this.prisma.university.update({
      where: { id: universityId },
      data: { status },
    });
  }

  async platformAnalytics() {
    const [
      universities,
      users,
      lostItems,
      foundItems,
      matches,
      claims,
    ] = await Promise.all([
      this.prisma.university.count(),
      this.prisma.user.count(),
      this.prisma.lostItem.count(),
      this.prisma.foundItem.count(),
      this.prisma.itemMatch.count(),
      this.prisma.claim.count(),
    ]);

    return {
      universities,
      users,
      lostItems,
      foundItems,
      matches,
      claims,
    };
  }

  async paymentSystemHealth() {
    const [pendingTopups, failedTopups] = await Promise.all([
      this.prisma.walletLedgerEntry.count({
        where: {
          reason: 'TOPUP',
          status: 'PENDING',
        },
      }),
      this.prisma.walletLedgerEntry.count({
        where: {
          reason: 'TOPUP',
          status: 'FAILED',
        },
      }),
    ]);

    return {
      pendingTopups,
      failedTopups,
    };
  }

  async notificationSystemHealth() {
    const [pendingAlerts, failedAlerts] = await Promise.all([
      this.prisma.universityAlert.count({
        where: {
          status: { in: ['PENDING', 'QUEUED'] },
        },
      }),
      this.prisma.universityAlert.count({
        where: { status: 'FAILED' },
      }),
    ]);

    return {
      pendingAlerts,
      failedAlerts,
    };
  }
}
