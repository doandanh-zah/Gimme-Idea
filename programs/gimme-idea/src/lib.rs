use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// NOTE: Placeholder program id for compilation in repo.
// Replace with the deployed program id for devnet/mainnet when ready.
declare_id!("11111111111111111111111111111111");

// ==========================================================
// Program: Commit-to-Build Marketplace (Phase 1 / Devnet MVP)
// - No revshare/profit token.
// - Idea support pool (stake signal) + proposals + vote + escrow milestones.
// - Reputation: simple counters updated on key events.
// ==========================================================

#[program]
pub mod gimme_idea {
    use super::*;

    // ---------------------------
    // Admin / Config
    // ---------------------------

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        proposal_fee_lamports: u64,
        vote_duration_seconds: i64,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.accepted_mint = ctx.accounts.accepted_mint.key();
        cfg.proposal_fee_lamports = proposal_fee_lamports;
        cfg.vote_duration_seconds = vote_duration_seconds;
        cfg.committee = vec![ctx.accounts.admin.key()];
        cfg.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn set_committee(ctx: Context<SetCommittee>, committee: Vec<Pubkey>) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        require!(ctx.accounts.admin.key() == cfg.admin, ErrorCode::Unauthorized);
        require!(committee.len() > 0 && committee.len() <= GlobalConfig::MAX_COMMITTEE, ErrorCode::InvalidCommittee);
        cfg.committee = committee;
        Ok(())
    }

    // ---------------------------
    // Idea lifecycle
    // ---------------------------

    pub fn create_idea(ctx: Context<CreateIdea>, idea_id: u64, metadata_uri: String) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require!(metadata_uri.as_bytes().len() <= Idea::MAX_URI, ErrorCode::UriTooLong);

        let idea = &mut ctx.accounts.idea;
        idea.idea_id = idea_id;
        idea.creator = ctx.accounts.creator.key();
        idea.metadata_uri = metadata_uri;
        idea.accepted_mint = cfg.accepted_mint;
        idea.status = IdeaStatus::Open;
        idea.total_staked = 0;
        idea.vote_end_ts = 0;
        idea.winning_proposal = None;
        idea.pool_vault = ctx.accounts.pool_vault.key();
        idea.bump = ctx.bumps.idea;
        Ok(())
    }

    pub fn start_voting(ctx: Context<StartVoting>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let idea = &mut ctx.accounts.idea;

        require!(idea.status == IdeaStatus::Open, ErrorCode::InvalidIdeaStatus);
        require!(is_committee(cfg, &ctx.accounts.authority.key()), ErrorCode::Unauthorized);

        let now = Clock::get()?.unix_timestamp;
        idea.status = IdeaStatus::Voting;
        idea.vote_end_ts = now
            .checked_add(cfg.vote_duration_seconds)
            .ok_or(ErrorCode::MathOverflow)?;
        Ok(())
    }

    // ---------------------------
    // Support / Stake (signal)
    // ---------------------------

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let idea = &mut ctx.accounts.idea;
        require!(idea.status == IdeaStatus::Open, ErrorCode::InvalidIdeaStatus);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer supporter funds into pool vault.
        let cpi_accounts = Transfer {
            from: ctx.accounts.supporter_ata.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.supporter.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update stake position.
        let pos = &mut ctx.accounts.stake_position;
        pos.idea = idea.key();
        pos.supporter = ctx.accounts.supporter.key();
        pos.amount_staked = pos.amount_staked.saturating_add(amount);
        pos.status = StakeStatus::Active;
        pos.bump = ctx.bumps.stake_position;

        // Update totals.
        idea.total_staked = idea.total_staked.saturating_add(amount);

        // Reputation: supporter counters.
        let rep = &mut ctx.accounts.reputation;
        rep.wallet = ctx.accounts.supporter.key();
        rep.support_amount_total = rep.support_amount_total.saturating_add(amount);
        rep.support_count = rep.support_count.saturating_add(1);
        rep.bump = ctx.bumps.reputation;

        Ok(())
    }

    // Optional: refund before building starts. (MVP safe rule)
    pub fn refund_stake(ctx: Context<RefundStake>, amount: u64) -> Result<()> {
        let idea = &mut ctx.accounts.idea;
        require!(idea.status == IdeaStatus::Open || idea.status == IdeaStatus::Voting, ErrorCode::InvalidIdeaStatus);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pos = &mut ctx.accounts.stake_position;
        require!(pos.supporter == ctx.accounts.supporter.key(), ErrorCode::Unauthorized);
        require!(pos.amount_staked >= amount, ErrorCode::InsufficientStake);

        // Transfer back from pool vault to supporter.
        let seeds: &[&[u8]] = &[
            b"idea",
            &idea.idea_id.to_le_bytes(),
            &[idea.bump],
        ];
        let signer = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.supporter_ata.to_account_info(),
            authority: ctx.accounts.idea.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount)?;

        pos.amount_staked = pos.amount_staked.saturating_sub(amount);
        idea.total_staked = idea.total_staked.saturating_sub(amount);
        if pos.amount_staked == 0 {
            pos.status = StakeStatus::Refunded;
        }
        Ok(())
    }

    // ---------------------------
    // Proposals
    // ---------------------------

    pub fn submit_proposal(
        ctx: Context<SubmitProposal>,
        proposal_id: u64,
        requested_total: u64,
        metadata_uri: String,
        milestones: Vec<MilestoneInput>,
    ) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let idea = &ctx.accounts.idea;

        require!(idea.status == IdeaStatus::Open, ErrorCode::InvalidIdeaStatus);
        require!(metadata_uri.as_bytes().len() <= Proposal::MAX_URI, ErrorCode::UriTooLong);
        require!(milestones.len() > 0 && milestones.len() <= Proposal::MAX_MILESTONES, ErrorCode::InvalidMilestones);

        // Proposal fee (anti-spam). Fee paid in SOL to treasury/admin.
        if cfg.proposal_fee_lamports > 0 {
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.builder.key(),
                &cfg.admin,
                cfg.proposal_fee_lamports,
            );
            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.builder.to_account_info(),
                    ctx.accounts.fee_recipient.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        // Validate milestone sum.
        let mut sum: u64 = 0;
        let mut ms_vec: Vec<Milestone> = Vec::with_capacity(milestones.len());
        for m in milestones.into_iter() {
            require!(m.amount > 0, ErrorCode::InvalidAmount);
            sum = sum.checked_add(m.amount).ok_or(ErrorCode::MathOverflow)?;
            ms_vec.push(Milestone {
                amount: m.amount,
                deadline_ts: m.deadline_ts,
                proof_uri: "".to_string(),
                status: MilestoneStatus::Pending,
            });
        }
        require!(sum == requested_total, ErrorCode::MilestoneSumMismatch);

        let p = &mut ctx.accounts.proposal;
        p.proposal_id = proposal_id;
        p.idea = idea.key();
        p.builder = ctx.accounts.builder.key();
        p.metadata_uri = metadata_uri;
        p.requested_total = requested_total;
        p.status = ProposalStatus::Submitted;
        p.vote_count = 0;
        p.milestones = ms_vec;
        p.bump = ctx.bumps.proposal;

        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>) -> Result<()> {
        let idea = &ctx.accounts.idea;
        let proposal = &mut ctx.accounts.proposal;

        require!(idea.status == IdeaStatus::Voting, ErrorCode::InvalidIdeaStatus);
        require!(proposal.idea == idea.key(), ErrorCode::ProposalIdeaMismatch);

        let now = Clock::get()?.unix_timestamp;
        require!(now <= idea.vote_end_ts, ErrorCode::VoteEnded);

        let vr = &mut ctx.accounts.vote_record;
        vr.idea = idea.key();
        vr.voter = ctx.accounts.voter.key();
        vr.proposal = proposal.key();
        vr.bump = ctx.bumps.vote_record;

        // MVP: 1 wallet = 1 vote, no change. Count votes on proposal.
        proposal.vote_count = proposal.vote_count.saturating_add(1);

        Ok(())
    }

    pub fn finalize_winner(ctx: Context<FinalizeWinner>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let idea = &mut ctx.accounts.idea;
        let proposal = &mut ctx.accounts.proposal;

        require!(is_committee(cfg, &ctx.accounts.authority.key()), ErrorCode::Unauthorized);
        require!(idea.status == IdeaStatus::Voting, ErrorCode::InvalidIdeaStatus);
        require!(proposal.idea == idea.key(), ErrorCode::ProposalIdeaMismatch);

        let now = Clock::get()?.unix_timestamp;
        require!(now > idea.vote_end_ts, ErrorCode::VoteNotEnded);

        // Move to Building.
        idea.status = IdeaStatus::Building;
        idea.winning_proposal = Some(proposal.key());

        proposal.status = ProposalStatus::Accepted;

        // Init escrow.
        let escrow = &mut ctx.accounts.escrow;
        escrow.idea = idea.key();
        escrow.proposal = proposal.key();
        escrow.builder = proposal.builder;
        escrow.escrow_vault = ctx.accounts.escrow_vault.key();
        escrow.released_amount = 0;
        escrow.status = EscrowStatus::Active;
        escrow.bump = ctx.bumps.escrow;

        // Transfer requested_total from pool_vault to escrow_vault.
        // Idea PDA signs for pool_vault authority.
        let seeds: &[&[u8]] = &[
            b"idea",
            &idea.idea_id.to_le_bytes(),
            &[idea.bump],
        ];
        let signer = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.idea.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, proposal.requested_total)?;

        // Reputation: builder won.
        let builder_rep = &mut ctx.accounts.builder_reputation;
        builder_rep.wallet = proposal.builder;
        builder_rep.proposals_won = builder_rep.proposals_won.saturating_add(1);
        builder_rep.bump = ctx.bumps.builder_reputation;

        Ok(())
    }

    // ---------------------------
    // Milestones
    // ---------------------------

    pub fn submit_milestone_proof(
        ctx: Context<SubmitMilestoneProof>,
        milestone_index: u8,
        proof_uri: String,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(ctx.accounts.builder.key() == proposal.builder, ErrorCode::Unauthorized);
        require!(proposal.status == ProposalStatus::Accepted, ErrorCode::InvalidProposalStatus);
        require!(proof_uri.as_bytes().len() <= Milestone::MAX_URI, ErrorCode::UriTooLong);

        let idx = milestone_index as usize;
        require!(idx < proposal.milestones.len(), ErrorCode::InvalidMilestoneIndex);
        let ms = &mut proposal.milestones[idx];
        require!(ms.status == MilestoneStatus::Pending, ErrorCode::InvalidMilestoneStatus);

        ms.proof_uri = proof_uri;
        ms.status = MilestoneStatus::SubmittedProof;
        Ok(())
    }

    pub fn approve_and_release(ctx: Context<ApproveAndRelease>, milestone_index: u8) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require!(is_committee(cfg, &ctx.accounts.authority.key()), ErrorCode::Unauthorized);

        let proposal = &mut ctx.accounts.proposal;
        let escrow = &mut ctx.accounts.escrow;

        require!(proposal.status == ProposalStatus::Accepted, ErrorCode::InvalidProposalStatus);
        require!(escrow.status == EscrowStatus::Active, ErrorCode::InvalidEscrowStatus);
        require!(escrow.proposal == proposal.key(), ErrorCode::EscrowProposalMismatch);

        let idx = milestone_index as usize;
        require!(idx < proposal.milestones.len(), ErrorCode::InvalidMilestoneIndex);
        let ms = &mut proposal.milestones[idx];
        require!(ms.status == MilestoneStatus::SubmittedProof, ErrorCode::InvalidMilestoneStatus);

        // Escrow PDA signs transfers from escrow vault.
        let seeds: &[&[u8]] = &[
            b"escrow",
            escrow.idea.as_ref(),
            escrow.proposal.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.builder_ata.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, ms.amount)?;

        ms.status = MilestoneStatus::Approved;
        escrow.released_amount = escrow.released_amount.saturating_add(ms.amount);

        // Builder reputation.
        let rep = &mut ctx.accounts.builder_reputation;
        rep.wallet = proposal.builder;
        rep.milestones_completed = rep.milestones_completed.saturating_add(1);
        rep.bump = ctx.bumps.builder_reputation;

        // If all milestones approved -> complete.
        if proposal.milestones.iter().all(|m| m.status == MilestoneStatus::Approved) {
            proposal.status = ProposalStatus::Completed;
            escrow.status = EscrowStatus::Finished;
        }

        Ok(())
    }
}

