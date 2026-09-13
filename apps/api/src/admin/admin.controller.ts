import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsEnum,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { TenantStatus, UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

enum AccountStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

class UpdateUniversityStatusDto {
  @IsEnum(TenantStatus)
  status: TenantStatus;
}

class OnboardUniversityDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsString()
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;
}

class UpdateUserStatusDto {
  @IsEnum(AccountStatus)
  status: AccountStatus;
}

class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

class ResolveReportDto {
  @IsString()
  @Length(1, 1000)
  note: string;
}

// ---------------------------------------------------------------------------
// University Admin + Campus Authority
// ---------------------------------------------------------------------------

@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('admin/university')
export class UniversityAdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles('UNIVERSITY_ADMIN')
  @Get('overview')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.universityOverview(user.universityId);
  }

  @Roles('UNIVERSITY_ADMIN')
  @Get('recovery-analytics')
  recoveryAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.recoveryAnalytics(user.universityId);
  }

  @Roles('UNIVERSITY_ADMIN')
  @Get('alerts')
  alerts(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.listAlertActivity(user.universityId);
  }

  @Roles('UNIVERSITY_ADMIN')
  @Get('content-reports')
  contentReports(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.listContentReports(user.universityId);
  }

  @Roles('UNIVERSITY_ADMIN')
  @Patch('content-reports/:reportId/resolve')
  resolveContentReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.adminService.resolveContentReport(
      user.universityId,
      reportId,
      dto.note,
    );
  }

  @Roles('UNIVERSITY_ADMIN')
  @Patch('campus-authorities/:userId')
  grantCampusAuthority(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.adminService.manageCampusAuthority(
      user.universityId,
      userId,
    );
  }

  // -------------------------------------------------------------------------
  // University user/account controls
  // -------------------------------------------------------------------------

  @Roles('UNIVERSITY_ADMIN')
  @Get('users')
  users(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.listUniversityUsers(user.universityId);
  }

  @Roles('UNIVERSITY_ADMIN')
  @Patch('users/:userId/status')
  updateUserStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(
      user.universityId,
      userId,
      dto.status,
    );
  }

  @Roles('UNIVERSITY_ADMIN')
  @Patch('users/:userId/role')
  updateUserRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(
      user.universityId,
      userId,
      dto.role,
    );
  }

  // Campus Authority and University Admin can view held items.
  @Roles('CAMPUS_AUTHORITY', 'UNIVERSITY_ADMIN')
  @Get('held-items')
  heldItems(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.authorityHeldItems(user.universityId);
  }
}

// ---------------------------------------------------------------------------
// Platform Super Admin
// ---------------------------------------------------------------------------

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_SUPER_ADMIN')
@Controller('admin/platform')
export class PlatformAdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('universities')
  listUniversities() {
    return this.adminService.listAllUniversities();
  }

  @Post('universities')
  onboardUniversity(@Body() dto: OnboardUniversityDto) {
    return this.adminService.onboardUniversity(dto.name, dto.slug);
  }

  @Patch('universities/:id/status')
  setStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUniversityStatusDto,
  ) {
    return this.adminService.setUniversityStatus(id, dto.status);
  }

  @Get('analytics')
  analytics() {
    return this.adminService.platformAnalytics();
  }

  @Get('payments/health')
  paymentsHealth() {
    return this.adminService.paymentSystemHealth();
  }

  @Get('notifications/health')
  notificationsHealth() {
    return this.adminService.notificationSystemHealth();
  }
}
