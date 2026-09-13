import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class RentalBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Renter starts renting an available listing. Marks the underlying rental
   * unavailable for the duration of the booking - a simple, single-active-
   * renter model (no overlapping bookings, no owner approval step).
   */
  async create(renterId: string, universityId: string, rentalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { id: rentalId } });

      if (!rental || rental.universityId !== universityId) {
        throw new NotFoundException('Rental not found');
      }

      if (rental.ownerId === renterId) {
        throw new BadRequestException('You cannot rent your own listing');
      }

      if (!rental.available) {
        throw new ConflictException('This item is not currently available');
      }

      const booking = await tx.rentalBooking.create({
        data: {
          universityId,
          rentalId,
          renterId,
        },
      });

      await tx.rental.update({
        where: { id: rentalId },
        data: { available: false },
      });

      return booking;
    });
  }

  /** Bookings the caller is currently renting or has rented in the past. */
  async findMine(renterId: string, universityId: string) {
    return this.prisma.rentalBooking.findMany({
      where: { renterId, universityId },
      orderBy: { createdAt: 'desc' },
      include: {
        rental: {
          include: {
            owner: { select: { id: true, displayName: true } },
          },
        },
      },
    });
  }

  /** Renter marks an active booking as returned, freeing the listing back up. */
  async markReturned(bookingId: string, renterId: string, universityId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.rentalBooking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.universityId !== universityId) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.renterId !== renterId) {
        throw new ForbiddenException('You do not own this booking');
      }

      if (booking.status !== 'ACTIVE') {
        throw new ConflictException('This booking is not active');
      }

      const updated = await tx.rentalBooking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED', returnedAt: new Date() },
      });

      await tx.rental.update({
        where: { id: booking.rentalId },
        data: { available: true },
      });

      return updated;
    });
  }
}
