import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { SolanaService } from '../shared/solana.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreatePoolSupportDto } from './dto/create-pool-support.dto';
import { ApiResponse, Transaction } from '../shared/types';
import Stripe from 'stripe';
import { CreateStripeCheckoutDto } from './dto/create-stripe-checkout.dto';

@Injectable()
export class PaymentsService {
  private readonly aiPackPriceUsd = 1;
  private readonly aiPackQuestionCredits = 5;
  private readonly pro5PriceUsd = 5;
  private readonly pro10PriceUsd = 10;
  private readonly aiQuestionPackTreasuryWallet = 'FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm';
  private readonly stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any })
    : null;

  constructor(
    private supabaseService: SupabaseService,
    private solanaService: SolanaService,
  ) {}

  async recordPoolSupport(dto: CreatePoolSupportDto): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    const supporterWallet = dto.supporterWallet;
    if (!supporterWallet) {
      throw new BadRequestException('supporterWallet is required');
    }

    // Best-effort link to user id by wallet (supports non-logged-in wallet donors)
    const { data: linkedUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet', supporterWallet)
      .maybeSingle();

    const row = {
      project_id: dto.projectId,
      supporter_wallet: supporterWallet,
      supporter_user_id: linkedUser?.id || null,
      tx_hash: dto.txHash,
      amount_usdc: dto.amountUsdc,
      fee_usdc: dto.feeUsdc,
      treasury_wallet: dto.treasuryWallet,
      confirmed_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pool_supports')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      if ((error as any)?.message?.toLowerCase?.().includes('duplicate')) {
        return { success: true, data: null, message: 'Support already recorded' };
      }
      throw new Error(`Failed to record pool support: ${error.message}`);
    }

    return { success: true, data, message: 'Pool support recorded' };
  }

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

  async redeemAiPack(userId: string, txHash: string): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    const treasuryWallet = this.aiQuestionPackTreasuryWallet;

    const { data: existingPack } = await supabase
      .from('ai_question_pack_purchases')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (existingPack) {
      throw new BadRequestException('This transaction has already been redeemed');
    }

    const verification = await this.solanaService.verifyTransaction(txHash);
    if (!verification.isValid) {
      throw new BadRequestException('Invalid transaction');
    }

    if (verification.to !== treasuryWallet) {
      throw new BadRequestException('Transaction recipient mismatch for AI pack');
    }

    if ((verification.amount || 0) < this.aiPackPriceUsd) {
      throw new BadRequestException('Transaction amount is lower than required amount');
    }

    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (!existingTx) {
      const { error: txError } = await supabase.from('transactions').insert({
        tx_hash: txHash,
        from_wallet: verification.from,
        to_wallet: verification.to,
        amount: verification.amount || this.aiPackPriceUsd,
        type: 'reward',
        user_id: userId,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      });
      if (txError) throw new BadRequestException(`Failed to record tx: ${txError.message}`);
    }

    const { error: purchaseError } = await supabase
      .from('ai_question_pack_purchases')
      .insert({
        user_id: userId,
        tx_hash: txHash,
        amount_usd: this.aiPackPriceUsd,
        questions_granted: this.aiPackQuestionCredits,
        status: 'confirmed',
      });

    if (purchaseError) {
      throw new BadRequestException(`Failed to record AI pack purchase: ${purchaseError.message}`);
    }

    const { data: currentCredits } = await supabase
      .from('user_ai_credits')
      .select('paid_credits')
      .eq('user_id', userId)
      .maybeSingle();

    const nextCredits = (currentCredits?.paid_credits || 0) + this.aiPackQuestionCredits;

    const { error: creditsError } = await supabase
      .from('user_ai_credits')
      .upsert(
        {
          user_id: userId,
          free_interactions_remaining: 2,
          paid_credits: nextCredits,
          total_interactions_used: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (creditsError) {
      throw new BadRequestException(`Failed to grant question credits: ${creditsError.message}`);
    }

    return {
      success: true,
      data: {
        txHash,
        questionsGranted: this.aiPackQuestionCredits,
        paidCredits: nextCredits,
      },
      message: 'AI question pack redeemed successfully',
    };
  }

  async redeemPlan(userId: string, txHash: string, planTier: 'pro5' | 'pro10'): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    const requiredAmount = planTier === 'pro10' ? this.pro10PriceUsd : this.pro5PriceUsd;

    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    const verification = await this.solanaService.verifyTransaction(txHash);
    if (!verification.isValid) throw new BadRequestException('Invalid transaction');
    if (verification.to !== this.aiQuestionPackTreasuryWallet) {
      throw new BadRequestException('Transaction recipient mismatch');
    }
    if ((verification.amount || 0) < requiredAmount) {
      throw new BadRequestException(`Transaction amount is lower than required ${requiredAmount}`);
    }

    if (!existingTx) {
      const { error: txError } = await supabase.from('transactions').insert({
        tx_hash: txHash,
        from_wallet: verification.from,
        to_wallet: verification.to,
        amount: verification.amount || requiredAmount,
        type: 'reward',
        user_id: userId,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      });
      if (txError) throw new BadRequestException(`Failed to record tx: ${txError.message}`);
    }

    const now = new Date();
    const { data: user } = await supabase
      .from('users')
      .select('plan_expires_at')
      .eq('id', userId)
      .single();

    const currentExpiry = user?.plan_expires_at ? new Date(user.plan_expires_at) : null;
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const nextExpiry = new Date(base);
    nextExpiry.setUTCDate(nextExpiry.getUTCDate() + 30);

    const { error: planError } = await supabase
      .from('users')
      .update({ plan_tier: planTier, plan_expires_at: nextExpiry.toISOString() })
      .eq('id', userId);

    if (planError) throw new BadRequestException(`Failed to update plan: ${planError.message}`);

    return {
      success: true,
      data: {
        txHash,
        planTier,
        planExpiresAt: nextExpiry.toISOString(),
      },
      message: 'Plan redeemed successfully',
    };
  }

  async createStripeCheckout(userId: string, dto: CreateStripeCheckoutDto): Promise<ApiResponse<any>> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const priceMap: Record<string, string | undefined> = {
      pack: process.env.STRIPE_PRICE_PACK,
      pro5: process.env.STRIPE_PRICE_PRO5,
      pro10: process.env.STRIPE_PRICE_PRO10,
    };

    const priceId = priceMap[dto.plan];
    if (!priceId) {
      throw new BadRequestException(`Missing Stripe price for plan ${dto.plan}`);
    }

    const successUrl = `${process.env.FRONTEND_URL || 'https://gimmeidea.com'}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'https://gimmeidea.com'}/billing?canceled=1`;

    const session = await this.stripe.checkout.sessions.create({
      mode: dto.plan === 'pack' ? 'payment' : 'subscription',
      customer_email: dto.payerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan: dto.plan,
        payerName: dto.payerName,
        payerEmail: dto.payerEmail,
        country: dto.country || '',
      },
    });

    const supabase = this.supabaseService.getAdminClient();
    await supabase.from('billing_payments').insert({
      user_id: userId,
      provider: 'stripe',
      provider_session_id: session.id,
      plan: dto.plan,
      status: 'pending',
      payer_name: dto.payerName,
      payer_email: dto.payerEmail,
      payer_country: dto.country || null,
      amount_usd: dto.plan === 'pack' ? 1 : dto.plan === 'pro5' ? 5 : 10,
      currency: 'USD',
    });

    return { success: true, data: { url: session.url, sessionId: session.id } };
  }

  async confirmStripeCheckout(userId: string, sessionId: string): Promise<ApiResponse<any>> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid' || session.status === 'complete';
    if (!paid) {
      return { success: false, error: 'Payment is not completed yet' };
    }

    const plan = (session.metadata?.plan || 'pack') as 'pack' | 'pro5' | 'pro10';
    const supabase = this.supabaseService.getAdminClient();

    if (plan === 'pack') {
      const { data: currentCredits } = await supabase
        .from('user_ai_credits')
        .select('paid_credits')
        .eq('user_id', userId)
        .maybeSingle();
      const nextCredits = (currentCredits?.paid_credits || 0) + this.aiPackQuestionCredits;
      await supabase.from('user_ai_credits').upsert({
        user_id: userId,
        free_interactions_remaining: 2,
        paid_credits: nextCredits,
        total_interactions_used: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } else {
      const now = new Date();
      const { data: user } = await supabase.from('users').select('plan_expires_at').eq('id', userId).single();
      const currentExpiry = user?.plan_expires_at ? new Date(user.plan_expires_at) : null;
      const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
      const nextExpiry = new Date(base);
      nextExpiry.setUTCDate(nextExpiry.getUTCDate() + 30);
      await supabase.from('users').update({ plan_tier: plan, plan_expires_at: nextExpiry.toISOString() }).eq('id', userId);
    }

    await supabase
      .from('billing_payments')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('provider_session_id', sessionId)
      .eq('user_id', userId);

    return { success: true, data: { paid: true, plan } };
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

  /**
   * Get top donators based on canonical pool_supports ledger.
   */
  async getTopDonators(limit: number = 10): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('pool_supports')
      .select(`
        supporter_wallet,
        amount_usdc,
        supporter:users!pool_supports_supporter_user_id_fkey(username, avatar)
      `)
      .order('confirmed_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch donators: ${error.message}`);
    }

    const donatorMap = new Map<string, any>();

    data?.forEach((tx: any) => {
      const wallet = tx.supporter_wallet;
      const user = Array.isArray(tx.supporter) ? tx.supporter[0] : tx.supporter;

      if (!donatorMap.has(wallet)) {
        donatorMap.set(wallet, {
          wallet,
          username: user?.username || 'Anonymous',
          avatar: user?.avatar,
          totalDonated: 0,
          donationCount: 0,
          unit: 'USDC',
        });
      }

      const donator = donatorMap.get(wallet);
      donator.totalDonated += Number(tx.amount_usdc || 0);
      donator.donationCount += 1;
    });

    const topDonators = Array.from(donatorMap.values())
      .sort((a, b) => b.totalDonated - a.totalDonated)
      .slice(0, limit);

    return {
      success: true,
      data: topDonators,
    };
  }

  /**
   * Get recent donations (for donate page)
   */
  async getRecentDonations(limit: number = 20): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: donations, error } = await supabase
      .from('transactions')
      .select(`
        *,
        from_user:users!transactions_user_id_fkey(username, avatar),
        project:projects(title)
      `)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent donations: ${error.message}`);
    }

    const recentDonations = donations?.map(d => ({
      id: d.id,
      txHash: d.tx_hash,
      from: {
        wallet: d.from_wallet,
        username: d.from_user?.username || 'Anonymous',
        avatar: d.from_user?.avatar,
      },
      to: {
        wallet: d.to_wallet,
      },
      amount: d.amount,
      type: d.type,
      project: d.project ? { title: d.project.title } : null,
      createdAt: d.created_at,
    })) || [];

    return {
      success: true,
      data: recentDonations,
    };
  }
}
