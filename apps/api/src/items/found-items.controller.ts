import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { FoundItemsService } from './found-items.service';
import { CreateFoundItemDto } from './dto/create-found-item.dto';
import { SearchItemsDto } from './dto/search-items.dto';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CustodyStatus } from '@prisma/client';

class UpdateCustodyDto {
  @IsEnum(CustodyStatus)
  custodyStatus: CustodyStatus;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  recoveryRefNumber?: string;
}

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('found-items')
export class FoundItemsController {
  constructor(private readonly service: FoundItemsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFoundItemDto) {
    return this.service.create(user.id, user.universityId, dto);
  }

  @Get()
  search(@CurrentUser() user: AuthenticatedUser, @Query() dto: SearchItemsDto) {
    return this.service.search(user.universityId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findById(id, user.universityId);
  }

  @UseGuards(RolesGuard)
  @Patch(':id/custody')
  updateCustody(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustodyDto,
  ) {
    return this.service.updateCustody(id, user.universityId, dto.custodyStatus, dto.recoveryRefNumber);
  }
}
