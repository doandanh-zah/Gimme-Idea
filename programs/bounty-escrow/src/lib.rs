#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

declare_id!("BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6");

const PLATFORM_SEED: &[u8] = b"platform";
const BOUNTY_SEED: &[u8] = b"bounty";
const BPS_DENOMINATOR: u128 = 10_000;
const DEVNET_INITIALIZER: Pubkey = pubkey!("HrsRZ43rXfXJjLtzdyNYAVvNEZc6faQkMJwFhiHnVSUu");

#[program]
pub mod bounty_escrow {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        pause_authority: Pubkey,
        arbitration_authority: Pubkey,
        treasury: Pubkey,
        max_platform_fee_bps: u16,
        max_bounty_amount: u64,
    ) -> Result<()> {
        require!(max_platform_fee_bps <= 10_000, EscrowError::FeeTooHigh);
        require!(max_bounty_amount > 0, EscrowError::InvalidAmount);
        require_keys_neq!(
            pause_authority,
            Pubkey::default(),
            EscrowError::InvalidAuthority
        );
        require_keys_neq!(
            arbitration_authority,
            Pubkey::default(),
            EscrowError::InvalidAuthority
        );
        require_keys_neq!(treasury, Pubkey::default(), EscrowError::InvalidAuthority);

        let config = &mut ctx.accounts.platform_config;
        config.admin = ctx.accounts.admin.key();
        config.pause_authority = pause_authority;
        config.arbitration_authority = arbitration_authority;
        config.treasury = treasury;
        config.approved_mint = ctx.accounts.approved_mint.key();
        config.max_platform_fee_bps = max_platform_fee_bps;
        config.max_bounty_amount = max_bounty_amount;
        config.paused = false;
        config.bump = ctx.bumps.platform_config;

        emit!(PlatformInitialized {
            admin: config.admin,
            approved_mint: config.approved_mint,
            treasury: config.treasury,
        });
        Ok(())
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        ctx.accounts.platform_config.paused = paused;
        emit!(PauseChanged {
            authority: ctx.accounts.pause_authority.key(),
            paused,
        });
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn initialize_bounty(
        ctx: Context<InitializeBounty>,
        bounty_id: [u8; 32],
        terms_hash: [u8; 32],
        judge: Pubkey,
        prize_pool: u64,
        platform_fee: u64,
        submission_deadline: i64,
        judging_deadline: i64,
    ) -> Result<()> {
        assert_not_paused(&ctx.accounts.platform_config)?;
        require!(bounty_id != [0; 32], EscrowError::InvalidBountyId);
        require!(terms_hash != [0; 32], EscrowError::InvalidTermsHash);
        require_keys_neq!(judge, Pubkey::default(), EscrowError::InvalidAuthority);
        require!(prize_pool > 0, EscrowError::InvalidAmount);

        let now = Clock::get()?.unix_timestamp;
        require!(submission_deadline > now, EscrowError::InvalidDeadline);
        require!(
            judging_deadline > submission_deadline,
            EscrowError::InvalidDeadline
        );

        let required_total = checked_add(prize_pool, platform_fee)?;
        require!(
            required_total <= ctx.accounts.platform_config.max_bounty_amount,
            EscrowError::BountyLimitExceeded
        );
        let maximum_fee = (prize_pool as u128)
            .checked_mul(ctx.accounts.platform_config.max_platform_fee_bps as u128)
            .ok_or(EscrowError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(EscrowError::MathOverflow)?;
        require!(platform_fee as u128 <= maximum_fee, EscrowError::FeeTooHigh);

        let bounty = &mut ctx.accounts.bounty;
        bounty.bounty_id = bounty_id;
        bounty.terms_hash = terms_hash;
        bounty.sponsor = ctx.accounts.sponsor.key();
        bounty.judge = judge;
        bounty.mint = ctx.accounts.mint.key();
        bounty.prize_pool = prize_pool;
        bounty.platform_fee = platform_fee;
        bounty.total_deposited = 0;
        bounty.submission_deadline = submission_deadline;
        bounty.judging_deadline = judging_deadline;
        bounty.winner = Pubkey::default();
        bounty.state = BountyState::Initialized;
        bounty.created_at = now;
        bounty.activated_at = 0;
        bounty.settled_at = 0;
        bounty.bump = ctx.bumps.bounty;

        emit!(BountyInitialized {
            bounty: bounty.key(),
            bounty_id,
            sponsor: bounty.sponsor,
            mint: bounty.mint,
            required_total,
        });
        Ok(())
    }

    pub fn fund_bounty(ctx: Context<FundBounty>) -> Result<()> {
        assert_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.bounty.state == BountyState::Initialized,
            EscrowError::InvalidState
        );

        let required_total = ctx.accounts.bounty.required_total()?;
        let current_balance = ctx.accounts.vault.amount;
        require!(
            current_balance <= required_total,
            EscrowError::VaultOverfunded
        );
        let remaining = required_total
            .checked_sub(current_balance)
            .ok_or(EscrowError::MathOverflow)?;

        if remaining > 0 {
            let cpi_accounts = TransferChecked {
                from: ctx.accounts.sponsor_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.sponsor.to_account_info(),
            };
            token_interface::transfer_checked(
                CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
                remaining,
                ctx.accounts.mint.decimals,
            )?;
        }

        ctx.accounts.vault.reload()?;
        require!(
            ctx.accounts.vault.amount == required_total,
            EscrowError::FundingMismatch
        );
        ctx.accounts.bounty.total_deposited = required_total;
        ctx.accounts.bounty.state = BountyState::Funded;

        emit!(BountyFunded {
            bounty: ctx.accounts.bounty.key(),
            sponsor: ctx.accounts.sponsor.key(),
            amount: required_total,
        });
        Ok(())
    }

    pub fn activate_bounty(ctx: Context<ActivateBounty>) -> Result<()> {
        assert_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.bounty.state == BountyState::Funded,
            EscrowError::InvalidState
        );
        require!(
            ctx.accounts.vault.amount >= ctx.accounts.bounty.required_total()?,
            EscrowError::NotFullyFunded
        );
        let now = Clock::get()?.unix_timestamp;
        require!(
            now < ctx.accounts.bounty.submission_deadline,
            EscrowError::SubmissionClosed
        );

        ctx.accounts.bounty.state = BountyState::Active;
        ctx.accounts.bounty.activated_at = now;
        emit!(BountyActivated {
            bounty: ctx.accounts.bounty.key(),
            activated_at: now,
        });
        Ok(())
    }

    pub fn finalize_winner(ctx: Context<FinalizeWinner>, winner: Pubkey) -> Result<()> {
        assert_not_paused(&ctx.accounts.platform_config)?;
        require!(
            ctx.accounts.bounty.state == BountyState::Active,
            EscrowError::InvalidState
        );
        require_keys_neq!(winner, Pubkey::default(), EscrowError::InvalidWinner);

        let now = Clock::get()?.unix_timestamp;
        require!(
            now >= ctx.accounts.bounty.submission_deadline,
            EscrowError::SubmissionStillOpen
        );
        require!(
            now <= ctx.accounts.bounty.judging_deadline,
            EscrowError::JudgingDeadlinePassed
        );

        ctx.accounts.bounty.winner = winner;
        ctx.accounts.bounty.state = BountyState::WinnerSelected;
        emit!(WinnerFinalized {
            bounty: ctx.accounts.bounty.key(),
            winner,
            amount: ctx.accounts.bounty.prize_pool,
        });
        Ok(())
    }

    pub fn settle_bounty(ctx: Context<SettleBounty>) -> Result<()> {
        require!(
            ctx.accounts.bounty.state == BountyState::WinnerSelected,
            EscrowError::InvalidState
        );
        let required_total = ctx.accounts.bounty.required_total()?;
        require!(
            ctx.accounts.vault.amount >= required_total,
            EscrowError::NotFullyFunded
        );

        let bounty_id = ctx.accounts.bounty.bounty_id;
        let bump = ctx.accounts.bounty.bump;
        let prize_pool = ctx.accounts.bounty.prize_pool;
        let platform_fee = ctx.accounts.bounty.platform_fee;
        let excess = ctx
            .accounts
            .vault
            .amount
            .checked_sub(required_total)
            .ok_or(EscrowError::MathOverflow)?;
        let signer_seeds: &[&[u8]] = &[BOUNTY_SEED, bounty_id.as_ref(), &[bump]];
        let signer = &[signer_seeds];

        ctx.accounts.bounty.state = BountyState::Settled;
        ctx.accounts.bounty.settled_at = Clock::get()?.unix_timestamp;

        transfer_from_vault(
            &ctx.accounts.vault,
            &ctx.accounts.mint,
            &ctx.accounts.winner_token_account,
            &ctx.accounts.bounty,
            &ctx.accounts.token_program,
            signer,
            prize_pool,
        )?;
        if platform_fee > 0 {
            transfer_from_vault(
                &ctx.accounts.vault,
                &ctx.accounts.mint,
                &ctx.accounts.treasury_token_account,
                &ctx.accounts.bounty,
                &ctx.accounts.token_program,
                signer,
                platform_fee,
            )?;
        }
        if excess > 0 {
            transfer_from_vault(
                &ctx.accounts.vault,
                &ctx.accounts.mint,
                &ctx.accounts.sponsor_token_account,
                &ctx.accounts.bounty,
                &ctx.accounts.token_program,
                signer,
                excess,
            )?;
        }

        emit!(BountySettled {
            bounty: ctx.accounts.bounty.key(),
            winner: ctx.accounts.winner.key(),
            winner_amount: prize_pool,
            treasury_amount: platform_fee,
        });
        Ok(())
    }

    pub fn cancel_before_activation(ctx: Context<CancelBeforeActivation>) -> Result<()> {
        require!(
            matches!(
                ctx.accounts.bounty.state,
                BountyState::Initialized | BountyState::Funded
            ),
            EscrowError::CannotCancelActiveBounty
        );

        let refund_amount = ctx.accounts.vault.amount;
        let bounty_id = ctx.accounts.bounty.bounty_id;
        let bump = ctx.accounts.bounty.bump;
        let signer_seeds: &[&[u8]] = &[BOUNTY_SEED, bounty_id.as_ref(), &[bump]];
        let signer = &[signer_seeds];

        ctx.accounts.bounty.state = BountyState::Refunded;
        ctx.accounts.bounty.total_deposited = 0;
        ctx.accounts.bounty.settled_at = Clock::get()?.unix_timestamp;

        if refund_amount > 0 {
            transfer_from_vault(
                &ctx.accounts.vault,
                &ctx.accounts.mint,
                &ctx.accounts.sponsor_token_account,
                &ctx.accounts.bounty,
                &ctx.accounts.token_program,
                signer,
                refund_amount,
            )?;
        }

        emit!(BountyRefunded {
            bounty: ctx.accounts.bounty.key(),
            sponsor: ctx.accounts.sponsor.key(),
            amount: refund_amount,
            via_arbitration: false,
        });
        Ok(())
    }

    pub fn request_resolution(ctx: Context<RequestResolution>) -> Result<()> {
        require!(
            ctx.accounts.bounty.state == BountyState::Active,
            EscrowError::InvalidState
        );
        require!(
            Clock::get()?.unix_timestamp > ctx.accounts.bounty.judging_deadline,
            EscrowError::JudgingStillOpen
        );
        ctx.accounts.bounty.state = BountyState::Resolution;
        emit!(ResolutionRequested {
            bounty: ctx.accounts.bounty.key(),
            requester: ctx.accounts.requester.key(),
        });
        Ok(())
    }

    pub fn resolve_winner(ctx: Context<ResolveWinner>, winner: Pubkey) -> Result<()> {
        require!(
            ctx.accounts.bounty.state == BountyState::Resolution,
            EscrowError::InvalidState
        );
        require_keys_neq!(winner, Pubkey::default(), EscrowError::InvalidWinner);
        ctx.accounts.bounty.winner = winner;
        ctx.accounts.bounty.state = BountyState::WinnerSelected;
        emit!(WinnerFinalized {
            bounty: ctx.accounts.bounty.key(),
            winner,
            amount: ctx.accounts.bounty.prize_pool,
        });
        Ok(())
    }

    pub fn resolve_refund(ctx: Context<ResolveRefund>) -> Result<()> {
        require!(
            ctx.accounts.bounty.state == BountyState::Resolution,
            EscrowError::InvalidState
        );
        let refund_amount = ctx.accounts.vault.amount;
        let bounty_id = ctx.accounts.bounty.bounty_id;
        let bump = ctx.accounts.bounty.bump;
        let signer_seeds: &[&[u8]] = &[BOUNTY_SEED, bounty_id.as_ref(), &[bump]];
        let signer = &[signer_seeds];

        ctx.accounts.bounty.state = BountyState::Refunded;
        ctx.accounts.bounty.total_deposited = 0;
        ctx.accounts.bounty.settled_at = Clock::get()?.unix_timestamp;
        transfer_from_vault(
            &ctx.accounts.vault,
            &ctx.accounts.mint,
            &ctx.accounts.sponsor_token_account,
            &ctx.accounts.bounty,
            &ctx.accounts.token_program,
            signer,
            refund_amount,
        )?;

        emit!(BountyRefunded {
            bounty: ctx.accounts.bounty.key(),
            sponsor: ctx.accounts.sponsor.key(),
            amount: refund_amount,
            via_arbitration: true,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [PLATFORM_SEED],
        bump
    )]
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    pub approved_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, address = DEVNET_INITIALIZER @ EscrowError::Unauthorized)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        mut,
        seeds = [PLATFORM_SEED],
        bump = platform_config.bump,
        constraint = platform_config.pause_authority == pause_authority.key() @ EscrowError::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    pub pause_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(bounty_id: [u8; 32])]
