import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';

/**
 * Socket auth: the client connects with `?token=<accessToken>` (or an
 * `Authorization` header from native clients). The gateway verifies the JWT
 * itself - socket.io does not go through the HTTP Nest guards pipeline - and
 * attaches the resulting user to the socket. Every subscribed event then
 * re-checks conversation membership via ChatService.assertParticipant before
 * doing anything, so a authenticated-but-unauthorized user can connect but
 * still cannot read or write to a conversation they're not part of.
 */
@WebSocketGateway({ cors: { origin: (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',') }, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('ChatGateway');

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = (client.handshake.query.token as string) ?? '';
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET!,
      });
      (client as any).userId = payload.sub;
      (client as any).universityId = payload.universityId;
    } catch (err) {
      this.logger.warn(`Rejecting unauthenticated socket connection: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    const userId = (client as any).userId;
    await this.chatService.assertParticipant(userId, data.conversationId);
    client.join(data.conversationId);
  }

  @SubscribeMessage('message')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; body: string },
  ) {
    const userId = (client as any).userId;
    const message = await this.chatService.sendMessage(userId, data.conversationId, data.body);
    this.server.to(data.conversationId).emit('message', message);
    return message;
  }

  @SubscribeMessage('read')
  async onRead(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    const userId = (client as any).userId;
    await this.chatService.markRead(userId, data.conversationId);
    this.server.to(data.conversationId).emit('read', { userId, conversationId: data.conversationId });
  }
}
