import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { LostItemsService } from '../items/lost-items.service';
import { FoundItemsService } from '../items/found-items.service';
import { SearchItemsDto } from '../items/dto/search-items.dto';

/**
 * Unified, university-scoped search across both Lost and Found reports.
 * Delegates to the same tenant-scoped services used by the item modules -
 * there is no separate search index here that could accidentally bypass
 * tenant filtering.
 */
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('search')
export class SearchController {
  constructor(
    private readonly lostItemsService: LostItemsService,
    private readonly foundItemsService: FoundItemsService,
  ) {}

  @Get('lost')
  searchLost(@CurrentUser() user: AuthenticatedUser, @Query() dto: SearchItemsDto) {
    return this.lostItemsService.search(user.universityId, dto);
  }

  @Get('found')
  searchFound(@CurrentUser() user: AuthenticatedUser, @Query() dto: SearchItemsDto) {
    return this.foundItemsService.search(user.universityId, dto);
  }

  @Get('all')
  async searchAll(@CurrentUser() user: AuthenticatedUser, @Query() dto: SearchItemsDto) {
    const [lost, found] = await Promise.all([
      this.lostItemsService.search(user.universityId, dto),
      this.foundItemsService.search(user.universityId, dto),
    ]);
    return { lost, found };
  }
}
