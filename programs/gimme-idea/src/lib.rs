use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("GiMxxx..."); // Replace with your program ID after anchor build

#[program]
pub mod gimme_idea {
    use super::*;

    /// Initialize a new bounty escrow for a project
    /// The project owner locks funds that will be released to reviewers
    pub fn initialize_bounty(
        ctx: Context<InitializeBounty>,
        bounty_amount: u64,
        project_id: String,
    ) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;

        bounty.owner = ctx.accounts.owner.key();
        bounty.amount = bounty_amount;
        bounty.project_id = project_id;
        bounty.is_released = false;
        bounty.recipient = None;
        bounty.bump = ctx.bumps.bounty;

        msg!("Bounty initialized: {} lamports for project: {}", bounty_amount, bounty.project_id);

        Ok(())
    }

    /// Release bounty to a reviewer after their feedback is accepted
    /// Only the project owner can release the bounty
    pub fn release_bounty(
        ctx: Context<ReleaseBounty>,
        recipient: Pubkey,
    ) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;

        require!(!bounty.is_released, ErrorCode::BountyAlreadyReleased);
        require!(bounty.owner == ctx.accounts.owner.key(), ErrorCode::Unauthorized);

        // Transfer tokens from escrow to recipient
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.bounty.to_account_info(),
        };

        let seeds = &[
            b"bounty",
            bounty.project_id.as_bytes(),
            &[bounty.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, bounty.amount)?;

        bounty.is_released = true;
        bounty.recipient = Some(recipient);

        msg!("Bounty released: {} lamports to {}", bounty.amount, recipient);

        Ok(())
    }

    /// Cancel bounty and return funds to owner
    /// Only available if bounty hasn't been released yet
    pub fn cancel_bounty(ctx: Context<CancelBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;

        require!(!bounty.is_released, ErrorCode::BountyAlreadyReleased);
        require!(bounty.owner == ctx.accounts.owner.key(), ErrorCode::Unauthorized);

        // Transfer tokens back to owner
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.bounty.to_account_info(),
        };

        let seeds = &[
            b"bounty",
            bounty.project_id.as_bytes(),
            &[bounty.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, bounty.amount)?;

        msg!("Bounty cancelled and refunded to owner");

        Ok(())
    }
}

// ============================================
// ACCOUNTS STRUCTS
// ============================================

#[derive(Accounts)]
#[instruction(project_id: String)]
pub struct InitializeBounty<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Bounty::INIT_SPACE,
        seeds = [b"bounty", project_id.as_bytes()],
        bump
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseBounty<'info> {
    #[account(mut)]
    pub bounty: Account<'info, Bounty>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelBounty<'info> {
    #[account(mut)]
    pub bounty: Account<'info, Bounty>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// ============================================
// STATE
// ============================================

#[account]
pub struct Bounty {
    pub owner: Pubkey,           // Project owner
    pub amount: u64,             // Bounty amount in lamports
    pub project_id: String,      // Project identifier (from database)
    pub is_released: bool,       // Has bounty been released?
    pub recipient: Option<Pubkey>, // Recipient if released
    pub bump: u8,                // PDA bump seed
}

impl Bounty {
    pub const INIT_SPACE: usize = 32 + 8 + 64 + 1 + 33 + 1;
}

// ============================================
// ERRORS
// ============================================

#[error_code]
pub enum ErrorCode {
    #[msg("Bounty has already been released")]
    BountyAlreadyReleased,

    #[msg("Unauthorized: Only the project owner can perform this action")]
    Unauthorized,

    #[msg("Invalid recipient")]
    InvalidRecipient,
}
