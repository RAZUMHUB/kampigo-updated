import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UniversityService } from './university.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { CreateApprovedDomainDto } from './dto/create-domain.dto';
import { ListUniversitiesQueryDto } from './dto/list-universities-query.dto';

@Controller('universities')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get()
  list(@Query() query: ListUniversitiesQueryDto) {
    return this.universityService.listActiveUniversities(query.search);
  }

  @Get(':id/campuses')
  campuses(@Param('id') id: string) {
    return this.universityService.listCampuses(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('UNIVERSITY_ADMIN', 'PLATFORM_SUPER_ADMIN')
  @Get('me/domains')
  myDomains(@CurrentUser() user: AuthenticatedUser) {
    return this.universityService.listApprovedDomains(user.universityId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('UNIVERSITY_ADMIN', 'PLATFORM_SUPER_ADMIN')
  @Post('me/domains')
  addDomain(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApprovedDomainDto,
  ) {
    return this.universityService.addApprovedDomain(
      user.universityId,
      dto.domain,
    );
  }
}
