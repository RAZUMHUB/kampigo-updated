import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { IsString, IsUUID } from 'class-validator';

class ReportAbuseDto {
  @IsUUID() conversationId: string;
  @IsString() reason: string;
}

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':conversationId/messages')
  history(@CurrentUser() user: AuthenticatedUser, @Param('conversationId') id: string) {
    return this.chatService.getHistory(user.id, id);
  }

  @Post('report-abuse')
  reportAbuse(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReportAbuseDto) {
    return this.chatService.reportAbuse(user.id, dto.conversationId, dto.reason);
  }
}
