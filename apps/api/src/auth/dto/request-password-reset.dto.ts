import { IsEmail, IsUUID } from 'class-validator';

export class RequestPasswordResetDto {
  @IsUUID()
  universityId: string;

  @IsEmail()
  institutionalEmail: string;
}
