import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class VerifyLoginOtpDto {
  @IsUUID()
  universityId: string;

  @IsEmail()
  institutionalEmail: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
