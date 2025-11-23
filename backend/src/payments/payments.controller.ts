import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiResponse, Transaction } from '../shared/types';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /**
   * POST /api/payments/verify
   * Verify Solana transaction (requires authentication)
   */
  @Post('verify')
  @UseGuards(AuthGuard)
  async verifyPayment(
    @CurrentUser('userId') userId: string,
    @Body() verifyDto: VerifyPaymentDto
  ): Promise<ApiResponse<Transaction>> {
    return this.paymentsService.verifyPayment(userId, verifyDto);
  }

  /**
   * GET /api/payments/history
   * Get transaction history for current user (requires authentication)
   */
  @Get('history')
  @UseGuards(AuthGuard)
  async getHistory(@CurrentUser('userId') userId: string): Promise<ApiResponse<Transaction[]>> {
    return this.paymentsService.getTransactionHistory(userId);
  }
}
