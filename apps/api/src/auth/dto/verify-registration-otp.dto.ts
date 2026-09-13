import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class VerifyRegistrationOtpDto {
  @IsUUID()
  universityId: string;

  @IsUUID()
  campusId: string;

  @IsEmail()
  institutionalEmail: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsString()
  displayName: string;

  @IsString()
  password: string;
}
