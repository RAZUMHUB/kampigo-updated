import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Server, Socket } from 'socket.io';

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
  namespace: '/rides/chat',
  cors: {
    origin: (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
  },
})
export class RidesChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private getUser(client: Socket): RideSocketUser {
    const user = client.data.user as RideSocketUser | undefined;

    if (!user) {
      throw new UnauthorizedException('Socket is not authenticated');
    }

    return user;
  }

  private async assertRideParticipant(
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

    if (
      ride.driverId !== user.id &&
      ride.passengers.length === 0
    ) {
      throw new ForbiddenException('You are not a participant in this ride');
    }

    return ride;
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

  @SubscribeMessage('joinChat')
  async joinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() rideId: string,
  ) {
    const user = this.getUser(client);

    await this.assertRideParticipant(rideId, user);

    client.join(rideId);

    const history = await this.prisma.rideMessage.findMany({
      where: {
        rideId,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50,
    });

    client.emit('chatHistory', history);

    return {
      joined: rideId,
    };
  }

  @SubscribeMessage('message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      rideId: string;
      message: string;
    },
  ) {
    const user = this.getUser(client);

    await this.assertRideParticipant(payload.rideId, user);

    const message = payload.message?.trim();

    if (!message || message.length > 2000) {
      throw new ForbiddenException('Invalid message');
    }

    const saved = await this.prisma.rideMessage.create({
      data: {
        rideId: payload.rideId,
        senderId: user.id,
        message,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    this.server
      .to(payload.rideId)
      .emit('message', saved);

    return saved;
  }
}
