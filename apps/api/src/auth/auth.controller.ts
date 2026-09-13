import { Body, Controller, Ip, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyPasswordResetOtpDto } from './dto/verify-password-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration/request-otp')
  requestRegistrationOtp(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.requestRegistrationOtp(
      dto.universityId,
      dto.campusId,
      dto.institutionalEmail,
      dto.displayName,
      dto.password,
      ip,
    );
  }

  @Post('registration/verify-otp')
  verifyRegistration(@Body() dto: VerifyRegistrationOtpDto) {
    return this.authService.verifyRegistration(dto);
  }

  @Post('login/request-otp')
  requestLoginOtp(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.authService.requestLoginOtp(
      dto.universityId,
      dto.institutionalEmail,
      dto.password,
      ip,
    );
  }

  @Post('login/verify-otp')
  verifyLogin(@Body() dto: VerifyLoginOtpDto) {
    return this.authService.verifyLogin(dto);
  }

  @Post('password-reset/request-otp')
  requestPasswordResetOtp(
    @Body() dto: RequestPasswordResetDto,
    @Ip() ip: string,
  ) {
    return this.authService.requestPasswordResetOtp(
      dto.universityId,
      dto.institutionalEmail,
      ip,
    );
  }

  @Post('password-reset/verify-otp')
  verifyPasswordResetOtp(@Body() dto: VerifyPasswordResetOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto);
  }

  @Post('password-reset/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.resetToken,
      dto.newPassword,
    );
  }
}
