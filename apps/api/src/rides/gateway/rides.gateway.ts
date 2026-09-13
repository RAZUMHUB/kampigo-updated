import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../common/prisma/prisma.service';

interface RideSocketUser {
  id: string;
  universityId: string;
}

interface JwtPayload {
  sub: string;
  universityId: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/rides/live',
  cors: {
    origin: (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
  },
})
export class RidesGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private getUser(client: Socket): RideSocketUser {
    const user = client.data.user as RideSocketUser | undefined;

    if (!user) {
      throw new UnauthorizedException('Socket is not authenticated');
    }

    return user;
  }

  private async getAuthorizedRide(
    rideId: string,
    user: RideSocketUser,
  ) {
    const ride = await this.prisma.ride.findFirst({
      where: {
        id: rideId,
        universityId: user.universityId,
      },
      select: {
        id: true,
        driverId: true,
        passengers: {
          where: {
            userId: user.id,
            status: {
              in: ['JOINED', 'BOARDED'],
            },
          },
          select: {
            userId: true,
          },
        },
      },
    });

    if (!ride) {
      throw new ForbiddenException('Ride not found or access denied');
    }

    const isDriver = ride.driverId === user.id;
    const isPassenger = ride.passengers.length > 0;

    if (!isDriver && !isPassenger) {
      throw new ForbiddenException('You are not a participant in this ride');
    }

    return {
      ride,
      isDriver,
    };
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.query.token as string | undefined) ??
        '';

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET!,
      });

      if (!payload.sub || !payload.universityId) {
        throw new UnauthorizedException('Invalid socket token');
      }

      client.data.user = {
        id: payload.sub,
        universityId: payload.universityId,
      };
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinRide')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() rideId: string,
  ) {
    const user = this.getUser(client);

    await this.getAuthorizedRide(rideId, user);

    client.join(rideId);

    return { joined: rideId };
  }

  @SubscribeMessage('driverLocation')
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      rideId: string;
      latitude: number;
      longitude: number;
    },
  ) {
    const user = this.getUser(client);
    const { isDriver } = await this.getAuthorizedRide(payload.rideId, user);

    if (!isDriver) {
      throw new ForbiddenException('Only the driver can share ride location');
    }

    if (
      !Number.isFinite(payload.latitude) ||
      !Number.isFinite(payload.longitude) ||
      payload.latitude < -90 ||
      payload.latitude > 90 ||
      payload.longitude < -180 ||
      payload.longitude > 180
    ) {
      throw new ForbiddenException('Invalid location coordinates');
    }

    const location = {
      rideId: payload.rideId,
      latitude: payload.latitude,
      longitude: payload.longitude,
    };

    this.server.to(payload.rideId).emit('location', location);

    return location;
  }
}
