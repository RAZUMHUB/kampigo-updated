import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class PrivateOwnershipDetailsDto {
  @IsOptional() @IsString() @MaxLength(500) exactKeyCount?: string;
  @IsOptional() @IsString() @MaxLength(500) hiddenSticker?: string;
  @IsOptional() @IsString() @MaxLength(500) scratchLocation?: string;
  @IsOptional() @IsString() @MaxLength(500) privateWriting?: string;
  @IsOptional() @IsString() @MaxLength(500) walletContents?: string;
  @IsOptional() @IsString() @MaxLength(500) uniqueMark?: string;
}

export class CreateLostItemDto {
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

  @IsDateString() lostDate: string;
  @IsOptional() @IsString() @MaxLength(20) lostTimeApprox?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrivateOwnershipDetailsDto)
  privateDetails?: PrivateOwnershipDetailsDto;
}
