use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AqDHUSYhd5m7yZtBRMeTDuo15hb2uavMpm7NiM8DwPrx");

#[error_code]
pub enum ErrorCode {
    #[msg("Pool has not ended yet")]
    PoolNotEnded,

    #[msg("Pool has already ended")]
    PoolEnded,

    #[msg("Invalid number of winners")]
    InvalidWinnersCount,

    #[msg("Invalid distribution percentages")]
    InvalidDistribution,

    #[msg("Distribution must sum to 100")]
    DistributionNotHundred,

    #[msg("Winners array length mismatch")]
    WinnersLengthMismatch,

    #[msg("All winners must be set before claiming")]
    WinnersNotSet,

    #[msg("Invalid winner address")]
    InvalidWinner,

    #[msg("Prize already claimed")]
    AlreadyClaimed,

    #[msg("Invalid rank")]
    InvalidRank,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Insufficient funds in pool")]
    InsufficientFunds,

    #[msg("Only owner can perform this action")]
    Unauthorized,

    #[msg("Pool already distributed")]
    AlreadyDistributed,

    #[msg("Post ID too long (max 64 chars)")]
    PostIdTooLong,
}

#[account]
#[derive(Default)]
pub struct PrizePool {
    /// Post owner who created the pool
    pub owner: Pubkey,

    /// Post ID from database (for reference)
    pub post_id: String,

    /// USDC mint address
    pub usdc_mint: Pubkey,

    /// Total amount in pool (in USDC smallest unit - 6 decimals)
    pub total_amount: u64,

    /// Number of winners
    pub winners_count: u8,

    /// Prize distribution percentages (must sum to 100)
    /// e.g., [50, 30, 20] for 3 winners
    pub distribution: Vec<u8>,

    /// Winners' wallet addresses (set by owner after ranking)
    pub winners: Vec<Pubkey>,

    /// Track which winners have claimed
    pub claimed: Vec<bool>,

    /// Total amount claimed so far
    pub total_claimed: u64,

    /// Timestamp when pool ends
    pub ends_at: i64,

    /// Whether all prizes have been distributed
    pub distributed: bool,

    /// Bump seed for PDA
    pub bump: u8,
}

impl PrizePool {
    /// Calculate space needed for this account
    /// 8 (discriminator) + 32 (owner) + 4+64 (post_id) + 32 (usdc_mint)
    /// + 8 (total_amount) + 1 (winners_count) + 4+max_winners (distribution)
    /// + 4+32*max_winners (winners) + 4+max_winners (claimed)
    /// + 8 (total_claimed) + 8 (ends_at) + 1 (distributed) + 1 (bump)
    /// max_winners = 10 for safety
    pub const MAX_WINNERS: usize = 10;
    pub const SPACE: usize = 8 + 32 + 4 + 64 + 32 + 8 + 1
        + (4 + Self::MAX_WINNERS)
        + (4 + 32 * Self::MAX_WINNERS)
        + (4 + Self::MAX_WINNERS)
        + 8 + 8 + 1 + 1
        + 100; // Extra padding for safety

    /// Check if pool has ended
    pub fn has_ended(&self, current_time: i64) -> bool {
        current_time >= self.ends_at
    }

    /// Check if all winners are set
    pub fn all_winners_set(&self) -> bool {
        self.winners.len() == self.winners_count as usize
    }

    /// Check if a specific winner has claimed
    pub fn has_claimed(&self, winner_index: usize) -> bool {
        if winner_index >= self.claimed.len() {
            return false;
        }
        self.claimed[winner_index]
    }

    /// Calculate prize amount for a specific rank
    pub fn calculate_prize(&self, rank: usize) -> Result<u64> {
        if rank >= self.distribution.len() {
            return Err(error!(ErrorCode::InvalidRank));
        }

        let percentage = self.distribution[rank] as u64;
        let amount = (self.total_amount as u128)
            .checked_mul(percentage as u128)
            .ok_or(error!(ErrorCode::MathOverflow))?
            .checked_div(100)
            .ok_or(error!(ErrorCode::MathOverflow))? as u64;

        Ok(amount)
    }

    /// Check if all prizes have been claimed
    pub fn all_claimed(&self) -> bool {
        self.claimed.iter().all(|&claimed| claimed)
    }
}

#[program]
pub mod gimme_idea {
    use super::*;

    /// Create a new prize pool for a post
    ///
    /// # Arguments
    /// * `post_id` - Unique identifier from database
    /// * `total_amount` - Total USDC amount for prize pool (in smallest unit, 6 decimals)
    /// * `distribution` - Prize distribution percentages (must sum to 100)
    /// * `ends_at` - Unix timestamp when pool ends
    pub fn create_pool(
        ctx: Context<CreatePool>,
        post_id: String,
        total_amount: u64,
        distribution: Vec<u8>,
        ends_at: i64,
    ) -> Result<()> {
        let prize_pool = &mut ctx.accounts.prize_pool;

        // Validate post_id length
        require!(post_id.len() <= 64, ErrorCode::PostIdTooLong);

        // Validate winners count
        let winners_count = distribution.len();
        require!(
            winners_count > 0 && winners_count <= PrizePool::MAX_WINNERS,
            ErrorCode::InvalidWinnersCount
        );

        // Validate distribution sums to 100
        let sum: u8 = distribution.iter().sum();
        require!(sum == 100, ErrorCode::DistributionNotHundred);

        // Validate each percentage is > 0
        require!(
            distribution.iter().all(|&p| p > 0),
            ErrorCode::InvalidDistribution
        );

        // Validate amount
        require!(total_amount > 0, ErrorCode::InsufficientFunds);

        // Validate end time is in future
        let current_time = Clock::get()?.unix_timestamp;
        require!(ends_at > current_time, ErrorCode::PoolEnded);

        // Initialize prize pool
        prize_pool.owner = ctx.accounts.owner.key();
        prize_pool.post_id = post_id;
        prize_pool.usdc_mint = ctx.accounts.usdc_mint.key();
        prize_pool.total_amount = total_amount;
        prize_pool.winners_count = winners_count as u8;
        prize_pool.distribution = distribution;
        prize_pool.winners = Vec::new();
        prize_pool.claimed = Vec::new();
        prize_pool.total_claimed = 0;
        prize_pool.ends_at = ends_at;
        prize_pool.distributed = false;
        prize_pool.bump = ctx.bumps.prize_pool;

        // Transfer USDC from owner to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.owner_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, total_amount)?;

        msg!("Prize pool created for post: {}", prize_pool.post_id);
        msg!("Total amount: {} USDC", total_amount);
        msg!("Winners count: {}", winners_count);

        Ok(())
    }

