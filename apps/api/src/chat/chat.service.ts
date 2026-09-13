import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Authorization for chat is always resolved server-side from
 * ConversationParticipant rows - never from client-asserted membership.
 * Personal contact info (email, phone) is never included in any chat
 * payload; only displayName + role are exposed.
 */
@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async assertParticipant(userId: string, conversationId: string) {
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a participant in this conversation');
  }

  async getHistory(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, displayName: true, role: true } } },
    });
  }

  async sendMessage(userId: string, conversationId: string, body: string) {
    await this.assertParticipant(userId, conversationId);
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.status === 'CLOSED') {
      throw new ForbiddenException('Conversation is closed');
    }

    return this.prisma.chatMessage.create({
      data: { conversationId, senderId: userId, body },
      include: { sender: { select: { id: true, displayName: true, role: true } } },
    });
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertParticipant(userId, conversationId);
    const messages = await this.prisma.chatMessage.findMany({ where: { conversationId } });
    await Promise.all(
      messages.map((m) => {
        const readBy = Array.isArray(m.readBy) ? (m.readBy as string[]) : [];
        if (readBy.includes(userId)) return Promise.resolve();
        return this.prisma.chatMessage.update({
          where: { id: m.id },
          data: { readBy: [...readBy, userId] },
        });
      }),
    );
  }

  async reportAbuse(reporterId: string, conversationId: string, reason: string) {
    await this.assertParticipant(reporterId, conversationId);
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { status: 'FLAGGED' } });
    return this.prisma.contentReport.create({
      data: { reporterId, targetType: 'CHAT_MESSAGE', targetId: conversationId, reason },
    });
  }
}
