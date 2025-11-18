use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("AqDHUSYhd5m7yZtBRMeTDuo15hb2uavMpm7NiM8DwPrx");

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
        instructions::create_pool::handler(ctx, post_id, total_amount, distribution, ends_at)
    }

    /// Set winners for a prize pool (only owner, after pool ends)
    ///
    /// # Arguments
    /// * `winners` - Pubkeys of winner wallets in rank order
    pub fn set_winners(ctx: Context<SetWinners>, winners: Vec<Pubkey>) -> Result<()> {
        instructions::set_winners::handler(ctx, winners)
    }

    /// Claim prize (only winners, after distribution)
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        instructions::claim_prize::handler(ctx)
    }

    /// Emergency withdraw funds (only owner)
    /// Can be used if winners not set, or after all prizes claimed
    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>) -> Result<()> {
        instructions::emergency_withdraw::handler(ctx)
    }
}
