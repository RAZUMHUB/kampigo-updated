import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateClaimDto {
  @IsUUID() foundItemId: string;
  @IsOptional() @IsUUID() lostItemId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  verificationQuestions: string[];
}

export class AnswerVerificationDto {
  @IsUUID() questionId: string;
  @IsString() @MaxLength(500) answer: string;
}

export class DecideClaimDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';
}
