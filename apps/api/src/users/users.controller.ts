import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Get('lost-items')
  myLostItems(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.myLostItems(user.id, user.universityId);
  }

  @Get('found-items')
  myFoundItems(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.myFoundItems(user.id, user.universityId);
  }
}
