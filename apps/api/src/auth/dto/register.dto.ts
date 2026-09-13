import { IsEmail, IsString, IsUUID, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsUUID()
  universityId: string;

  @IsUUID()
  campusId: string;

  @IsString()
  @MinLength(2)
  displayName: string;

  @IsEmail()
  institutionalEmail: string;

  @IsString()
  @MinLength(8)
  @Length(8, 128)
  password: string;
}
