import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/** Amount is always in whole Rupees from the client; converted to paise internally. */
export class CreateTopupOrderDto {
  @IsInt()
  @Min(100, { message: 'Minimum wallet top-up amount is Rs. 100' })
  amountInRupees: number;

  @IsString()
  idempotencyKey: string;
}

export class PurchaseAlertDto {
  @IsUUID()
  lostItemId: string;

  @IsString()
  idempotencyKey: string;
}
