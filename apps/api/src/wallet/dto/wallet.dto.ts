import { IsInt, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

/** Amount is always in whole Rupees from the client; converted to paise internally. */
export class CreateTopupOrderDto {
  @IsInt()
  @Min(100, { message: 'Minimum wallet top-up amount is Rs. 100' })
  amountInRupees: number;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey: string;
}

export class PurchaseAlertDto {
  @IsUUID()
  lostItemId: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey: string;
}
