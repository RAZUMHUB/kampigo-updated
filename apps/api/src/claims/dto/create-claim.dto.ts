import { IsArray, IsOptional, IsString, IsUUID, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class CreateClaimDto {
  @IsUUID() foundItemId: string;
  @IsOptional() @IsUUID() lostItemId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  verificationQuestions: string[];
}

export class AnswerVerificationDto {
  @IsUUID() questionId: string;
  @IsString() answer: string;
}

export class DecideClaimDto {
  @IsString() decision: 'APPROVED' | 'REJECTED';
}
