import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import { ApiResponse } from "../shared/types";

// Gimme Sensei wallet for verification
const ADMIN_BOT_WALLET = "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm";

export interface Hackathon {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  coverImage?: string;
  mode?: "online" | "offline" | "hybrid";
  maxParticipants?: number;
  currency?: string;
  startDate: string;
  endDate: string;
  registrationStart?: string;
  registrationEnd?: string;
  prizePool?: string;
  status: "upcoming" | "active" | "voting" | "completed";
  imageUrl?: string;
  tags: string[];
  participantsCount: number;
  judgingCriteria?: any;
  createdAt: string;
  createdBy?: string;
}

export interface HackathonSubmission {
  id: string;
  hackathonId: string;
  projectId: string;
  userId: string;
  score?: number;
  scoreBreakdown?: {
    innovation: number;
    execution: number;
    impact: number;
    presentation: number;
  };
  scoredBy?: string;
  scoredAt?: string;
  adminNotes?: string;
  status: "pending" | "approved" | "rejected" | "winner" | "finalist";
  submittedAt: string;
  project?: any;
  user?: any;
}

export interface CreateHackathonDto {
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  coverImage?: string;
  mode?: "online" | "offline" | "hybrid";
  maxParticipants?: number;
  // Legacy fields (still supported)
  startDate?: string;
  endDate?: string;
  prizePool?: string;
  imageUrl?: string;
  tags?: string[];
  // New V2 fields
  prizeCount?: number;
  currency?: string;
  prizes?: { rank: number; amount: string; title: string }[];
  round1?: {
    startDate: string;
    endDate: string;
    resultsDate?: string;
    mode: string;
  };
  round2?: {
    startDate: string;
    endDate: string;
    resultsDate?: string;
    mode: string;
    teamsAdvancing: number;
    submissions?: {
      pitchDeck: { required: boolean; link: string };
      pitchingVideo: { required: boolean; link: string };
      technicalDemo: { required: boolean; link: string };
      mvp: { required: boolean; link: string };
    };
  };
  round3?: {
    startDate: string;
    endDate: string;
    resultsDate?: string;
    mode: string;
    teamsAdvancing: number;
    submissions?: {
      pitchDeck: { required: boolean; link: string };
      pitchingVideo: { required: boolean; link: string };
      technicalDemo: { required: boolean; link: string };
      mvp: { required: boolean; link: string };
    };
  };
  ideaPrizeCount?: number;
  ideaPrizes?: { rank: number; amount: string; title: string }[];
  ideasAdvancing?: number;
  judgingCriteria?: {
    communityWeight: number;
    judgeWeight: number;
    judgeCategories: { name: string; weight: number }[];
  };
  schedule?: { title: string; date: string; link: string; type: string }[];
  partnerHackathons?: { name: string; link: string }[];
  registrationStart?: string;
  registrationEnd?: string;
}

