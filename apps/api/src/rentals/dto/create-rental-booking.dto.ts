import { IsUUID } from 'class-validator';

export class CreateRentalBookingDto {
  @IsUUID()
  rentalId: string;
}
