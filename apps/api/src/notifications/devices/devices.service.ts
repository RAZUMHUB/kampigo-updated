import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DevicePlatform } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, universityId: string, platform: DevicePlatform, pushToken: string) {
    return this.prisma.device.upsert({
      where: { pushToken },
      create: { userId, universityId, platform, pushToken, tokenStatus: 'ACTIVE' },
      update: { userId, universityId, platform, tokenStatus: 'ACTIVE', lastSeenAt: new Date() },
    });
  }

  async deregisterDevice(pushToken: string) {
    return this.prisma.device.updateMany({
      where: { pushToken },
      data: { tokenStatus: 'REVOKED' },
    });
  }

  /** Devices eligible for a university fan-out: ACTIVE tokens, scoped strictly to one university. */
  async getEligibleDevices(universityId: string) {
    return this.prisma.device.findMany({
      where: { universityId, tokenStatus: 'ACTIVE' },
    });
  }

  async markTokenInvalid(pushToken: string) {
    return this.prisma.device.updateMany({ where: { pushToken }, data: { tokenStatus: 'INVALID' } });
  }
}
