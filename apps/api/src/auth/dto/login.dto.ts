import { IsEmail, IsString, IsUUID, Length, MinLength } from 'class-validator';

export class LoginDto {
  @IsUUID()
  universityId: string;

  @IsEmail()
  institutionalEmail: string;

  @IsString()
  @MinLength(8)
  @Length(8, 128)
  password: string;
}
