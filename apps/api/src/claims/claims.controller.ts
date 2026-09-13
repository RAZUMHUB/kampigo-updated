import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ClaimsService } from './claims.service';
import { AnswerVerificationDto, CreateClaimDto, DecideClaimDto } from './dto/create-claim.dto';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClaimDto) {
    return this.claimsService.createClaim(user.id, user.universityId, dto);
  }

  @Post('verification-answers')
  answer(@CurrentUser() user: AuthenticatedUser, @Body() dto: AnswerVerificationDto) {
    return this.claimsService.answerVerificationQuestion(user.id, dto.questionId, dto.answer);
  }

  @Get(':id/verification-answers')
  getAnswers(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.claimsService.getVerificationAnswers(user.id, user.role, id, user.universityId);
  }

  @Patch(':id/decision')
  decide(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: DecideClaimDto) {
    return this.claimsService.decideClaim(user.id, user.role, user.universityId, id, dto.decision);
  }

  @Patch(':id/confirm-recovery')
  confirmRecovery(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.claimsService.confirmRecovery(user.id, id);
  }
}
