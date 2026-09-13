import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { AlertsService } from './alerts.service';
import { RazorpayService } from './razorpay.service';
import { CreateTopupOrderDto, PurchaseAlertDto } from './dto/wallet.dto';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly alertsService: AlertsService,
    private readonly razorpay: RazorpayService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  balance(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getBalance(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  transactions(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getTransactionHistory(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('topup/order')
  createTopupOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTopupOrderDto) {
    return this.walletService.createTopupOrder(
      user.id,
      user.universityId,
      dto.amountInRupees,
      dto.idempotencyKey,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('alerts/purchase')
  purchaseAlert(@CurrentUser() user: AuthenticatedUser, @Body() dto: PurchaseAlertDto) {
    return this.alertsService.purchaseAlert(user.id, user.universityId, dto.lostItemId, dto.idempotencyKey);
  }

  /**
   * Razorpay webhook - the ONLY path that credits a wallet top-up. Requires
   * the raw request body (configure a raw-body parser for this route in
   * main.ts / a dedicated middleware) so the HMAC signature can be verified
   * against the exact bytes Razorpay signed.
   */
  @Post('webhooks/razorpay')
  async razorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? '';
    const valid = this.razorpay.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return { status: 'ignored', reason: 'invalid signature' };
    }

    const payload = JSON.parse(rawBody);
    const eventId: string = payload.id ?? payload.event_id ?? `${payload.event}-${Date.now()}`;

    const existing = await this.prisma.razorpayWebhookEvent.findUnique({ where: { eventId } });
    if (existing?.processedAt) {
      return { status: 'duplicate-ignored' };
    }

    await this.prisma.razorpayWebhookEvent.upsert({
      where: { eventId },
      create: { eventId, eventType: payload.event, rawPayload: payload },
      update: {},
    });

    if (payload.event === 'payment.captured') {
      const paymentReference = payload.payload?.payment?.entity?.order_id;
      if (paymentReference) {
        await this.walletService.completeTopupFromWebhook(paymentReference);
      }
    }

    await this.prisma.razorpayWebhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    });

    return { status: 'processed' };
  }
}
