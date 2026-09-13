import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { GenderPreference, PaymentMode } from '@prisma/client';

export class UpdateRideDto {
  @IsOptional()
  @IsUUID()
  campusId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  pickup?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  destination?: string;

  @IsOptional()
  @IsDateString()
  departureDateTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  availableSeats?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerSeat?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  vehicle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  luggageAllowed?: boolean;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsEnum(GenderPreference)
  genderPreference?: GenderPreference;
}
