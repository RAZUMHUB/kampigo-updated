import { timingSafeEqual } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, RideStatus, RidePassengerStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { SearchRidesDto } from './dto/search-rides.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { generateRideOtp, hashRideOtp } from './ride-otp.util';
import { CreateReviewDto } from './dto/create-review.dto';

const RIDE_OTP_TTL_MINUTES = 10;
const RIDE_OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService) {}

  private enrichRide<
    T extends {
      availableSeats: number;
      _count: { passengers: number };
    }
  >(ride: T) {
    return {
      ...ride,
      passengerCount: ride._count.passengers,
      seatsLeft: Math.max(
        ride.availableSeats - ride._count.passengers,
        0,
      ),
    };
  }

  async create(
    userId: string,
    universityId: string,
    dto: CreateRideDto,
  ) {
    const departureDateTime = new Date(dto.departureDateTime);

    const existingRide = await this.prisma.ride.findFirst({
      where: {
        universityId,
        driverId: userId,
        pickup: dto.pickup,
        destination: dto.destination,
        departureDateTime,
        status: {
          in: [RideStatus.UPCOMING],
        },
      },
    });

    if (existingRide) {
      throw new ConflictException(
        'A similar ride already exists for this departure time.',
      );
    }

    return this.prisma.ride.create({
      data: {
        universityId,
        driverId: userId,
        campusId: dto.campusId,
        pickup: dto.pickup,
        destination: dto.destination,
        departureDateTime,
        availableSeats: dto.availableSeats,
        pricePerSeat: dto.pricePerSeat,
        vehicle: dto.vehicle,
        notes: dto.notes,
        luggageAllowed: dto.luggageAllowed,
        paymentMode: dto.paymentMode,
        genderPreference: dto.genderPreference,
      },
      include: {
        driver: {
          select: {
            id: true,
            displayName: true,
          },
        },
        passengers: true,
        _count: {
          select: {
            passengers: true,
          },
        },
      },
    });
  }

  async search(universityId: string, dto: SearchRidesDto) {
    const where: Prisma.RideWhereInput = {
      universityId,
    };

    if (dto.campusId) where.campusId = dto.campusId;
    if (dto.status) where.status = dto.status;
    if (dto.genderPreference) {
      where.genderPreference = dto.genderPreference;
    }

    if (dto.q) {
      where.OR = [
        {
          pickup: {
            contains: dto.q,
            mode: 'insensitive',
          },
        },
        {
          destination: {
            contains: dto.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              displayName: true,
            },
          },
          passengers: true,
          _count: {
            select: {
              passengers: true,
            },
          },
        },
        orderBy: {
          departureDateTime: 'asc',
        },
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
      }),
      this.prisma.ride.count({ where }),
    ]);

    return {
      rides: rides.map((ride) => this.enrichRide(ride)),
      total,
      page: dto.page,
      pageSize: dto.pageSize,
    };
  }

  async findById(id: string, universityId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            displayName: true,
          },
        },
        passengers: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        _count: {
          select: {
            passengers: true,
          },
        },
      },
    });

    if (!ride || ride.universityId !== universityId) {
      throw new NotFoundException('Ride not found');
    }

    return this.enrichRide(ride);
  }

  async join(
    id: string,
    userId: string,
    universityId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "rides"
        WHERE id = ${id}
        FOR UPDATE
      `;

      const ride = await tx.ride.findUnique({
        where: { id },
      });

      if (!ride || ride.universityId !== universityId) {
        throw new NotFoundException('Ride not found');
      }

      if (ride.status !== RideStatus.UPCOMING) {
        throw new BadRequestException(
          'Only upcoming rides can be joined',
        );
      }

      if (ride.driverId === userId) {
        throw new ForbiddenException('Driver cannot join own ride');
      }

      const alreadyJoined = await tx.ridePassenger.findUnique({
        where: {
          rideId_userId: {
            rideId: id,
            userId,
          },
        },
      });

      if (alreadyJoined) {
        throw new ConflictException(
          'Already joined this ride',
        );
      }

      const activePassengerCount = await tx.ridePassenger.count({
        where: {
          rideId: id,
          status: {
            in: [
              RidePassengerStatus.JOINED,
              RidePassengerStatus.BOARDED,
            ],
          },
        },
      });

      if (activePassengerCount >= ride.availableSeats) {
        throw new ConflictException('Ride is full');
      }

      await tx.ridePassenger.create({
        data: {
          rideId: id,
          userId,
        },
      });

      const updatedRide = await tx.ride.findUnique({
        where: { id },
        include: {
          driver: {
            select: {
              id: true,
              displayName: true,
            },
          },
          passengers: true,
          _count: {
            select: {
              passengers: true,
            },
          },
        },
      });

      if (!updatedRide) {
        throw new NotFoundException('Ride not found');
      }

      return this.enrichRide(updatedRide);
    });
  }

  async leave(
    id: string,
    userId: string,
    universityId: string,
  ) {
    const ride = await this.prisma.ride.findUnique({
      where: { id },
    });

    if (!ride || ride.universityId !== universityId) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== RideStatus.UPCOMING) {
      throw new BadRequestException(
        'You can only leave an upcoming ride',
      );
    }

    const passenger = await this.prisma.ridePassenger.findUnique({
      where: {
        rideId_userId: {
          rideId: id,
          userId,
        },
      },
    });

    if (!passenger) {
      throw new NotFoundException(
        'Ride booking not found',
      );
    }

    if (passenger.status !== RidePassengerStatus.JOINED) {
      throw new BadRequestException(
        'This ride booking can no longer be cancelled',
      );
    }

    await this.prisma.ridePassenger.delete({
      where: {
        rideId_userId: {
          rideId: id,
          userId,
        },
      },
    });

    return this.findById(id, universityId);
  }

  async update(
    id: string,
    userId: string,
    universityId: string,
    dto: UpdateRideDto,
  ) {
    const ride = await this.prisma.ride.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            passengers: true,
          },
        },
      },
    });

    if (!ride || ride.universityId !== universityId) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== userId) {
      throw new ForbiddenException('Only the ride driver can update it');
    }

    if (ride.status !== RideStatus.UPCOMING) {
      throw new BadRequestException(
        'Only upcoming rides can be updated',
      );
    }

    if (
      dto.availableSeats !== undefined &&
      dto.availableSeats < ride._count.passengers
    ) {
      throw new BadRequestException(
        'Available seats cannot be fewer than current passengers',
      );
    }

    return this.prisma.ride.update({
      where: { id },
      data: {
        ...dto,
        departureDateTime: dto.departureDateTime
          ? new Date(dto.departureDateTime)
          : undefined,
      },
    });
  }


  async generateOtp(
    rideId: string,
    driverId: string,
    universityId: string,
  ) {
    const ride = await this.prisma.ride.findFirst({
      where: {
        id: rideId,
        driverId,
        universityId,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (
      ride.status !== RideStatus.UPCOMING &&
      ride.status !== RideStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'OTP can only be generated for an upcoming or in-progress ride',
      );
    }

    const { code, hash } = generateRideOtp();
    const otpExpiresAt = new Date(
      Date.now() + RIDE_OTP_TTL_MINUTES * 60 * 1000,
    );

    await this.prisma.ridePassenger.updateMany({
      where: {
        rideId,
        status: RidePassengerStatus.JOINED,
      },
      data: {
        otp: hash,
        otpVerifiedAt: null,
        otpExpiresAt,
        otpAttempts: 0,
      },
    });

    return {
      otp: code,
      message: 'Share this OTP with passengers during boarding.',
    };
  }

  async verifyOtp(
    rideId: string,
    userId: string,
    universityId: string,
    otp: string,
  ) {
    const passenger = await this.prisma.ridePassenger.findUnique({
      where: {
        rideId_userId: {
          rideId,
          userId,
        },
      },
      include: {
        ride: true,
      },
    });

    if (
      !passenger ||
      passenger.ride.universityId !== universityId
    ) {
      throw new NotFoundException('Ride booking not found');
    }

    if (
      passenger.ride.status !== RideStatus.UPCOMING &&
      passenger.ride.status !== RideStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'OTP verification is not available for this ride',
      );
    }

    if (passenger.status !== RidePassengerStatus.JOINED) {
      throw new BadRequestException(
        'This ride booking is no longer awaiting boarding',
      );
    }

    if (!passenger.otp) {
      throw new ForbiddenException(
        'OTP has not been generated yet',
      );
    }

    if (
      !passenger.otpExpiresAt ||
      passenger.otpExpiresAt <= new Date()
    ) {
      throw new ForbiddenException('OTP has expired');
    }

    if (passenger.otpAttempts >= RIDE_OTP_MAX_ATTEMPTS) {
      throw new ForbiddenException(
        'Too many invalid OTP attempts',
      );
    }

    const expected = Buffer.from(passenger.otp, 'utf8');
    const provided = Buffer.from(hashRideOtp(otp), 'utf8');

    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      await this.prisma.ridePassenger.update({
        where: {
          rideId_userId: {
            rideId,
            userId,
          },
        },
        data: {
          otpAttempts: {
            increment: 1,
          },
        },
      });

      throw new ForbiddenException('Invalid OTP');
    }

    await this.prisma.ridePassenger.update({
      where: {
        rideId_userId: {
          rideId,
          userId,
        },
      },
      data: {
        otp: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpVerifiedAt: new Date(),
        status: RidePassengerStatus.BOARDED,
      },
    });

    return {
      verified: true,
    };
  }

  async startRide(
    rideId: string,
    driverId: string,
    universityId: string,
  ) {
    const ride=await this.prisma.ride.findFirst({
      where:{
        id:rideId,
        driverId,
        universityId,
      },
    });

    if(!ride){
      throw new NotFoundException("Ride not found");
    }

    if (ride.status !== RideStatus.UPCOMING) {
      throw new BadRequestException(
        'Only upcoming rides can be started',
      );
    }

    return this.prisma.ride.update({
      where:{id:rideId},
      data:{
        status: RideStatus.IN_PROGRESS,
      },
    });
  }

  async completeRide(
    rideId:string,
    driverId:string,
    universityId:string,
  ){
    const ride=await this.prisma.ride.findFirst({
      where:{
        id:rideId,
        driverId,
        universityId,
      },
    });

    if(!ride){
      throw new NotFoundException("Ride not found");
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Only rides in progress can be completed',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.ride.update({
        where: { id: rideId },
        data: {
          status: RideStatus.COMPLETED,
        },
      });

      await tx.ridePassenger.updateMany({
        where: {
          rideId,
          status: RidePassengerStatus.BOARDED,
        },
        data: {
          status: RidePassengerStatus.COMPLETED,
          otp: null,
        },
      });

      await tx.ridePassenger.updateMany({
        where: {
          rideId,
          status: RidePassengerStatus.JOINED,
        },
        data: {
          status: RidePassengerStatus.CANCELLED,
          otp: null,
        },
      });

      const completedRide = await tx.ride.findUnique({
        where: { id: rideId },
      });

      if (!completedRide) {
        throw new NotFoundException('Ride not found');
      }

      return completedRide;
    });
  }

  async cancelRide(
    rideId:string,
    driverId:string,
    universityId:string,
  ){
    const ride=await this.prisma.ride.findFirst({
      where:{
        id:rideId,
        driverId,
        universityId,
      },
    });

    if(!ride){
      throw new NotFoundException("Ride not found");
    }

    if (
      ride.status !== RideStatus.UPCOMING &&
      ride.status !== RideStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Only upcoming or in-progress rides can be cancelled',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.ride.update({
        where: { id: rideId },
        data: {
          status: RideStatus.CANCELLED,
        },
      });

      await tx.ridePassenger.updateMany({
        where: {
          rideId,
          status: {
            in: [
              RidePassengerStatus.JOINED,
              RidePassengerStatus.BOARDED,
            ],
          },
        },
        data: {
          status: RidePassengerStatus.CANCELLED,
          otp: null,
        },
      });

      const cancelledRide = await tx.ride.findUnique({
        where: { id: rideId },
      });

      if (!cancelledRide) {
        throw new NotFoundException('Ride not found');
      }

      return cancelledRide;
    });
  }




  async createReview(
    rideId: string,
    reviewerId: string,
    universityId: string,
    dto: CreateReviewDto,
  ) {
    const ride = await this.prisma.ride.findFirst({
      where: {
        id: rideId,
        universityId,
      },
      include: {
        passengers: {
          where: {
            status: {
              in: [
                RidePassengerStatus.BOARDED,
                RidePassengerStatus.COMPLETED,
              ],
            },
          },
          select: {
            userId: true,
          },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException(
        'Reviews are allowed only after ride completion',
      );
    }

    if (dto.revieweeId === reviewerId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const isDriver = ride.driverId === reviewerId;
    const passengerIds = new Set(
      ride.passengers.map((passenger) => passenger.userId),
    );
    const isPassenger = passengerIds.has(reviewerId);

    if (!isDriver && !isPassenger) {
      throw new ForbiddenException(
        'Only ride participants can submit reviews',
      );
    }

    const isReviewingPassenger =
      isDriver && passengerIds.has(dto.revieweeId);

    const isReviewingDriver =
      isPassenger && dto.revieweeId === ride.driverId;

    if (!isReviewingPassenger && !isReviewingDriver) {
      throw new ForbiddenException(
        'You can only review another participant of this ride',
      );
    }

    return this.prisma.rideReview.create({
      data: {
        rideId,
        reviewerId,
        revieweeId: dto.revieweeId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  /** Real, tenant-scoped counts for the ride-sharing landing page - no vanity numbers. */
  async getStats(universityId: string) {
    const [upcomingRides, completedRides, cancelledRides, distinctDrivers] =
      await Promise.all([
        this.prisma.ride.count({
          where: { universityId, status: RideStatus.UPCOMING },
        }),
        this.prisma.ride.count({
          where: { universityId, status: RideStatus.COMPLETED },
        }),
        this.prisma.ride.count({
          where: { universityId, status: RideStatus.CANCELLED },
        }),
        this.prisma.ride.findMany({
          where: { universityId },
          distinct: ['driverId'],
          select: { driverId: true },
        }),
      ]);

    const finishedRides = completedRides + cancelledRides;
    const completionRate =
      finishedRides === 0
        ? null
        : Math.round((completedRides / finishedRides) * 100);

    return {
      upcomingRides,
      completedRides,
      activeDrivers: distinctDrivers.length,
      completionRate,
    };
  }

  /** Most-travelled pickup/destination pairs, from real ride data. */
  async getPopularRoutes(universityId: string) {
    const grouped = await this.prisma.ride.groupBy({
      by: ['pickup', 'destination'],
      where: { universityId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 4,
    });

    return grouped.map((route) => ({
      pickup: route.pickup,
      destination: route.destination,
      rideCount: route._count.id,
    }));
  }

  /** Most-used pickup locations, from real ride data. No distance data exists to compute proximity. */
  async getPopularPickupPoints(universityId: string) {
    const grouped = await this.prisma.ride.groupBy({
      by: ['pickup'],
      where: { universityId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 4,
    });

    return grouped.map((point) => ({
      pickup: point.pickup,
      rideCount: point._count.id,
    }));
  }

  /** Rides the caller is driving, plus rides they've booked a seat on. */
  async findMine(userId: string, universityId: string) {
    const [offered, booked] = await Promise.all([
      this.prisma.ride.findMany({
        where: {
          driverId: userId,
          universityId,
        },
        include: {
          passengers: true,
          driver: { select: { id: true, displayName: true } },
          _count: {
            select: {
              passengers: {
                where: {
                  status: {
                    in: [
                      RidePassengerStatus.JOINED,
                      RidePassengerStatus.BOARDED,
                    ],
                  },
                },
              },
            },
          },
        },
        orderBy: { departureDateTime: 'desc' },
      }),
      this.prisma.ridePassenger.findMany({
        where: {
          userId,
          ride: {
            universityId,
          },
        },
        include: {
          ride: {
            include: {
              passengers: true,
              driver: { select: { id: true, displayName: true } },
              _count: {
                select: {
                  passengers: {
                    where: {
                      status: {
                        in: [
                          RidePassengerStatus.JOINED,
                          RidePassengerStatus.BOARDED,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      offered: offered.map((ride) => this.enrichRide(ride)),
      booked: booked.map((booking) => ({
        bookingStatus: booking.status,
        ride: this.enrichRide(booking.ride),
      })),
    };
  }

}
