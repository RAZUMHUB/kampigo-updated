import { PaymentMode, GenderPreference } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateRideDto {
  @IsOptional()
  @IsUUID()
  campusId?: string;

  @IsString()
  @MaxLength(150)
  pickup: string;

  @IsString()
  @MaxLength(150)
  destination: string;

  @IsDateString()
  departureDateTime: string;

  @IsInt()
  @Min(1)
  availableSeats: number;

  @IsInt()
  @Min(0)
  pricePerSeat: number;

  @IsString()
  @MaxLength(80)
  vehicle: string;

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