    /// Set winners for a prize pool (only owner, after pool ends)
    ///
    /// # Arguments
    /// * `winners` - Pubkeys of winner wallets in rank order
    pub fn set_winners(ctx: Context<SetWinners>, winners: Vec<Pubkey>) -> Result<()> {
        let prize_pool = &mut ctx.accounts.prize_pool;

        // Check if pool has ended
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            prize_pool.has_ended(current_time),
            ErrorCode::PoolNotEnded
        );

        // Validate winners count matches distribution
        require!(
            winners.len() == prize_pool.winners_count as usize,
            ErrorCode::WinnersLengthMismatch
        );

        // Validate all winners are valid addresses (not system program)
        require!(
            winners.iter().all(|w| *w != Pubkey::default()),
            ErrorCode::InvalidWinner
        );

        // Set winners
        prize_pool.winners = winners.clone();

        // Initialize claimed array (all false)
        prize_pool.claimed = vec![false; winners.len()];

        // Mark as distributed (winners are set, ready for claiming)
        prize_pool.distributed = true;

        msg!("Winners set for post: {}", prize_pool.post_id);
        msg!("Winners: {:?}", winners);

        Ok(())
    }

    /// Claim prize (only winners, after distribution)
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let prize_pool = &mut ctx.accounts.prize_pool;

        // Check if winners are set
        require!(prize_pool.distributed, ErrorCode::WinnersNotSet);

        // Find winner index
        let winner_pubkey = ctx.accounts.winner.key();
        let winner_index = prize_pool
            .winners
            .iter()
            .position(|w| *w == winner_pubkey)
            .ok_or(ErrorCode::InvalidWinner)?;

        // Check if already claimed
        require!(
            !prize_pool.has_claimed(winner_index),
            ErrorCode::AlreadyClaimed
        );

        // Calculate prize amount
        let prize_.
    }

    /// Emergency withdraw funds (only owner)
    /// Can be used if winners not set, or after all prizes claimed
    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        let prize_pool = &ctx.accounts.prize_pool;

        // Can only withdraw if:
        // 1. Winners not set yet (distributed = false), OR
        // 2. All prizes have been claimed
        require!(
            !prize_pool.distributed || prize_pool.all_claimed(),
            ErrorCode::AlreadyDistributed
        );

        // Get remaining balance
        let remaining_balance = ctx.accounts.escrow_token_account.amount;

        if remaining_balance > 0 {
            // Transfer remaining funds back to owner
                    let seeds = &[
                        b"prize_pool".as_ref(),
                        prize_pool.post_id.as_bytes(),
                        &[prize_pool.bump],
                    ];
                    let signer = &[&seeds[..]];
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: prize_pool.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

            token::transfer(cpi_ctx, remaining_balance)?;

            msg!("Emergency withdraw completed");
            msg!("Amount: {} USDC", remaining_balance);
        }

        // The prize_pool account will be closed automatically (see #[account] attribute)
        // and rent will be returned to owner

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(post_id: String)]
pub struct CreatePool<'info> {
    #[account(
        init,
        payer = owner,
        space = PrizePool::SPACE,
        seeds = [b"prize_pool", post_id.as_bytes()],
        bump
    )]
    pub prize_pool: Account<'info, PrizePool>,

    /// Owner's USDC token account (source of funds)
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    /// Escrow token account to hold prize funds
    #[account(
        init,
        payer = owner,
        token::mint = usdc_mint,
        token::authority = prize_pool,
        seeds = [b"escrow", prize_pool.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// USDC mint
    /// CHECK: USDC mint address is validated in instruction
    pub usdc_mint: AccountInfo<'info>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SetWinners<'info> {
    #[account(
        mut,
        has_one = owner
    )]
    pub prize_pool: Account<'info, PrizePool>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub prize_pool: Account<'info, PrizePool>,

    /// Escrow token account holding prize funds
    #[account(
        mut,
        seeds = [b"escrow", prize_pool.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Winner's USDC token account (destination)
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub winner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        mut,
        has_one = owner,
        constraint = prize_pool.owner == owner.key() @ ErrorCode::Unauthorized,
        close = owner
    )]
    pub prize_pool: Account<'info, PrizePool>,

    /// Escrow token account holding prize funds
    #[account(
        mut,
        seeds = [b"escrow", prize_pool.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Owner's USDC token account (destination)
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}