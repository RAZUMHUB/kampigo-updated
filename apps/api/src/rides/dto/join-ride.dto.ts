import { IsInt, Min } from 'class-validator';

export class JoinRideDto {
  @IsInt()
  @Min(1)
  seats: number;
}