// ==========================================================
// Accounts
// ==========================================================

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + GlobalConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub accepted_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetCommittee<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(idea_id: u64, metadata_uri: String)]
pub struct CreateIdea<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(
        init,
        payer = creator,
        space = 8 + Idea::INIT_SPACE,
        seeds = [b"idea", &idea_id.to_le_bytes()],
        bump
    )]
    pub idea: Account<'info, Idea>,

    #[account(
        init,
        payer = creator,
        token::mint = accepted_mint,
        token::authority = idea,
        seeds = [b"pool_vault", idea.key().as_ref()],
        bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    pub accepted_mint: Account<'info, Mint>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct StartVoting<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(mut, seeds = [b"idea", &idea.idea_id.to_le_bytes()], bump = idea.bump)]
    pub idea: Account<'info, Idea>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, seeds = [b"idea", &idea.idea_id.to_le_bytes()], bump = idea.bump)]
    pub idea: Account<'info, Idea>,

    #[account(mut, seeds = [b"pool_vault", idea.key().as_ref()], bump)]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = supporter,
        space = 8 + StakePosition::INIT_SPACE,
        seeds = [b"stake", idea.key().as_ref(), supporter.key().as_ref()],
        bump
    )]
    pub stake_position: Account<'info, StakePosition>,

    #[account(
        init_if_needed,
        payer = supporter,
        space = 8 + ReputationProfile::INIT_SPACE,
        seeds = [b"rep", supporter.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, ReputationProfile>,

    #[account(mut)]
    pub supporter: Signer<'info>,

    #[account(mut, constraint = supporter_ata.mint == idea.accepted_mint)]
    pub supporter_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RefundStake<'info> {
    #[account(mut, seeds = [b"idea", &idea.idea_id.to_le_bytes()], bump = idea.bump)]
    pub idea: Account<'info, Idea>,

    #[account(mut, seeds = [b"pool_vault", idea.key().as_ref()], bump)]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"stake", idea.key().as_ref(), supporter.key().as_ref()], bump = stake_position.bump)]
    pub stake_position: Account<'info, StakePosition>,

    #[account(mut)]
    pub supporter: Signer<'info>,

    #[account(mut, constraint = supporter_ata.mint == idea.accepted_mint)]
    pub supporter_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct SubmitProposal<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(seeds = [b"idea", &idea.idea_id.to_le_bytes()], bump = idea.bump)]
    pub idea: Account<'info, Idea>,

    #[account(
        init,
        payer = builder,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", idea.key().as_ref(), &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    /// Fee recipient (must equal config.admin)
    /// CHECK: address constraint enforced below
    #[account(constraint = fee_recipient.key() == config.admin)]
    pub fee_recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub builder: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut, seeds = [b"idea", &idea.idea_id.to_le_bytes()], bump = idea.bump)]
    pub idea: Account<'info, Idea>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", idea.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeWinner<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(mut, seeds = [b"idea", &idea.idea_id.to_le_bytes()], bump = idea.bump)]
    pub idea: Account<'info, Idea>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(mut, seeds = [b"pool_vault", idea.key().as_ref()], bump)]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + EscrowState::INIT_SPACE,
        seeds = [b"escrow", idea.key().as_ref(), proposal.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowState>,

    #[account(
        init,
        payer = authority,
        token::mint = accepted_mint,
        token::authority = escrow,
        seeds = [b"escrow_vault", escrow.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub accepted_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + ReputationProfile::INIT_SPACE,
        seeds = [b"rep", proposal.builder.as_ref()],
        bump
    )]
    pub builder_reputation: Account<'info, ReputationProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SubmitMilestoneProof<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    pub builder: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveAndRelease<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub escrow: Account<'info, EscrowState>,

    #[account(mut, constraint = escrow_vault.key() == escrow.escrow_vault)]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut, constraint = builder_ata.owner == proposal.builder)]
    pub builder_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + ReputationProfile::INIT_SPACE,
        seeds = [b"rep", proposal.builder.as_ref()],
        bump
    )]
    pub builder_reputation: Account<'info, ReputationProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// ==========================================================
