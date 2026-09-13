import { GenderPreference, RideStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SearchRidesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  campusId?: string;

  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;

  @IsOptional()
  @IsEnum(GenderPreference)
  genderPreference?: GenderPreference;

  @IsOptional()
  @IsString()
  date?: string;
}
