import { IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID() conversationId: string;
  @IsString() @MaxLength(2000) body: string;
}
