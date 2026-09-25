import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLostItemDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  distinctiveMarks?: string;

  @IsOptional()
  @IsString()
  campusId?: string;

  @IsOptional()
  @IsString()
  buildingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  floorOrZone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nearbyLandmark?: string;

  @IsOptional()
  @IsDateString()
  lostDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  lostTimeApprox?: string;
}
