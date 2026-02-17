import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreatePoolSupportDto } from './dto/create-pool-support.dto';
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

  /**
   * POST /api/payments/pool-support
   * Record canonical support ledger entry after successful USDC support tx
   */
  @Post('pool-support')
  async recordPoolSupport(@Body() dto: CreatePoolSupportDto): Promise<ApiResponse<any>> {
    return this.paymentsService.recordPoolSupport(dto);
  }

  /**
   * GET /api/payments/top-donators
   * Get top donators (public - for donate page)
   */
  @Get('top-donators')
  async getTopDonators(@Query('limit') limit?: string): Promise<ApiResponse<any[]>> {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.paymentsService.getTopDonators(limitNum);
  }

  /**
   * GET /api/payments/recent-donations
   * Get recent donations (public - for donate page)
   */
  @Get('recent-donations')
  async getRecentDonations(@Query('limit') limit?: string): Promise<ApiResponse<any[]>> {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.paymentsService.getRecentDonations(limitNum);
  }
}