export interface ScoreSubmissionDto {
  score: number; // 0-100
  scoreBreakdown?: {
    innovation: number;
    execution: number;
    impact: number;
    presentation: number;
  };
  adminNotes?: string;
  status?: "approved" | "rejected" | "winner" | "finalist";
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("role, wallet")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return false;
    }

    // Admin by role or by being Gimme Sensei
    return user.role === "admin" || user.wallet === ADMIN_BOT_WALLET;
  }

  /**
   * Get user's admin role
   */
  async getUserRole(
    userId: string
  ): Promise<{ role: string; isAdmin: boolean }> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("role, wallet")
      .eq("id", userId)
      .single();

    if (!user) {
      return { role: "user", isAdmin: false };
    }

    const isAdmin = user.role === "admin" || user.wallet === ADMIN_BOT_WALLET;

    return {
      role: user.role || "user",
      isAdmin,
    };
  }

  /**
   * Admin delete any project
   */
  async adminDeleteProject(
    adminId: string,
    projectId: string
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    // Get project info for logging
    const { data: project } = await supabase
      .from("projects")
      .select("title, author_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Delete project
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    // Log admin action
    await this.logAdminAction(adminId, "delete_project", "project", projectId, {
      projectTitle: project.title,
      originalAuthor: project.author_id,
    });

    this.logger.log(`Admin ${adminId} deleted project ${projectId}`);

    return {
      success: true,
      message: "Project deleted by admin",
    };
  }

  /**
   * Admin verify/unverify a project
   */
  async verifyProject(
    adminId: string,
    projectId: string,
    verified: boolean
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("projects")
      .update({
        is_verified: verified,
        verified_by: verified ? adminId : null,
        verified_at: verified ? new Date().toISOString() : null,
      })
      .eq("id", projectId);

    if (error) {
      throw new Error(`Failed to verify project: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      verified ? "verify_project" : "unverify_project",
      "project",
      projectId,
      {}
    );

    return {
      success: true,
      message: verified ? "Project verified" : "Project unverified",
    };
  }

  /**
   * Commit-to-Build (Phase 1): update funding pool/governance metadata for a project
   */
  async updateProjectFundingPool(
    adminId: string,
    projectId: string,
    updates: {
      poolStatus?:
        | "draft"
        | "reviewing"
        | "approved_for_pool"
        | "pool_open"
        | "rejected"
        | string;
      governanceRealmAddress?: string | null;
      governanceTreasuryAddress?: string | null;
      governanceReceiptMint?: string | null;
      supportFeeBps?: number | null;
      supportFeeCapUsdc?: number | null;
      supportFeeRecipient?: string | null;
    }
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select(
        "id, type, pool_status, pool_created_at, support_fee_bps, support_fee_cap_usdc, support_fee_recipient"
      )
      .eq("id", projectId)
      .single();

    if (projectErr || !project) {
      throw new NotFoundException("Project not found");
    }

    const nextStatus = updates.poolStatus ?? project.pool_status;

    const patch: any = {
      ...(updates.poolStatus !== undefined ? { pool_status: updates.poolStatus } : {}),
      ...(updates.governanceRealmAddress !== undefined
        ? { governance_realm_address: updates.governanceRealmAddress }
        : {}),
      ...(updates.governanceTreasuryAddress !== undefined
        ? { governance_treasury_address: updates.governanceTreasuryAddress }
        : {}),
      ...(updates.governanceReceiptMint !== undefined
        ? { governance_receipt_mint: updates.governanceReceiptMint }
        : {}),
      ...(updates.supportFeeBps !== undefined
        ? { support_fee_bps: updates.supportFeeBps }
        : {}),
      ...(updates.supportFeeCapUsdc !== undefined
        ? { support_fee_cap_usdc: updates.supportFeeCapUsdc }
        : {}),
      ...(updates.supportFeeRecipient !== undefined
        ? { support_fee_recipient: updates.supportFeeRecipient }
        : {}),
    };

    // Default fee config: 0.5% support fee to dev wallet, no cap.
    const defaultFeeBps = 50;
    const defaultFeeCapUsdc = 0;
    const defaultFeeRecipient = ADMIN_BOT_WALLET;

    const willOpenPool = nextStatus === "pool_open";

    if (willOpenPool) {
      if (patch.support_fee_bps === undefined && project.support_fee_bps == null) {
        patch.support_fee_bps = defaultFeeBps;
      }
      if (
        patch.support_fee_cap_usdc === undefined &&
        project.support_fee_cap_usdc == null
      ) {
        patch.support_fee_cap_usdc = defaultFeeCapUsdc;
      }
      if (
        patch.support_fee_recipient === undefined &&
        project.support_fee_recipient == null
      ) {
        patch.support_fee_recipient = defaultFeeRecipient;
      }

      // Mark pool created metadata once when pool first opens
      if (!project.pool_created_at) {
        patch.pool_created_at = new Date().toISOString();
        patch.pool_created_by = adminId;
      }
    }

    const { error } = await supabase.from("projects").update(patch).eq("id", projectId);

    if (error) {
      throw new Error(`Failed to update funding pool: ${error.message}`);
    }

    await this.logAdminAction(adminId, "update_funding_pool", "project", projectId, {
      updates,
    });

    return { success: true, message: "Funding pool updated" };
  }

  async listDaoRequests(
    adminId: string,
    status?: "pending" | "approved" | "rejected"
  ): Promise<ApiResponse<any[]>> {
    if (!(await this.isAdmin(adminId))) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();
    let q = supabase
      .from("dao_requests")
      .select(
        `id, project_id, requester_id, tx_signature, from_wallet, to_wallet, amount_sol, amount_usd, required_usd, status, note, reviewed_by, reviewed_at, created_at,
         project:projects!dao_requests_project_id_fkey(id, title),
         requester:users!dao_requests_requester_id_fkey(id, username, wallet)`
      )
      .order("created_at", { ascending: false });

    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) {
      throw new Error(`Failed to list DAO requests: ${error.message}`);
    }

    return { success: true, data: data || [] };
  }

  async reviewDaoRequest(
    adminId: string,
    requestId: string,
    body: { status: "approved" | "rejected"; note?: string }
  ): Promise<ApiResponse<any>> {
    if (!(await this.isAdmin(adminId))) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: reqRow, error: fetchErr } = await supabase
      .from("dao_requests")
      .select("id, project_id, status")
      .eq("id", requestId)
      .single();

    if (fetchErr || !reqRow) {
      throw new NotFoundException("DAO request not found");
    }

    if (reqRow.status !== "pending") {
      throw new BadRequestException("Request already reviewed");
    }

    const patch: any = {
      status: body.status,
      note: body.note ?? null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from("dao_requests")
      .update(patch)
      .eq("id", requestId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to review DAO request: ${error.message}`);
    }

    if (body.status === "approved") {
      await supabase
        .from("projects")
        .update({ pool_status: "approved_for_pool" })
        .eq("id", reqRow.project_id);
    }

    await this.logAdminAction(adminId, "review_dao_request", "dao_request", requestId, {
      status: body.status,
    });

    return {
      success: true,
      data: updated,
      message: `DAO request ${body.status}`,
    };
  }

  async listProposals(
    adminId: string,
    status?: "pending" | "voting" | "passed" | "rejected" | "executed"
  ): Promise<ApiResponse<any[]>> {
    if (!(await this.isAdmin(adminId))) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();
    let q = supabase
      .from("proposals")
      .select(
        `id, project_id, proposer_id, title, description, status, onchain_tx, created_at, updated_at,
         project:projects!proposals_project_id_fkey(id, title),
         proposer:users!proposals_proposer_id_fkey(id, username, wallet)`
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) throw new Error(`Failed to list proposals: ${error.message}`);

    return { success: true, data: data || [] };
  }

  async reviewProposal(
    adminId: string,
    proposalId: string,
    body: {
      status: "pending" | "voting" | "passed" | "rejected" | "executed";
      onchainTx?: string;
    }
  ): Promise<ApiResponse<any>> {
    if (!(await this.isAdmin(adminId))) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();
    const patch: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };
    if (body.onchainTx !== undefined) patch.onchain_tx = body.onchainTx || null;

    const { data, error } = await supabase
      .from("proposals")
      .update(patch)
      .eq("id", proposalId)
      .select("*")
      .single();

    if (error || !data) {
      throw new NotFoundException("Proposal not found or update failed");
    }

    await this.logAdminAction(adminId, "review_proposal", "proposal", proposalId, {
      status: body.status,
      onchainTx: body.onchainTx,
    });

    return { success: true, data, message: `Proposal marked ${body.status}` };
  }

  // ============================================
  // HACKATHON MANAGEMENT
  // ============================================

  /**
   * Create a new hackathon (admin only)
   */
  async createHackathon(
    adminId: string,
    dto: CreateHackathonDto
  ): Promise<ApiResponse<Hackathon>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    // Build hackathon insert data - only include columns that exist in the database
    // Based on current schema: id, slug, title, tagline, description, status, prize_pool,
    // max_participants, registration_start, registration_end, submission_start, submission_end,
    // judging_start, judging_end, is_featured, created_by, created_at, updated_at,
    // cover_image, mode, currency, judging_criteria, current_round, format, total_rounds
    const insertData: any = {
      slug: dto.slug,
      title: dto.title,
      status: "upcoming",
      created_by: adminId,
    };

    // Add optional fields only if they have values (only existing columns!)
    if (dto.tagline) insertData.tagline = dto.tagline;
    if (dto.description) insertData.description = dto.description;
    if (dto.coverImage) insertData.cover_image = dto.coverImage;
    if (dto.mode) insertData.mode = dto.mode;
    if (dto.maxParticipants) insertData.max_participants = dto.maxParticipants;
    if (dto.currency) insertData.currency = dto.currency;
    if (dto.prizePool) insertData.prize_pool = dto.prizePool;

    // Registration dates (these columns should exist)
    if (dto.registrationStart)
      insertData.registration_start = dto.registrationStart;
    if (dto.registrationEnd) insertData.registration_end = dto.registrationEnd;

    // Use round dates for submission/judging if available
    if (dto.round1?.startDate)
      insertData.submission_start = dto.round1.startDate;
    if (dto.round1?.endDate) insertData.submission_end = dto.round1.endDate;
    if (dto.round3?.startDate) insertData.judging_start = dto.round3.startDate;
    if (dto.round3?.endDate) insertData.judging_end = dto.round3.endDate;

    // Add judging criteria if provided
    if (dto.judgingCriteria) {
      insertData.judging_criteria = dto.judgingCriteria.judgeCategories;
    }

    this.logger.log(
      `Creating hackathon with data: ${JSON.stringify(insertData)}`
    );

    const { data: hackathon, error } = await supabase
      .from("hackathons")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create hackathon: ${error.message}`, error);
      throw new Error(`Failed to create hackathon: ${error.message}`);
    }

    // Create rounds if provided
    if (dto.round1 || dto.round2 || dto.round3) {
      const roundsToInsert = [];

      if (dto.round1) {
        roundsToInsert.push({
          hackathon_id: hackathon.id,
          round_number: 1,
          title: "Round 1: Idea Phase",
          description: "Submit your innovative ideas and get feedback",
          round_type: "idea",
          mode: dto.round1.mode || "online",
          start_date: dto.round1.startDate,
          end_date: dto.round1.endDate,
          results_date: dto.round1.resultsDate,
          teams_advancing: dto.ideasAdvancing || 50,
          status: "upcoming",
        });
      }

      if (dto.round2) {
        roundsToInsert.push({
          hackathon_id: hackathon.id,
          round_number: 2,
          title: "Round 2: Pitching",
          description: "Pitch your solution to judges",
          round_type: "pitching",
          mode: dto.round2.mode || "online",
          start_date: dto.round2.startDate,
          end_date: dto.round2.endDate,
          results_date: dto.round2.resultsDate,
          teams_advancing: dto.round2.teamsAdvancing || 20,
          status: "upcoming",
        });
      }

      if (dto.round3) {
        roundsToInsert.push({
          hackathon_id: hackathon.id,
          round_number: 3,
          title: "Round 3: Final Demo",
          description: "Demonstrate your MVP",
          round_type: "final",
          mode: dto.round3.mode || "offline",
          start_date: dto.round3.startDate,
          end_date: dto.round3.endDate,
          results_date: dto.round3.resultsDate,
          teams_advancing: dto.round3.teamsAdvancing || 5,
          status: "upcoming",
        });
      }

      if (roundsToInsert.length > 0) {
        const { error: roundsError } = await supabase
          .from("hackathon_rounds")
          .insert(roundsToInsert);

        if (roundsError) {
          this.logger.warn(`Failed to create rounds: ${roundsError.message}`);
        }
      }
    }

    // Create prizes if provided
    if (dto.prizes && dto.prizes.length > 0) {
      const prizesToInsert = dto.prizes.map((p) => ({
        hackathon_id: hackathon.id,
        round_number: 3, // Final round prizes
        rank: p.rank,
        title: p.title,
        prize_amount: p.amount,
      }));

      const { error: prizesError } = await supabase
        .from("hackathon_prizes")
        .insert(prizesToInsert);

      if (prizesError) {
        this.logger.warn(`Failed to create prizes: ${prizesError.message}`);
      }
    }

    // Create idea phase prizes if provided
    if (dto.ideaPrizes && dto.ideaPrizes.length > 0) {
      const ideaPrizesToInsert = dto.ideaPrizes.map((p) => ({
        hackathon_id: hackathon.id,
        round_number: 1, // Round 1 prizes
        rank: p.rank,
        title: p.title,
        prize_amount: p.amount,
      }));

      const { error: ideaPrizesError } = await supabase
        .from("hackathon_prizes")
        .insert(ideaPrizesToInsert);

      if (ideaPrizesError) {
        this.logger.warn(
          `Failed to create idea prizes: ${ideaPrizesError.message}`
        );
      }
    }

    // Create schedule events if provided
    if (dto.schedule && dto.schedule.length > 0) {
      const scheduleToInsert = dto.schedule.map((s) => ({
        hackathon_id: hackathon.id,
        title: s.title,
        event_date: s.date,
        link: s.link,
        event_type: s.type || "other",
      }));

      const { error: scheduleError } = await supabase
        .from("hackathon_schedule")
        .insert(scheduleToInsert);

      if (scheduleError) {
        this.logger.warn(`Failed to create schedule: ${scheduleError.message}`);
      }
    }

    // Create partner hackathons if provided
    if (dto.partnerHackathons && dto.partnerHackathons.length > 0) {
      const partnersToInsert = dto.partnerHackathons.map((p) => ({
        hackathon_id: hackathon.id,
        partner_name: p.name,
        partner_link: p.link,
      }));

      const { error: partnersError } = await supabase
        .from("hackathon_partners")
        .insert(partnersToInsert);

      if (partnersError) {
        this.logger.warn(`Failed to create partners: ${partnersError.message}`);
      }
    }

    await this.logAdminAction(
      adminId,
      "create_hackathon",
      "hackathon",
      hackathon.id,
      { title: dto.title }
    );

    return {
      success: true,
      data: this.mapHackathon(hackathon),
      message: "Hackathon created successfully",
    };
  }

  /**
   * Update hackathon
   */
  async updateHackathon(
    adminId: string,
    hackathonId: string,
    updates: Partial<CreateHackathonDto> & { status?: string }
  ): Promise<ApiResponse<Hackathon>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.tagline) updateData.tagline = updates.tagline;
    if (updates.description) updateData.description = updates.description;
    if (updates.coverImage) updateData.cover_image = updates.coverImage;
    if (updates.mode) updateData.mode = updates.mode;
    if (updates.maxParticipants)
      updateData.max_participants = updates.maxParticipants;
    if (updates.currency) updateData.currency = updates.currency;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate) updateData.end_date = updates.endDate;
    if (updates.registrationStart)
      updateData.registration_start = updates.registrationStart;
    if (updates.registrationEnd)
      updateData.registration_end = updates.registrationEnd;
    if (updates.prizePool) updateData.prize_pool = updates.prizePool;
    if (updates.imageUrl) updateData.image_url = updates.imageUrl;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.status) updateData.status = updates.status;
    if (updates.judgingCriteria) {
      updateData.judging_criteria = updates.judgingCriteria.judgeCategories;
    }

    // Update dates from rounds if provided
    if (updates.round1?.startDate) {
      updateData.start_date = updates.round1.startDate;
      if (!updates.registrationEnd) {
        updateData.registration_end = updates.round1.startDate;
      }
    }
    if (updates.round3?.endDate) {
      updateData.end_date = updates.round3.endDate;
    }

    const { data: hackathon, error } = await supabase
      .from("hackathons")
      .update(updateData)
      .eq("id", hackathonId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update hackathon: ${error.message}`);
    }

    // Update rounds if provided
    if (updates.round1 || updates.round2 || updates.round3) {
      // Delete existing rounds and recreate
      await supabase
        .from("hackathon_rounds")
        .delete()
        .eq("hackathon_id", hackathonId);

      const roundsToInsert = [];

      if (updates.round1) {
        roundsToInsert.push({
          hackathon_id: hackathonId,
          round_number: 1,
          title: "Round 1: Idea Phase",
          description: "Submit your innovative ideas and get feedback",
          round_type: "idea",
          mode: updates.round1.mode || "online",
          start_date: updates.round1.startDate,
          end_date: updates.round1.endDate,
          results_date: updates.round1.resultsDate,
          teams_advancing: updates.ideasAdvancing || 50,
          status: "upcoming",
        });
      }

      if (updates.round2) {
        roundsToInsert.push({
          hackathon_id: hackathonId,
          round_number: 2,
          title: "Round 2: Pitching",
          description: "Pitch your solution to judges",
          round_type: "pitching",
          mode: updates.round2.mode || "online",
          start_date: updates.round2.startDate,
          end_date: updates.round2.endDate,
          results_date: updates.round2.resultsDate,
          teams_advancing: updates.round2.teamsAdvancing || 20,
          status: "upcoming",
        });
      }

      if (updates.round3) {
        roundsToInsert.push({
          hackathon_id: hackathonId,
          round_number: 3,
          title: "Round 3: Final Demo",
          description: "Demonstrate your MVP",
          round_type: "final",
          mode: updates.round3.mode || "offline",
          start_date: updates.round3.startDate,
          end_date: updates.round3.endDate,
          results_date: updates.round3.resultsDate,
          teams_advancing: updates.round3.teamsAdvancing || 5,
          status: "upcoming",
        });
      }

      if (roundsToInsert.length > 0) {
        await supabase.from("hackathon_rounds").insert(roundsToInsert);
      }
    }

    // Update prizes if provided
    if (updates.prizes && updates.prizes.length > 0) {
      await supabase
        .from("hackathon_prizes")
        .delete()
        .eq("hackathon_id", hackathonId)
        .eq("round_number", 3);

      const prizesToInsert = updates.prizes.map((p) => ({
        hackathon_id: hackathonId,
        round_number: 3,
        rank: p.rank,
        title: p.title,
        prize_amount: p.amount,
      }));

      await supabase.from("hackathon_prizes").insert(prizesToInsert);
    }

    // Update idea prizes if provided
    if (updates.ideaPrizes && updates.ideaPrizes.length > 0) {
      await supabase
        .from("hackathon_prizes")
        .delete()
        .eq("hackathon_id", hackathonId)
        .eq("round_number", 1);

      const ideaPrizesToInsert = updates.ideaPrizes.map((p) => ({
        hackathon_id: hackathonId,
        round_number: 1,
        rank: p.rank,
        title: p.title,
        prize_amount: p.amount,
      }));

      await supabase.from("hackathon_prizes").insert(ideaPrizesToInsert);
    }

    await this.logAdminAction(
      adminId,
      "update_hackathon",
      "hackathon",
      hackathonId,
      { updates }
    );

    return {
      success: true,
      data: this.mapHackathon(hackathon),
      message: "Hackathon updated successfully",
    };
  }

  /**
   * Delete hackathon
   */
  async deleteHackathon(
    adminId: string,
    hackathonId: string
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    // Get hackathon info for logging
    const { data: hackathon } = await supabase
      .from("hackathons")
      .select("title")
      .eq("id", hackathonId)
      .single();

    const { error } = await supabase
      .from("hackathons")
      .delete()
      .eq("id", hackathonId);

    if (error) {
      throw new Error(`Failed to delete hackathon: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      "delete_hackathon",
      "hackathon",
      hackathonId,
      { title: hackathon?.title }
    );

    return {
      success: true,
      message: "Hackathon deleted successfully",
    };
  }

  /**
   * Get all hackathons (with more details for admin)
   */
  async getAllHackathons(adminId: string): Promise<ApiResponse<Hackathon[]>> {
    // Verify admin access
    const isAdminUser = await this.isAdmin(adminId);
    if (!isAdminUser) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: hackathons, error } = await supabase
      .from("hackathons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch hackathons: ${error.message}`);
    }

    return {
      success: true,
      data: hackathons.map(this.mapHackathon),
    };
  }

  // ============================================
  // SUBMISSION SCORING
  // ============================================

  /**
   * Score a hackathon submission
   */
  async scoreSubmission(
    adminId: string,
    submissionId: string,
    scoreDto: ScoreSubmissionDto
  ): Promise<ApiResponse<HackathonSubmission>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    if (scoreDto.score < 0 || scoreDto.score > 100) {
      throw new Error("Score must be between 0 and 100");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: submission, error } = await supabase
      .from("hackathon_submissions")
      .update({
        score: scoreDto.score,
        score_breakdown: scoreDto.scoreBreakdown,
        admin_notes: scoreDto.adminNotes,
        status: scoreDto.status || "approved",
        scored_by: adminId,
        scored_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select(
        `
        *,
        project:projects(*),
        user:users(username, avatar, wallet)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to score submission: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      "score_submission",
      "submission",
      submissionId,
      {
        score: scoreDto.score,
        status: scoreDto.status,
      }
    );

    return {
      success: true,
      data: this.mapSubmission(submission),
      message: "Submission scored successfully",
    };
  }

  /**
   * Get submissions for a hackathon (for admin to score)
   */
  async getHackathonSubmissions(
    adminId: string,
    hackathonId: string
  ): Promise<ApiResponse<HackathonSubmission[]>> {
    // Verify admin access
    const isAdminUser = await this.isAdmin(adminId);
    if (!isAdminUser) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: submissions, error } = await supabase
      .from("hackathon_submissions")
      .select(
        `
        *,
        project:projects(id, title, description, category, image_url, votes, ai_score),
        user:users(id, username, avatar, wallet)
      `
      )
      .eq("hackathon_id", hackathonId)
      .order("score", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }

    return {
      success: true,
      data: submissions.map(this.mapSubmission),
    };
  }

  /**
   * Get hackathon rounds
   */
  async getHackathonRounds(
    adminId: string,
    hackathonId: string
  ): Promise<ApiResponse<any[]>> {
    // Verify admin access
    const isAdminUser = await this.isAdmin(adminId);
    if (!isAdminUser) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: rounds, error } = await supabase
      .from("hackathon_rounds")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("round_number", { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch rounds: ${error.message}`);
      return {
        success: false,
        message: `Failed to fetch rounds: ${error.message}`,
        data: [],
      };
    }

    // Map snake_case to camelCase
    const mappedRounds = (rounds || []).map((round) => ({
      id: round.id,
      roundNumber: round.round_number,
      title: round.title,
      description: round.description,
      roundType: round.round_type,
      mode: round.mode || "online",
      teamsAdvancing: round.teams_advancing,
      bonusTeams: round.bonus_teams,
      startDate: round.start_date,
      endDate: round.end_date,
      resultsDate: round.results_date,
      status: round.status,
    }));

    return {
      success: true,
      data: mappedRounds,
    };
  }

  /**
   * Update hackathon rounds
   */
  async updateHackathonRounds(
    adminId: string,
    hackathonId: string,
    rounds: any[]
  ): Promise<ApiResponse<void>> {
    // Verify admin access
    const isAdminUser = await this.isAdmin(adminId);
    if (!isAdminUser) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    // Process each round - update existing or insert new
    for (const round of rounds) {
      const roundData = {
        hackathon_id: hackathonId,
        round_number: round.roundNumber,
        title: round.title,
        description: round.description || null,
        round_type: round.roundType,
        mode: round.mode || "online",
        teams_advancing: round.teamsAdvancing || null,
        bonus_teams: round.bonusTeams || null,
        start_date: round.startDate || null,
        end_date: round.endDate || null,
        results_date: round.resultsDate || null,
        status: round.status,
      };

      if (round.id) {
        // Update existing round
        const { error } = await supabase
          .from("hackathon_rounds")
          .update(roundData)
          .eq("id", round.id);

        if (error) {
          this.logger.error(`Failed to update round: ${error.message}`);
          throw new Error(`Failed to update round: ${error.message}`);
        }
      } else {
        // Insert new round
        const { error } = await supabase
          .from("hackathon_rounds")
          .insert(roundData);

        if (error) {
          this.logger.error(`Failed to create round: ${error.message}`);
          throw new Error(`Failed to create round: ${error.message}`);
        }
      }
    }

    await this.logAdminAction(
      adminId,
      "update_hackathon_rounds",
      "hackathon",
      hackathonId,
      { roundsCount: rounds.length }
    );

    return {
      success: true,
      message: "Rounds updated successfully",
    };
  }

  /**
   * Update submission status (winner, finalist, rejected)
   */
  async updateSubmissionStatus(
    adminId: string,
    submissionId: string,
    status: "pending" | "approved" | "rejected" | "winner" | "finalist"
  ): Promise<ApiResponse<void>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("hackathon_submissions")
      .update({ status })
      .eq("id", submissionId);

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }

    await this.logAdminAction(
      adminId,
      "update_submission_status",
      "submission",
      submissionId,
      { status }
    );

    return {
      success: true,
      message: `Submission marked as ${status}`,
    };
  }

  // ============================================
  // ADMIN ACTIVITY LOG
  // ============================================

  /**
   * Get admin activity log
   */
  async getAdminActivityLog(
    adminId: string,
    limit: number = 50
  ): Promise<ApiResponse<any[]>> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: logs, error } = await supabase
      .from("admin_activity_log")
      .select(
        `
        *,
        admin:users!admin_activity_log_admin_id_fkey(username, avatar)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch activity log: ${error.message}`);
    }

    return {
      success: true,
      data: logs,
    };
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Get all users for admin panel
   */
  async getAllUsers(adminId: string): Promise<ApiResponse<any[]>> {
    // Verify admin access
    const isAdminUser = await this.isAdmin(adminId);
    if (!isAdminUser) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id,
        wallet,
        email,
        username,
        avatar,
        bio,
        role,
        is_banned,
        last_login_at,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`);
      return { success: false, error: error.message };
    }

    // Get project counts for each user
    const usersWithCounts = await Promise.all(
      (users || []).map(async (u) => {
        const { count: projectsCount } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("author_id", u.id);

        const { count: ideasCount } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("author_id", u.id)
          .eq("type", "idea");

        return {
          id: u.id,
          wallet: u.wallet,
          email: u.email,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          isAdmin: u.role === "admin",
          isBanned: u.is_banned || false,
          projectsCount: projectsCount || 0,
          ideasCount: ideasCount || 0,
          lastLoginAt: u.last_login_at,
          createdAt: u.created_at,
        };
      })
    );

    return { success: true, data: usersWithCounts };
  }

  /**
   * Ban a user
   */
  async banUser(
    adminId: string,
    targetUserId: string
  ): Promise<ApiResponse<void>> {
    if (!(await this.isAdmin(adminId))) {
      throw new ForbiddenException("Only admins can ban users");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("users")
      .update({ is_banned: true })
      .eq("id", targetUserId);

    if (error) {
      this.logger.error(`Failed to ban user: ${error.message}`);
      return { success: false, error: error.message };
    }

    await this.logAdminAction(adminId, "ban_user", "user", targetUserId, {});

    return { success: true, message: "User banned successfully" };
  }

  /**
   * Unban a user
   */
  async unbanUser(
    adminId: string,
    targetUserId: string
  ): Promise<ApiResponse<void>> {
    if (!(await this.isAdmin(adminId))) {
      throw new ForbiddenException("Only admins can unban users");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("users")
      .update({ is_banned: false })
      .eq("id", targetUserId);

    if (error) {
      this.logger.error(`Failed to unban user: ${error.message}`);
      return { success: false, error: error.message };
    }

    await this.logAdminAction(adminId, "unban_user", "user", targetUserId, {});

    return { success: true, message: "User unbanned successfully" };
  }

  /**
   * Set user admin status
   */
  async setUserAdmin(
    adminId: string,
    targetUserId: string,
    isAdmin: boolean
  ): Promise<ApiResponse<void>> {
    if (!(await this.isAdmin(adminId))) {
      throw new ForbiddenException("Only admins can change admin status");
    }

    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("users")
      .update({ role: isAdmin ? "admin" : "user" })
      .eq("id", targetUserId);

    if (error) {
      this.logger.error(`Failed to update admin status: ${error.message}`);
      return { success: false, error: error.message };
    }

    await this.logAdminAction(
      adminId,
      isAdmin ? "grant_admin" : "revoke_admin",
      "user",
      targetUserId,
      { isAdmin }
    );

    return { success: true, message: `User admin status updated` };
  }

  // ============================================
  // SYSTEM STATS
  // ============================================

  /**
   * Get system-wide statistics
   */
  async getSystemStats(adminId: string): Promise<ApiResponse<any>> {
    // Verify admin access
    const isAdminUser = await this.isAdmin(adminId);
    if (!isAdminUser) {
      throw new ForbiddenException("Admin access required");
    }

    const supabase = this.supabaseService.getAdminClient();

    // Get total counts
    const [
      { count: totalUsers },
      { count: totalProjects },
      { count: totalIdeas },
      { count: totalHackathons },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("type", "idea"),
      supabase.from("hackathons").select("*", { count: "exact", head: true }),
    ]);

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newUsersToday } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    // Get new users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newUsersThisWeek } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // Get active users (logged in within last 7 days)
    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_login_at", weekAgo.toISOString());

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalProjects: totalProjects || 0,
        totalIdeas: totalIdeas || 0,
        totalHackathons: totalHackathons || 0,
        totalChallenges: 0, // Will be added when challenges feature is complete
        totalDonations: 0, // Could be added if tracking donations
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        activeUsers: activeUsers || 0,
      },
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: any
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    await supabase.from("admin_activity_log").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  }

  private mapHackathon(h: any): Hackathon {
    return {
      id: h.id,
      slug: h.slug,
      title: h.title,
      tagline: h.tagline || "",
      description: h.description,
      coverImage: h.cover_image || "",
      mode: h.mode || "online",
      maxParticipants: h.max_participants || 100,
      currency: h.currency || "VND",
      // Use submission_start/end as startDate/endDate fallback
      startDate: h.submission_start || h.registration_start,
      endDate: h.judging_end || h.submission_end,
      registrationStart: h.registration_start,
      registrationEnd: h.registration_end,
      prizePool: h.prize_pool,
      status: h.status,
      imageUrl: h.cover_image, // Use cover_image as imageUrl
      tags: h.tags || [],
      participantsCount: h.participants_count || 0,
      judgingCriteria: h.judging_criteria,
      createdAt: h.created_at,
      createdBy: h.created_by,
    };
  }

  private mapSubmission(s: any): HackathonSubmission {
    return {
      id: s.id,
      hackathonId: s.hackathon_id,
      projectId: s.project_id,
      userId: s.user_id,
      score: s.score,
      scoreBreakdown: s.score_breakdown,
      scoredBy: s.scored_by,
      scoredAt: s.scored_at,
      adminNotes: s.admin_notes,
      status: s.status,
      submittedAt: s.submitted_at,
      project: s.project,
      user: s.user,
    };
  }
}
