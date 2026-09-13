import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveUniversities(search?: string) {
    const normalizedSearch = search?.trim();

    return this.prisma.university.findMany({
      where: {
        status: 'ACTIVE',
        ...(normalizedSearch
          ? {
              OR: [
                {
                  name: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  slug: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 50,
    });
  }

  async listCampuses(universityId: string) {
    return this.prisma.campus.findMany({
      where: {
        universityId,
      },
      select: {
        id: true,
        universityId: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async listApprovedDomains(universityId: string) {
    return this.prisma.approvedEmailDomain.findMany({
      where: {
        universityId,
      },
      orderBy: {
        domain: 'asc',
      },
    });
  }

  async addApprovedDomain(universityId: string, domain: string) {
    return this.prisma.approvedEmailDomain.create({
      data: {
        universityId,
        domain: domain.trim().toLowerCase(),
      },
    });
  }

  async addCampus(universityId: string, name: string) {
    return this.prisma.campus.create({
      data: {
        universityId,
        name: name.trim(),
      },
    });
  }

  async addBuilding(campusId: string, name: string) {
    return this.prisma.building.create({
      data: {
        campusId,
        name: name.trim(),
      },
    });
  }
}
