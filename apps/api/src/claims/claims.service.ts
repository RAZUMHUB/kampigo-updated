import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FieldEncryptionService } from '../common/encryption/field-encryption.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Claim lifecycle with strict guarantees:
 *  - Multiple pending claims are allowed on one Found Item.
 *  - Only ONE claim may ever reach APPROVED for a given Found Item - enforced
 *    via a serializable DB transaction that re-checks state before writing.
 *  - Verification answers are per-claimant and field-encrypted; a claimant
 *    can never read another claimant's answers (enforced at the query layer
 *    by always scoping ClaimVerificationQuestion reads through claimId +
 *    claimantId ownership).
 */
@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
    private readonly notifications: NotificationsService,
  ) {}

  async createClaim(claimantId: string, universityId: string, dto: CreateClaimDto) {
    const foundItem = await this.prisma.foundItem.findUnique({ where: { id: dto.foundItemId } });
    if (!foundItem || foundItem.universityId !== universityId) {
      throw new NotFoundException('Found item not found');
    }
    if (foundItem.finderId === claimantId) {
      throw new BadRequestException('You cannot claim an item you reported as found');
    }

    const claim = await this.prisma.claim.create({
      data: {
        foundItemId: dto.foundItemId,
        lostItemId: dto.lostItemId,
        claimantId,
        status: 'VERIFICATION_REQUIRED',
        verificationQuestions: {
          create: dto.verificationQuestions.map((q) => ({ question: q })),
        },
      },
      include: { verificationQuestions: true },
    });

    // Conversation is created eagerly so chat is available as soon as the
    // claim exists; participants are exactly the claimant + finder (and later,
    // any assigned campus authority) - no one else can join.
    const conversation = await this.prisma.conversation.create({
      data: {
        claimId: claim.id,
        participants: {
          create: [{ userId: claimantId }, { userId: foundItem.finderId }],
        },
      },
    });

    await this.notifications.notifyClaimReceived(foundItem.finderId, claim.id);

    return { ...claim, conversationId: conversation.id };
  }

  async answerVerificationQuestion(
    claimantId: string,
    questionId: string,
    answer: string,
  ) {
    const question = await this.prisma.claimVerificationQuestion.findUnique({
      where: { id: questionId },
      include: { claim: true },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.claim.claimantId !== claimantId) {
      // A claimant must never see or answer another claimant's questions.
      throw new ForbiddenException('Not your claim');
    }

    return this.prisma.claimVerificationQuestion.update({
      where: { id: questionId },
      data: { answer: this.encryption.encrypt(answer), answeredAt: new Date() },
    });
  }

  /** Only the finder or a campus authority in the same university may view answers, and only for that specific claim. */
  async getVerificationAnswers(requesterId: string, requesterRole: string, claimId: string, universityId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { foundItem: true, verificationQuestions: true },
    });
    if (!claim || claim.foundItem.universityId !== universityId) throw new NotFoundException();

    const isAuthorized =
      claim.foundItem.finderId === requesterId ||
      requesterRole === 'CAMPUS_AUTHORITY' ||
      requesterRole === 'UNIVERSITY_ADMIN';
    if (!isAuthorized) throw new ForbiddenException();

    return claim.verificationQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer ? this.encryption.decrypt(q.answer) : null,
      answeredAt: q.answeredAt,
    }));
  }

  /**
   * Approves or rejects a claim. Approval uses a serializable transaction:
   * re-reads all claims for the found item inside the transaction and aborts
   * if another claim has already been approved concurrently, preventing two
   * claims from being approved for the same physical item.
   */
  async decideClaim(
    deciderId: string,
    deciderRole: string,
    universityId: string,
    claimId: string,
    decision: 'APPROVED' | 'REJECTED',
  ) {
    if (!['CAMPUS_AUTHORITY', 'UNIVERSITY_ADMIN'].includes(deciderRole)) {
      throw new ForbiddenException('Only a campus authority or admin may decide claims');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const claim = await tx.claim.findUnique({ where: { id: claimId }, include: { foundItem: true } });
        if (!claim || claim.foundItem.universityId !== universityId) throw new NotFoundException();

        if (decision === 'APPROVED') {
          const alreadyApproved = await tx.claim.findFirst({
            where: { foundItemId: claim.foundItemId, status: 'APPROVED' },
          });
          if (alreadyApproved) {
            throw new BadRequestException('Another claim has already been approved for this item');
          }
        }

        const updated = await tx.claim.update({
          where: { id: claimId },
          data: { status: decision, decidedAt: new Date() },
        });

        if (decision === 'APPROVED') {
          // Reject all sibling pending claims atomically within the same transaction.
          await tx.claim.updateMany({
            where: { foundItemId: claim.foundItemId, id: { not: claimId }, status: { in: ['PENDING', 'VERIFICATION_REQUIRED'] } },
            data: { status: 'REJECTED', decidedAt: new Date() },
          });
          await tx.foundItem.update({ where: { id: claim.foundItemId }, data: { status: 'CLAIMED' } });
        }

        return updated;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async confirmRecovery(userId: string, claimId: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException();
    if (claim.claimantId !== userId) throw new ForbiddenException();
    if (claim.status !== 'APPROVED' && claim.status !== 'HANDED_OVER') {
      throw new BadRequestException('Claim must be approved before recovery can be confirmed');
    }

    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: { status: 'RECOVERY_CONFIRMED' },
    });

    if (claim.lostItemId) {
      await this.prisma.lostItem.update({ where: { id: claim.lostItemId }, data: { status: 'RECOVERED' } });
    }

    return updated;
  }
}
