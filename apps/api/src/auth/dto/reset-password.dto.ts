import { IsJWT, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsJWT()
  resetToken: string;

  @IsString()
  @Length(8, 128)
  newPassword: string;
}
