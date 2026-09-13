import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { RentalBookingsService } from './rental-bookings.service';
import { CreateRentalBookingDto } from './dto/create-rental-booking.dto';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('rental-bookings')
export class RentalBookingsController {
  constructor(private readonly rentalBookingsService: RentalBookingsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRentalBookingDto,
  ) {
    return this.rentalBookingsService.create(
      user.id,
      user.universityId,
      dto.rentalId,
    );
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.rentalBookingsService.findMine(user.id, user.universityId);
  }

  @Post(':id/return')
  markReturned(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalBookingsService.markReturned(
      id,
      user.id,
      user.universityId,
    );
  }
}
