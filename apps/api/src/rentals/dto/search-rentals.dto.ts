import { RentalCategory } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class SearchRentalsDto {
  @IsOptional()
  @IsEnum(RentalCategory)
  category?: RentalCategory;
}
