import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('matches')
export class MatchingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('for-lost-item/:id')
  async forLostItem(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const item = await this.prisma.lostItem.findUnique({ where: { id } });
    if (!item || item.universityId !== user.universityId) throw new NotFoundException();
    if (item.ownerId !== user.id && user.role === 'STUDENT') throw new ForbiddenException();

    return this.prisma.itemMatch.findMany({
      where: { lostItemId: id, universityId: user.universityId, status: 'ACTIVE' },
      include: { foundItem: { include: { images: true } } },
      orderBy: { compositeScore: 'desc' },
    });
  }

  @Get('for-found-item/:id')
  async forFoundItem(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const item = await this.prisma.foundItem.findUnique({ where: { id } });
    if (!item || item.universityId !== user.universityId) throw new NotFoundException();

    return this.prisma.itemMatch.findMany({
      where: { foundItemId: id, universityId: user.universityId, status: 'ACTIVE' },
      include: { lostItem: { include: { images: true } } },
      orderBy: { compositeScore: 'desc' },
    });
  }
}