pub struct InitializeBounty<'info> {
    #[account(
        seeds = [PLATFORM_SEED],
        bump = platform_config.bump,
        constraint = platform_config.approved_mint == mint.key() @ EscrowError::MintNotApproved
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        init,
        payer = sponsor,
        space = 8 + BountyEscrow::INIT_SPACE,
        seeds = [BOUNTY_SEED, bounty_id.as_ref()],
        bump
    )]
    pub bounty: Box<Account<'info, BountyEscrow>>,
    #[account(
        init,
        payer = sponsor,
        associated_token::mint = mint,
        associated_token::authority = bounty,
        associated_token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub sponsor: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundBounty<'info> {
    #[account(
        seeds = [PLATFORM_SEED],
        bump = platform_config.bump,
        constraint = platform_config.approved_mint == mint.key() @ EscrowError::MintNotApproved
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.bounty_id.as_ref()],
        bump = bounty.bump,
        has_one = sponsor @ EscrowError::Unauthorized,
        has_one = mint @ EscrowError::WrongMint
    )]
    pub bounty: Account<'info, BountyEscrow>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bounty,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sponsor,
        associated_token::token_program = token_program
    )]
    pub sponsor_token_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub sponsor: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct ActivateBounty<'info> {
    #[account(seeds = [PLATFORM_SEED], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.bounty_id.as_ref()],
        bump = bounty.bump,
        has_one = sponsor @ EscrowError::Unauthorized,
        has_one = mint @ EscrowError::WrongMint
    )]
    pub bounty: Account<'info, BountyEscrow>,
    #[account(
        associated_token::mint = mint,
        associated_token::authority = bounty,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub sponsor: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct FinalizeWinner<'info> {
    #[account(seeds = [PLATFORM_SEED], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.bounty_id.as_ref()],
        bump = bounty.bump,
        has_one = judge @ EscrowError::Unauthorized
    )]
    pub bounty: Account<'info, BountyEscrow>,
    pub judge: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleBounty<'info> {
    #[account(
        seeds = [PLATFORM_SEED],
        bump = platform_config.bump,
        constraint = platform_config.approved_mint == mint.key() @ EscrowError::MintNotApproved,
        constraint = platform_config.treasury == treasury.key() @ EscrowError::WrongTreasury
    )]
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.bounty_id.as_ref()],
        bump = bounty.bump,
        has_one = sponsor @ EscrowError::Unauthorized,
        has_one = mint @ EscrowError::WrongMint,
        constraint = bounty.winner == winner.key() @ EscrowError::InvalidWinner
    )]
    pub bounty: Box<Account<'info, BountyEscrow>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bounty,
        associated_token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = winner,
        token::token_program = token_program
    )]
    pub winner_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = treasury,
        token::token_program = token_program
    )]
    pub treasury_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = sponsor,
        token::token_program = token_program
    )]
    pub sponsor_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: constrained to the winner committed in the bounty account.
    pub winner: UncheckedAccount<'info>,
    /// CHECK: constrained to the treasury committed in platform config.
    pub treasury: UncheckedAccount<'info>,
    /// CHECK: constrained to the sponsor committed in the bounty account.
    pub sponsor: UncheckedAccount<'info>,
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct CancelBeforeActivation<'info> {
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.bounty_id.as_ref()],
        bump = bounty.bump,
        has_one = sponsor @ EscrowError::Unauthorized,
        has_one = mint @ EscrowError::WrongMint
    )]
    pub bounty: Account<'info, BountyEscrow>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bounty,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = sponsor,
        associated_token::mint = mint,
        associated_token::authority = sponsor,
        associated_token::token_program = token_program
    )]
    pub sponsor_token_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub sponsor: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RequestResolution<'info> {
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.bounty_id.as_ref()],
        bump = bounty.bump
    )]
    pub bounty: Account<'info, BountyEscrow>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveWinner<'info> {
    #[account(
        seeds = [PLATFORM_SEED],
        bump = platform_config.bump,
        constraint = platform_config.arbitration_authority == arbitration_authority.key() @ EscrowError::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.bounty_id.as_ref()],
        bump = bounty.bump
    )]
    pub bounty: Account<'info, BountyEscrow>,
    pub arbitration_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveRefund<'info> {
    #[account(
        seeds = [PLATFORM_SEED],
        bump = platform_config.bump,
        constraint = platform_config.arbitration_authority == arbitration_authority.key() @ EscrowError::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.bounty_id.as_ref()],
        bump = bounty.bump,
        has_one = sponsor @ EscrowError::Unauthorized,
        has_one = mint @ EscrowError::WrongMint
    )]
    pub bounty: Account<'info, BountyEscrow>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = bounty,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = arbitration_authority,
        associated_token::mint = mint,
        associated_token::authority = sponsor,
        associated_token::token_program = token_program
    )]
    pub sponsor_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: constrained to the sponsor committed in the bounty account.
    pub sponsor: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub arbitration_authority: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub admin: Pubkey,
    pub pause_authority: Pubkey,
    pub arbitration_authority: Pubkey,
    pub treasury: Pubkey,
    pub approved_mint: Pubkey,
    pub max_platform_fee_bps: u16,
    pub max_bounty_amount: u64,
    pub paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BountyEscrow {
    pub bounty_id: [u8; 32],
    pub terms_hash: [u8; 32],
    pub sponsor: Pubkey,
    pub judge: Pubkey,
    pub mint: Pubkey,
    pub prize_pool: u64,
    pub platform_fee: u64,
    pub total_deposited: u64,
    pub submission_deadline: i64,
    pub judging_deadline: i64,
    pub winner: Pubkey,
    pub state: BountyState,
    pub created_at: i64,
    pub activated_at: i64,
    pub settled_at: i64,
    pub bump: u8,
}

