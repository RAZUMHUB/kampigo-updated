import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    universityId: string;
    role: string;
    institutionalEmail: string;
  };
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  getDashboard(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getDashboard(req.user.universityId);
  }
}