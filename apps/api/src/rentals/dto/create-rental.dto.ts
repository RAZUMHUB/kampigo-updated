import { RentalCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateRentalDto {
  @IsEnum(RentalCategory)
  category: RentalCategory;

  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsUUID()
  campusId?: string;

  @IsInt()
  @Min(1)
  pricePerDay: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  securityDeposit?: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