// State
// ==========================================================

#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub accepted_mint: Pubkey,
    pub proposal_fee_lamports: u64,
    pub vote_duration_seconds: i64,
    #[max_len(5)]
    pub committee: Vec<Pubkey>,
    pub bump: u8,
}

impl GlobalConfig {
    pub const MAX_COMMITTEE: usize = 5;
}

#[account]
#[derive(InitSpace)]
pub struct Idea {
    pub idea_id: u64,
    pub creator: Pubkey,
    #[max_len(200)]
    pub metadata_uri: String,
    pub accepted_mint: Pubkey,
    pub status: IdeaStatus,
    pub total_staked: u64,
    pub vote_end_ts: i64,
    pub winning_proposal: Option<Pubkey>,
    pub pool_vault: Pubkey,
    pub bump: u8,
}

impl Idea {
    pub const MAX_URI: usize = 200;
}

#[account]
#[derive(InitSpace)]
pub struct StakePosition {
    pub idea: Pubkey,
    pub supporter: Pubkey,
    pub amount_staked: u64,
    pub status: StakeStatus,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub proposal_id: u64,
    pub idea: Pubkey,
    pub builder: Pubkey,
    #[max_len(200)]
    pub metadata_uri: String,
    pub requested_total: u64,
    pub status: ProposalStatus,
    pub vote_count: u64,
    #[max_len(3)]
    pub milestones: Vec<Milestone>,
    pub bump: u8,
}

