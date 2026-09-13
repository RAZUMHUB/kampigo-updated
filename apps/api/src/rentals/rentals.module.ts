import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { RentalBookingsController } from './rental-bookings.controller';
import { RentalBookingsService } from './rental-bookings.service';

@Module({
  imports: [PrismaModule],
  controllers: [RentalsController, RentalBookingsController],
  providers: [RentalsService, RentalBookingsService],
})
export class RentalsModule {}
