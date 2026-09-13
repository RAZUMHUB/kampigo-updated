import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { DevicesService } from './devices/devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly devicesService: DevicesService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listForUser(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(user.id, user.universityId, dto.platform, dto.pushToken);
  }
}