impl Proposal {
    pub const MAX_URI: usize = 200;
    pub const MAX_MILESTONES: usize = 3;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Milestone {
    pub amount: u64,
    pub deadline_ts: i64,
    #[max_len(200)]
    pub proof_uri: String,
    pub status: MilestoneStatus,
}

impl Milestone {
    pub const MAX_URI: usize = 200;
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub idea: Pubkey,
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct EscrowState {
    pub idea: Pubkey,
    pub proposal: Pubkey,
    pub builder: Pubkey,
    pub escrow_vault: Pubkey,
    pub released_amount: u64,
    pub status: EscrowStatus,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ReputationProfile {
    pub wallet: Pubkey,
    pub proposals_won: u64,
    pub milestones_completed: u64,
    pub support_count: u64,
    pub support_amount_total: u64,
    pub bump: u8,
}

// ==========================================================
// Enums / Inputs
// ==========================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum IdeaStatus {
    Open,
    Voting,
    Building,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum StakeStatus {
    Active,
    Refunded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum ProposalStatus {
    Submitted,
    Accepted,
    Rejected,
    Cancelled,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MilestoneStatus {
    Pending,
    SubmittedProof,
    Approved,
    Failed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Active,
    Paused,
    Finished,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MilestoneInput {
    pub amount: u64,
    pub deadline_ts: i64,
}

// ==========================================================
// Helpers
// ==========================================================

fn is_committee(cfg: &Account<GlobalConfig>, k: &Pubkey) -> bool {
    if *k == cfg.admin {
        return true;
    }
    cfg.committee.iter().any(|x| x == k)
}

// ==========================================================
// Errors
// ==========================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Invalid idea status for this action")]
    InvalidIdeaStatus,

    #[msg("Invalid proposal status for this action")]
    InvalidProposalStatus,

    #[msg("Invalid escrow status for this action")]
    InvalidEscrowStatus,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("URI too long")]
    UriTooLong,

    #[msg("Invalid committee")]
    InvalidCommittee,

    #[msg("Invalid milestones")]
    InvalidMilestones,

    #[msg("Milestone amounts must sum to requested_total")]
    MilestoneSumMismatch,

    #[msg("Proposal does not belong to idea")]
    ProposalIdeaMismatch,

    #[msg("Vote ended")]
    VoteEnded,

    #[msg("Vote not ended")]
    VoteNotEnded,

    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,

    #[msg("Invalid milestone status")]
    InvalidMilestoneStatus,

    #[msg("Escrow does not match proposal")]
    EscrowProposalMismatch,

    #[msg("Insufficient staked amount")]
    InsufficientStake,
}
