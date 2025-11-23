import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { SolanaService } from '../shared/solana.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ApiResponse, Transaction } from '../shared/types';

@Injectable()
export class PaymentsService {
  constructor(
    private supabaseService: SupabaseService,
    private solanaService: SolanaService,
  ) {}

  /**
   * Verify Solana transaction and record payment
   */
  async verifyPayment(userId: string, verifyDto: VerifyPaymentDto): Promise<ApiResponse<Transaction>> {
    const supabase = this.supabaseService.getAdminClient();

    // 1. Check if transaction already recorded (prevent double-spend)
    const { data: existing } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_hash', verifyDto.txHash)
      .single();

    if (existing) {
      throw new BadRequestException('Transaction already recorded');
    }

    // 2. Verify transaction on-chain
    const verification = await this.solanaService.verifyTransaction(verifyDto.txHash);

    if (!verification.isValid) {
      throw new BadRequestException('Invalid transaction');
    }

    // 3. Verify recipient matches
    if (verification.to !== verifyDto.recipientWallet) {
      throw new BadRequestException('Transaction recipient does not match');
    }

    // 4. Verify amount matches (with some tolerance for fees)
    const expectedAmount = verifyDto.amount;
    const actualAmount = verification.amount || 0;
    const tolerance = 0.01; // 1% tolerance

    if (Math.abs(actualAmount - expectedAmount) > tolerance) {
      throw new BadRequestException('Transaction amount does not match');
    }

    // 5. Record transaction in database
    const newTransaction = {
      tx_hash: verifyDto.txHash,
      from_wallet: verification.from,
      to_wallet: verification.to,
      amount: actualAmount,
      type: verifyDto.type,
      project_id: verifyDto.projectId || null,
      comment_id: verifyDto.commentId || null,
      user_id: userId,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(newTransaction)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record transaction: ${error.message}`);
    }

    // 6. Update reputation score (optional logic)
    // Award reputation to both sender and receiver
    await this.updateReputation(userId, verifyDto.recipientWallet, actualAmount);

    const transactionResponse: Transaction = {
      id: transaction.id,
      txHash: transaction.tx_hash,
      from: transaction.from_wallet,
      to: transaction.to_wallet,
      amount: transaction.amount,
      type: transaction.type,
      projectId: transaction.project_id,
      commentId: transaction.comment_id,
      status: transaction.status,
      createdAt: transaction.created_at,
    };

    return {
      success: true,
      data: transactionResponse,
      message: 'Payment verified and recorded successfully',
    };
  }

  /**
   * Update reputation scores for sender and receiver
   */
  private async updateReputation(senderId: string, recipientWallet: string, amount: number) {
    const supabase = this.supabaseService.getAdminClient();

    // Get recipient user
    const { data: recipient } = await supabase
      .from('users')
      .select('id')
      .eq('wallet', recipientWallet)
      .single();

    if (recipient) {
      // Award reputation points (e.g., 1 point per 0.1 SOL)
      const points = Math.floor(amount * 10);

      // Update recipient reputation
      await supabase.rpc('add_reputation_points', {
        user_id: recipient.id,
        points: points,
      });

      // Update sender reputation (smaller amount)
      await supabase.rpc('add_reputation_points', {
        user_id: senderId,
        points: Math.floor(points / 2),
      });
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userId: string): Promise<ApiResponse<Transaction[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    const transactionsResponse: Transaction[] = transactions.map(t => ({
      id: t.id,
      txHash: t.tx_hash,
      from: t.from_wallet,
      to: t.to_wallet,
      amount: t.amount,
      type: t.type,
      projectId: t.project_id,
      commentId: t.comment_id,
      status: t.status,
      createdAt: t.created_at,
    }));

    return {
      success: true,
      data: transactionsResponse,
    };
  }
}