impl BountyEscrow {
    pub fn required_total(&self) -> Result<u64> {
        checked_add(self.prize_pool, self.platform_fee)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub enum BountyState {
    Initialized,
    Funded,
    Active,
    WinnerSelected,
    Resolution,
    Settled,
    Refunded,
}

#[event]
pub struct PlatformInitialized {
    pub admin: Pubkey,
    pub approved_mint: Pubkey,
    pub treasury: Pubkey,
}

#[event]
pub struct PauseChanged {
    pub authority: Pubkey,
    pub paused: bool,
}

#[event]
pub struct BountyInitialized {
    pub bounty: Pubkey,
    pub bounty_id: [u8; 32],
    pub sponsor: Pubkey,
    pub mint: Pubkey,
    pub required_total: u64,
}

#[event]
pub struct BountyFunded {
    pub bounty: Pubkey,
    pub sponsor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BountyActivated {
    pub bounty: Pubkey,
    pub activated_at: i64,
}

#[event]
pub struct WinnerFinalized {
    pub bounty: Pubkey,
    pub winner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BountySettled {
    pub bounty: Pubkey,
    pub winner: Pubkey,
    pub winner_amount: u64,
    pub treasury_amount: u64,
}

#[event]
pub struct BountyRefunded {
    pub bounty: Pubkey,
    pub sponsor: Pubkey,
    pub amount: u64,
    pub via_arbitration: bool,
}

#[event]
pub struct ResolutionRequested {
    pub bounty: Pubkey,
    pub requester: Pubkey,
}

#[error_code]
pub enum EscrowError {
    #[msg("The program is paused")]
    ProgramPaused,
    #[msg("The signer is not authorized for this action")]
    Unauthorized,
    #[msg("The authority public key is invalid")]
    InvalidAuthority,
    #[msg("The bounty identifier is invalid")]
    InvalidBountyId,
    #[msg("The bounty terms hash is invalid")]
    InvalidTermsHash,
    #[msg("The token amount must be greater than zero")]
    InvalidAmount,
    #[msg("The configured fee exceeds the platform maximum")]
    FeeTooHigh,
    #[msg("The bounty exceeds the configured Devnet limit")]
    BountyLimitExceeded,
    #[msg("The deadline configuration is invalid")]
    InvalidDeadline,
    #[msg("The token mint is not approved")]
    MintNotApproved,
    #[msg("The token mint does not match the bounty")]
    WrongMint,
    #[msg("The treasury does not match platform config")]
    WrongTreasury,
    #[msg("The bounty is not in the required state")]
    InvalidState,
    #[msg("The vault contains more than the committed amount")]
    VaultOverfunded,
    #[msg("The funded amount does not match the committed amount")]
    FundingMismatch,
    #[msg("The bounty is not fully funded")]
    NotFullyFunded,
    #[msg("The submission deadline has passed")]
    SubmissionClosed,
    #[msg("Submissions are still open")]
    SubmissionStillOpen,
    #[msg("The judging deadline has passed")]
    JudgingDeadlinePassed,
    #[msg("Judging is still open")]
    JudgingStillOpen,
    #[msg("The selected winner is invalid")]
    InvalidWinner,
    #[msg("An active bounty cannot be cancelled by its sponsor")]
    CannotCancelActiveBounty,
    #[msg("Checked arithmetic failed")]
    MathOverflow,
}

fn assert_not_paused(config: &PlatformConfig) -> Result<()> {
    require!(!config.paused, EscrowError::ProgramPaused);
    Ok(())
}

fn checked_add(left: u64, right: u64) -> Result<u64> {
    left.checked_add(right)
        .ok_or(EscrowError::MathOverflow.into())
}

#[allow(clippy::too_many_arguments)]
fn transfer_from_vault<'info>(
    vault: &InterfaceAccount<'info, TokenAccount>,
    mint: &InterfaceAccount<'info, Mint>,
    destination: &InterfaceAccount<'info, TokenAccount>,
    bounty: &Account<'info, BountyEscrow>,
    token_program: &Interface<'info, TokenInterface>,
    signer: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    let cpi_accounts = TransferChecked {
        from: vault.to_account_info(),
        mint: mint.to_account_info(),
        to: destination.to_account_info(),
        authority: bounty.to_account_info(),
    };
    token_interface::transfer_checked(
        CpiContext::new_with_signer(token_program.to_account_info(), cpi_accounts, signer),
        amount,
        mint.decimals,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn checked_total_rejects_overflow() {
        assert!(checked_add(u64::MAX, 1).is_err());
    }

    #[test]
    fn state_values_are_distinct() {
        assert_ne!(BountyState::Active, BountyState::Settled);
        assert_ne!(BountyState::Settled, BountyState::Refunded);
    }
}
