import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AuthenticatedUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

import { CreateRideDto } from './dto/create-ride.dto';
import { SearchRidesDto } from './dto/search-rides.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { VerifyRideOtpDto } from './dto/verify-ride-otp.dto';
import { CreateReviewDto } from './dto/create-review.dto';

import { RidesService } from './rides.service';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('rides')
export class RidesController {
  constructor(
    private readonly service: RidesService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRideDto,
  ) {
    return this.service.create(
      user.id,
      user.universityId,
      dto,
    );
  }

  @Get()
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: SearchRidesDto,
  ) {
    return this.service.search(
      user.universityId,
      dto,
    );
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getStats(user.universityId);
  }

  @Get('popular-routes')
  getPopularRoutes(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getPopularRoutes(user.universityId);
  }

  @Get('popular-pickup-points')
  getPopularPickupPoints(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getPopularPickupPoints(user.universityId);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMine(user.id, user.universityId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.findById(
      id,
      user.universityId,
    );
  }

  @Post(':id/join')
  join(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.join(
      id,
      user.id,
      user.universityId,
    );
  }

  @Post(':id/leave')
  leave(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.leave(
      id,
      user.id,
      user.universityId,
    );
  }

  @Post(':id/generate-otp')
  generateOtp(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.generateOtp(
      id,
      user.id,
      user.universityId,
    );
  }

  @Post(':id/verify-otp')
  verifyOtp(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyRideOtpDto,
  ) {
    return this.service.verifyOtp(
      id,
      user.id,
      user.universityId,
      dto.otp,
    );
  }

  @Post(':id/start')
  startRide(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.startRide(
      id,
      user.id,
      user.universityId,
    );
  }

  @Post(':id/complete')
  completeRide(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.completeRide(
      id,
      user.id,
      user.universityId,
    );
  }

  @Post(':id/cancel')
  cancelRide(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancelRide(
      id,
      user.id,
      user.universityId,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRideDto,
  ) {
    return this.service.update(
      id,
      user.id,
      user.universityId,
      dto,
    );
  }

  @Post(':id/review')
  createReview(
    @Param('id') rideId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.service.createReview(
      rideId,
      user.id,
      user.universityId,
      dto,
    );
  }
}
