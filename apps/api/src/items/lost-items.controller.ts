import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { LostItemsService } from './lost-items.service';
import { CreateLostItemDto } from './dto/create-lost-item.dto';
import { SearchItemsDto } from './dto/search-items.dto';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('lost-items')
export class LostItemsController {
  constructor(private readonly service: LostItemsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLostItemDto) {
    return this.service.create(user.id, user.universityId, dto);
  }

  @Get()
  search(@CurrentUser() user: AuthenticatedUser, @Query() dto: SearchItemsDto) {
    return this.service.search(user.universityId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findById(id, user.id, user.universityId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateLostItemDto>,
  ) {
    return this.service.update(id, user.id, user.universityId, dto);
  }
}
