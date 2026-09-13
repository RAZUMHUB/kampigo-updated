import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CustodyStatus } from '@prisma/client';

export class CreateFoundItemDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsString() @MaxLength(120) title: string;
  @IsString() @MaxLength(2000) description: string;
  @IsOptional() @IsString() @MaxLength(80) brand?: string;
  @IsOptional() @IsString() @MaxLength(80) model?: string;
  @IsOptional() @IsString() @MaxLength(40) primaryColor?: string;
  @IsOptional() @IsString() @MaxLength(40) secondaryColor?: string;
  @IsOptional() @IsString() @MaxLength(500) distinctiveMarks?: string;

  @IsOptional() @IsString() campusId?: string;
  @IsOptional() @IsString() buildingId?: string;
  @IsOptional() @IsString() @MaxLength(80) floorOrZone?: string;
  @IsOptional() @IsString() @MaxLength(150) nearbyLandmark?: string;

  @IsDateString() foundDate: string;
  @IsOptional() @IsString() @MaxLength(20) foundTimeApprox?: string;

  @IsOptional() @IsEnum(CustodyStatus) custodyStatus?: CustodyStatus;
  @IsOptional() @IsString() @MaxLength(120) authorityOffice?: string;
  @IsOptional() @IsString() @MaxLength(120) storageLocation?: string;
  @IsOptional() @IsString() @MaxLength(80) recoveryRefNumber?: string;
}
