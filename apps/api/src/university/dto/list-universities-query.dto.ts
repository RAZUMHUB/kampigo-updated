import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListUniversitiesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
