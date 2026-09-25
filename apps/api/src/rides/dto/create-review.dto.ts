import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsUUID()
  revieweeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
