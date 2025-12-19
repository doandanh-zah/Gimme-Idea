import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  QuerySubmissionsDto,
  SubmissionStatus,
} from "./dto/submission.dto";

export interface HackathonSubmission {
  id: string;
  hackathonId: string;
  projectId: string;
  userId: string;
  pitchVideoUrl?: string;
  pitchDeckUrl?: string;
  notes?: string;
  status: SubmissionStatus;
  judgeScore?: number;
  judgeNotes?: string;
  submittedAt: string;
  updatedAt: string;
  voteCount?: number;
  hasVoted?: boolean;
  // Populated fields
  project?: {
    id: string;
    title: string;
    description: string;
    category: string;
    imageUrl?: string;
    votes: number;
  };
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@Injectable()
export class HackathonsService {
  private readonly logger = new Logger(HackathonsService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get all public hackathons (non-draft)
   */
  async getPublicHackathons(): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .neq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch hackathons: ${error.message}`);
      return { success: false, error: error.message };
    }

    // Get participant counts and rounds for each hackathon
    const hackathonsWithCounts = await Promise.all(
      (data || []).map(async (h) => {
        const { count } = await supabase
          .from("hackathon_participants")
          .select("*", { count: "exact", head: true })
          .eq("hackathon_id", h.id);

        // Try to get rounds (new V2 format)
        const { data: rounds } = await supabase
          .from("hackathon_rounds")
          .select("*")
          .eq("hackathon_id", h.id)
          .order("round_number", { ascending: true });

        // Get teams count
        const { count: teamsCount } = await supabase
          .from("hackathon_teams")
          .select("*", { count: "exact", head: true })
          .eq("hackathon_id", h.id);

        return {
          id: h.id,
          slug: h.slug,
          title: h.title,
          tagline: h.tagline,
          description: h.description,
          coverImage: h.cover_image,
          imageUrl: h.cover_image, // Use cover_image as imageUrl
          mode: h.mode || "online",
          currency: h.currency || "VND",
          status: h.status,
          prizePool: h.prize_pool,
          maxParticipants: h.max_participants,
          // Use submission dates as start/end fallback
          startDate: h.submission_start || h.registration_start,
          endDate: h.judging_end || h.submission_end,
          registrationStart: h.registration_start,
          registrationEnd: h.registration_end,
          submissionStart: h.submission_start,
          submissionEnd: h.submission_end,
          judgingStart: h.judging_start,
          judgingEnd: h.judging_end,
          isFeatured: h.is_featured,
          judgingCriteria: h.judging_criteria,
          currentRound: h.current_round,
          totalRounds: h.total_rounds || 3,
          createdAt: h.created_at,
          participantsCount: count || 0,
          teamsCount: teamsCount || 0,
          rounds:
            rounds?.map((r: any) => ({
              roundNumber: r.round_number,
              title: r.title,
              description: r.description,
              roundType: r.round_type,
              mode: r.mode,
              teamsAdvancing: r.teams_advancing,
              bonusTeams: r.bonus_teams,
              startDate: r.start_date,
              endDate: r.end_date,
              resultsDate: r.results_date,
              status: r.status,
            })) || [],
        };
      })
    );

    return { success: true, data: hackathonsWithCounts };
  }

  /**
   * Get a single hackathon by slug or ID
   */
  async getHackathonBySlug(idOrSlug: string): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    // First try to find by slug
    let { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .eq("slug", idOrSlug)
      .single();

    // If not found by slug, try by ID
    if (error || !data) {
      const result = await supabase
        .from("hackathons")
        .select("*")
        .eq("id", idOrSlug)
        .single();

      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      this.logger.warn(`Hackathon not found: ${idOrSlug}`);
      return { success: false, error: "Hackathon not found" };
    }

    // Get participant count
    const { count: participantsCount } = await supabase
      .from("hackathon_participants")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", data.id);

    // Get submission count
    const { count: submissionsCount } = await supabase
      .from("hackathon_submissions")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", data.id);

    // Get teams count
    const { count: teamsCount } = await supabase
      .from("hackathon_teams")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", data.id);

    // Get rounds (V2 format)
    const { data: rounds } = await supabase
      .from("hackathon_rounds")
      .select("*")
      .eq("hackathon_id", data.id)
      .order("round_number", { ascending: true });

    // Get prizes
    const { data: prizes } = await supabase
      .from("hackathon_prizes")
      .select("*")
      .eq("hackathon_id", data.id)
      .order("round_number", { ascending: true })
      .order("rank", { ascending: true });

    const hackathon = {
      id: data.id,
      slug: data.slug,
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      coverImage: data.cover_image,
      imageUrl: data.cover_image, // Use cover_image as imageUrl
      mode: data.mode || "online",
      currency: data.currency || "VND",
      status: data.status,
      prizePool: data.prize_pool,
      maxParticipants: data.max_participants,
      // Use submission dates as start/end fallback
      startDate: data.submission_start || data.registration_start,
      endDate: data.judging_end || data.submission_end,
      registrationStart: data.registration_start,
      registrationEnd: data.registration_end,
      submissionStart: data.submission_start,
      submissionEnd: data.submission_end,
      judgingStart: data.judging_start,
      judgingEnd: data.judging_end,
      isFeatured: data.is_featured,
      judgingCriteria: data.judging_criteria,
      currentRound: data.current_round,
      totalRounds: data.total_rounds || 3,
      createdAt: data.created_at,
      participantsCount: participantsCount || 0,
      submissionsCount: submissionsCount || 0,
      teamsCount: teamsCount || 0,
      rounds:
        rounds?.map((r: any) => ({
          id: r.id,
          roundNumber: r.round_number,
          title: r.title,
          description: r.description,
          roundType: r.round_type,
          mode: r.mode,
          teamsAdvancing: r.teams_advancing,
          bonusTeams: r.bonus_teams,
          startDate: r.start_date,
          endDate: r.end_date,
          resultsDate: r.results_date,
          weightQuality: r.weight_quality,
          weightEngagement: r.weight_engagement,
          weightVotes: r.weight_votes,
          baseIdeaLimit: r.base_idea_limit,
          unlockedIdeaLimit: r.unlocked_idea_limit,
          engagementThreshold: r.engagement_threshold,
          status: r.status,
        })) || [],
      prizes:
        prizes?.map((p: any) => ({
          id: p.id,
          roundNumber: p.round_number,
          rank: p.rank,
          title: p.title,
          prizeAmount: p.prize_amount,
          description: p.description,
          winnerTeamId: p.winner_team_id,
          announcedAt: p.announced_at,
        })) || [],
    };

    return { success: true, data: hackathon };
  }

  /**
   * Helper: Resolve hackathon ID from slug or UUID
   * Returns null if not found (instead of throwing)
   */
  private async resolveHackathonId(idOrSlug: string): Promise<string | null> {
    // Check if it's a valid UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idOrSlug)) {
      return idOrSlug;
    }

    // It's a slug, look up the UUID
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from("hackathons")
      .select("id")
      .eq("slug", idOrSlug)
      .single();

    if (error || !data) {
      this.logger.warn(`Hackathon not found: ${idOrSlug}`);
      return null;
    }

    return data.id;
  }

  /**
   * Get all submissions for a hackathon
   */
  async getSubmissions(
    query: QuerySubmissionsDto,
    currentUserId?: string
  ): Promise<ApiResponse<HackathonSubmission[]>> {
    const supabase = this.supabaseService.getAdminClient();

    let supabaseQuery = supabase.from("hackathon_submissions").select(`
      id,
      hackathon_id,
      project_id,
      user_id,
      pitch_video_url,
      pitch_deck_url,
      notes,
      status,
      judge_score,
      submitted_at,
      updated_at,
      project:projects!hackathon_submissions_project_id_fkey(
        id,
        title,
        description,
        category,
        image_url,
        votes
      ),
      author:users!hackathon_submissions_user_id_fkey(
        id,
        username,
        avatar
      )
    `);

    // Apply filters
    if (query.hackathonId) {
      // Resolve hackathon ID from slug if needed
      const hackathonId = await this.resolveHackathonId(query.hackathonId);
      if (hackathonId) {
        supabaseQuery = supabaseQuery.eq("hackathon_id", hackathonId);
      } else {
        // Hackathon not in DB yet, return empty array
        return { success: true, data: [] };
      }
    }

    if (query.userId) {
      supabaseQuery = supabaseQuery.eq("user_id", query.userId);
    }

    if (query.status) {
      supabaseQuery = supabaseQuery.eq("status", query.status);
    }

    // Search in project title/description
    if (query.search) {
      // Need to do a join search - for now just search in notes
      supabaseQuery = supabaseQuery.ilike("notes", `%${query.search}%`);
    }

    // Apply sorting
    switch (query.sortBy) {
      case "votes":
        // Sort by project votes
        supabaseQuery = supabaseQuery.order("submitted_at", {
          ascending: false,
        });
        break;
      case "score":
        supabaseQuery = supabaseQuery.order("judge_score", {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case "newest":
      default:
        supabaseQuery = supabaseQuery.order("submitted_at", {
          ascending: false,
        });
    }

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error } = await supabaseQuery;

    if (error) {
      this.logger.error(`Failed to fetch submissions: ${error.message}`);
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }

    // Get vote counts for each submission
    const submissionIds = data.map((s) => s.id);
    const { data: voteCounts } = await supabase
      .from("hackathon_submission_votes")
      .select("submission_id")
      .in("submission_id", submissionIds);

    // Count votes per submission
    const voteCountMap = new Map<string, number>();
    voteCounts?.forEach((v) => {
      const count = voteCountMap.get(v.submission_id) || 0;
      voteCountMap.set(v.submission_id, count + 1);
    });

    // Check if current user has voted
    let userVotes = new Set<string>();
    if (currentUserId) {
      const { data: userVoteData } = await supabase
        .from("hackathon_submission_votes")
        .select("submission_id")
        .eq("user_id", currentUserId)
        .in("submission_id", submissionIds);

      userVotes = new Set(userVoteData?.map((v) => v.submission_id) || []);
    }

    // Map to response format
    const submissions: HackathonSubmission[] = data.map((s) => {
      const projectData = Array.isArray(s.project) ? s.project[0] : s.project;
      const authorData = Array.isArray(s.author) ? s.author[0] : s.author;

      return {
        id: s.id,
        hackathonId: s.hackathon_id,
        projectId: s.project_id,
        userId: s.user_id,
        pitchVideoUrl: s.pitch_video_url,
        pitchDeckUrl: s.pitch_deck_url,
        notes: s.notes,
        status: s.status,
        judgeScore: s.judge_score,
        submittedAt: s.submitted_at,
        updatedAt: s.updated_at,
        voteCount: voteCountMap.get(s.id) || 0,
        hasVoted: userVotes.has(s.id),
        project: projectData
          ? {
              id: projectData.id,
              title: projectData.title,
              description: projectData.description,
              category: projectData.category,
              imageUrl: projectData.image_url,
              votes: projectData.votes,
            }
          : undefined,
        author: authorData
          ? {
              id: authorData.id,
              username: authorData.username,
              avatar: authorData.avatar,
            }
          : undefined,
      };
    });

    // Sort by votes if needed (after fetching vote counts)
    if (query.sortBy === "votes") {
      submissions.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
    }

    return {
      success: true,
      data: submissions,
    };
  }

  /**
   * Get single submission by ID
   */
  async getSubmissionById(
    id: string,
    currentUserId?: string
  ): Promise<ApiResponse<HackathonSubmission>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from("hackathon_submissions")
      .select(
        `
        id,
        hackathon_id,
        project_id,
        user_id,
        pitch_video_url,
        pitch_deck_url,
        notes,
        status,
        judge_score,
        judge_notes,
        submitted_at,
        updated_at,
        project:projects!hackathon_submissions_project_id_fkey(
          id,
          title,
          description,
          category,
          image_url,
          votes
        ),
        author:users!hackathon_submissions_user_id_fkey(
          id,
          username,
          avatar
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundException("Submission not found");
    }

    // Get vote count
    const { count: voteCount } = await supabase
      .from("hackathon_submission_votes")
      .select("*", { count: "exact", head: true })
      .eq("submission_id", id);

    // Check if user voted
    let hasVoted = false;
    if (currentUserId) {
      const { data: voteData } = await supabase
        .from("hackathon_submission_votes")
        .select("id")
        .eq("submission_id", id)
        .eq("user_id", currentUserId)
        .single();
      hasVoted = !!voteData;
    }

    const projectData = Array.isArray(data.project)
      ? data.project[0]
      : data.project;
    const authorData = Array.isArray(data.author)
      ? data.author[0]
      : data.author;

    return {
      success: true,
      data: {
        id: data.id,
        hackathonId: data.hackathon_id,
        projectId: data.project_id,
        userId: data.user_id,
        pitchVideoUrl: data.pitch_video_url,
        pitchDeckUrl: data.pitch_deck_url,
        notes: data.notes,
        status: data.status,
        judgeScore: data.judge_score,
        judgeNotes: data.judge_notes,
        submittedAt: data.submitted_at,
        updatedAt: data.updated_at,
        voteCount: voteCount || 0,
        hasVoted,
        project: projectData
          ? {
              id: projectData.id,
              title: projectData.title,
              description: projectData.description,
              category: projectData.category,
              imageUrl: projectData.image_url,
              votes: projectData.votes,
            }
          : undefined,
        author: authorData
          ? {
              id: authorData.id,
              username: authorData.username,
              avatar: authorData.avatar,
            }
          : undefined,
      },
    };
  }

  /**
   * Create a new submission
   */
  async createSubmission(
    dto: CreateSubmissionDto,
    userId: string
  ): Promise<ApiResponse<HackathonSubmission>> {
    this.logger.log(
      `[createSubmission] Called with dto: ${JSON.stringify(
        dto
      )}, userId: ${userId}`
    );
    const supabase = this.supabaseService.getAdminClient();

    // Resolve hackathon ID from slug if needed
    this.logger.log(
      `[createSubmission] Resolving hackathon ID for: ${dto.hackathonId}`
    );
    const hackathonId = await this.resolveHackathonId(dto.hackathonId);
    if (!hackathonId) {
      throw new NotFoundException(`Hackathon not found: ${dto.hackathonId}`);
    }
    this.logger.log(`Creating submission for hackathon: ${hackathonId}`);

    // Check if submission already exists
    const { data: existing } = await supabase
      .from("hackathon_submissions")
      .select("id")
      .eq("hackathon_id", hackathonId)
      .eq("project_id", dto.projectId)
      .single();

    if (existing) {
      throw new ConflictException(
        "This project has already been submitted to this hackathon"
      );
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from("projects")
      .select("author_id")
      .eq("id", dto.projectId)
      .single();

    if (!project || project.author_id !== userId) {
      throw new ForbiddenException("You can only submit your own projects");
    }

    // Create submission
    const { data, error } = await supabase
      .from("hackathon_submissions")
      .insert({
        hackathon_id: hackathonId, // Use resolved UUID
        project_id: dto.projectId,
        user_id: userId,
        pitch_video_url: dto.pitchVideoUrl,
        pitch_deck_url: dto.pitchDeckUrl,
        notes: dto.notes,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create submission: ${error.message}`);
      throw new Error(`Failed to create submission: ${error.message}`);
    }

    return this.getSubmissionById(data.id, userId);
  }

  /**
   * Update a submission
   */
  async updateSubmission(
    id: string,
    dto: UpdateSubmissionDto,
    userId: string
  ): Promise<ApiResponse<HackathonSubmission>> {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("hackathon_submissions")
      .select("user_id, status")
      .eq("id", id)
      .single();

    if (!existing) {
      throw new NotFoundException("Submission not found");
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenException("You can only edit your own submissions");
    }

    // Update submission
    const updateData: any = {};
    if (dto.pitchVideoUrl !== undefined)
      updateData.pitch_video_url = dto.pitchVideoUrl;
    if (dto.pitchDeckUrl !== undefined)
      updateData.pitch_deck_url = dto.pitchDeckUrl;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Auto-set status to submitted if video is provided and was draft
    if (dto.pitchVideoUrl && existing.status === "draft") {
      updateData.status = "submitted";
    }

    const { error } = await supabase
      .from("hackathon_submissions")
      .update(updateData)
      .eq("id", id);

    if (error) {
      this.logger.error(`Failed to update submission: ${error.message}`);
      throw new Error(`Failed to update submission: ${error.message}`);
    }

    return this.getSubmissionById(id, userId);
  }

  /**
   * Delete a submission
   */
  async deleteSubmission(
    id: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("hackathon_submissions")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      throw new NotFoundException("Submission not found");
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenException("You can only delete your own submissions");
    }

    const { error } = await supabase
      .from("hackathon_submissions")
      .delete()
      .eq("id", id);

    if (error) {
      this.logger.error(`Failed to delete submission: ${error.message}`);
      throw new Error(`Failed to delete submission: ${error.message}`);
    }

    return {
      success: true,
      message: "Submission deleted successfully",
    };
  }

  /**
   * Vote for a submission
   */
  async voteSubmission(
    submissionId: string,
    userId: string
  ): Promise<ApiResponse<{ voteCount: number; hasVoted: boolean }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if already voted
    const { data: existingVote } = await supabase
      .from("hackathon_submission_votes")
      .select("id")
      .eq("submission_id", submissionId)
      .eq("user_id", userId)
      .single();

    if (existingVote) {
      // Remove vote
      await supabase
        .from("hackathon_submission_votes")
        .delete()
        .eq("id", existingVote.id);
    } else {
      // Add vote
      await supabase.from("hackathon_submission_votes").insert({
        submission_id: submissionId,
        user_id: userId,
      });
    }

    // Get updated vote count
    const { count } = await supabase
      .from("hackathon_submission_votes")
      .select("*", { count: "exact", head: true })
      .eq("submission_id", submissionId);

    return {
      success: true,
      data: {
        voteCount: count || 0,
        hasVoted: !existingVote,
      },
    };
  }

  /**
   * Get hackathon stats
   */
  async getHackathonStats(hackathonId: string): Promise<
    ApiResponse<{
      totalSubmissions: number;
      totalParticipants: number;
      categoryBreakdown: { category: string; count: number }[];
    }>
  > {
    const supabase = this.supabaseService.getAdminClient();

    // Get total submissions
    const { count: totalSubmissions } = await supabase
      .from("hackathon_submissions")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", hackathonId);

    // Get total participants
    const { count: totalParticipants } = await supabase
      .from("hackathon_registrations")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", hackathonId);

    // Get category breakdown
    const { data: submissions } = await supabase
      .from("hackathon_submissions")
      .select(
        `
        project:projects!hackathon_submissions_project_id_fkey(category)
      `
      )
      .eq("hackathon_id", hackathonId);

    const categoryCount = new Map<string, number>();
    submissions?.forEach((s) => {
      const project = Array.isArray(s.project) ? s.project[0] : s.project;
      if (project?.category) {
        const count = categoryCount.get(project.category) || 0;
        categoryCount.set(project.category, count + 1);
      }
    });

    const categoryBreakdown = Array.from(categoryCount.entries()).map(
      ([category, count]) => ({ category, count })
    );

    return {
      success: true,
      data: {
        totalSubmissions: totalSubmissions || 0,
        totalParticipants: totalParticipants || 0,
        categoryBreakdown,
      },
    };
  }

  // =============================================
  // HACKATHON REGISTRATIONS
  // =============================================

  /**
   * Register for a hackathon
   */
  async registerForHackathon(
    hackathonIdOrSlug: string,
    userId: string,
    teamName?: string
  ): Promise<ApiResponse<{ id: string; registeredAt: string }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Resolve hackathon ID
    const hackathonId = await this.resolveHackathonId(hackathonIdOrSlug);
    if (!hackathonId) {
      throw new NotFoundException(`Hackathon not found: ${hackathonIdOrSlug}`);
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from("hackathon_registrations")
      .select("id")
      .eq("hackathon_id", hackathonId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      throw new ConflictException(
        "You are already registered for this hackathon"
      );
    }

    // Create registration
    const { data, error } = await supabase
      .from("hackathon_registrations")
      .insert({
        hackathon_id: hackathonId,
        user_id: userId,
        team_name: teamName || null,
      })
      .select("id, registered_at")
      .single();

    if (error) {
      this.logger.error(`Failed to register: ${error.message}`);
      throw new Error(`Failed to register: ${error.message}`);
    }

    this.logger.log(`User ${userId} registered for hackathon ${hackathonId}`);

    return {
      success: true,
      data: {
        id: data.id,
        registeredAt: data.registered_at,
      },
      message: "Successfully registered for hackathon",
    };
  }

  /**
   * Get user's registration for a hackathon
   */
  async getMyRegistration(
    hackathonIdOrSlug: string,
    userId: string
  ): Promise<ApiResponse<{ isRegistered: boolean; registration?: any }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Resolve hackathon ID
    const hackathonId = await this.resolveHackathonId(hackathonIdOrSlug);
    if (!hackathonId) {
      return { success: true, data: { isRegistered: false } };
    }

    const { data, error } = await supabase
      .from("hackathon_registrations")
      .select("id, team_name, registered_at")
      .eq("hackathon_id", hackathonId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return { success: true, data: { isRegistered: false } };
    }

    return {
      success: true,
      data: {
        isRegistered: true,
        registration: {
          id: data.id,
          teamName: data.team_name,
          registeredAt: data.registered_at,
        },
      },
    };
  }

  /**
   * Get all participants for a hackathon
   */
  async getHackathonParticipants(
    hackathonIdOrSlug: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<{ participants: any[]; total: number }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Resolve hackathon ID
    const hackathonId = await this.resolveHackathonId(hackathonIdOrSlug);
    if (!hackathonId) {
      return { success: true, data: { participants: [], total: 0 } };
    }

    // Get total count
    const { count: total } = await supabase
      .from("hackathon_registrations")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", hackathonId);

    // Get participants with user info
    const { data, error } = await supabase
      .from("hackathon_registrations")
      .select(
        `
                id,
                team_name,
                registered_at,
                user:users!hackathon_registrations_user_id_fkey(
                    id,
                    username,
                    avatar
                )
            `
      )
      .eq("hackathon_id", hackathonId)
      .order("registered_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Failed to get participants: ${error.message}`);
      throw new Error(`Failed to get participants: ${error.message}`);
    }

    const participants = data.map((r) => {
      const userData = Array.isArray(r.user) ? r.user[0] : r.user;
      return {
        id: r.id,
        teamName: r.team_name,
        registeredAt: r.registered_at,
        user: userData
          ? {
              id: userData.id,
              username: userData.username,
              avatar: userData.avatar,
            }
          : null,
      };
    });

    return {
      success: true,
      data: {
        participants,
        total: total || 0,
      },
    };
  }

  // =============================================
  // HACKATHON TEAMS
  // =============================================

  /**
   * Create a new team
   */
  async createTeam(
    hackathonIdOrSlug: string,
    userId: string,
    data: {
      name: string;
      description?: string;
      avatarUrl?: string;
      maxMembers?: number;
      isOpen?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    // Resolve hackathon ID
    const hackathonId = await this.resolveHackathonId(hackathonIdOrSlug);
    if (!hackathonId) {
      throw new NotFoundException(`Hackathon not found: ${hackathonIdOrSlug}`);
    }

    // Check if user is registered for this hackathon
    const { data: registration } = await supabase
      .from("hackathon_registrations")
      .select("id")
      .eq("hackathon_id", hackathonId)
      .eq("user_id", userId)
      .single();

    if (!registration) {
      throw new ForbiddenException(
        "You must be registered for this hackathon to create a team"
      );
    }

    // Check if user is already in a team
    const { data: existingTeam } = await supabase
      .from("hackathon_team_members")
      .select("team_id, hackathon_teams!inner(hackathon_id)")
      .eq("user_id", userId)
      .eq("hackathon_teams.hackathon_id", hackathonId)
      .single();

    if (existingTeam) {
      throw new ConflictException(
        "You are already in a team for this hackathon"
      );
    }

    // Create team (trigger will auto-add leader as member)
    const { data: team, error } = await supabase
      .from("hackathon_teams")
      .insert({
        hackathon_id: hackathonId,
        name: data.name,
        description: data.description,
        avatar_url: data.avatarUrl,
        leader_id: userId,
        max_members: data.maxMembers || 5,
        is_open: data.isOpen || false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ConflictException(
          "A team with this name already exists in this hackathon"
        );
      }
      this.logger.error(`Failed to create team: ${error.message}`);
      throw new Error(`Failed to create team: ${error.message}`);
    }

    this.logger.log(
      `User ${userId} created team ${team.id} in hackathon ${hackathonId}`
    );

    return this.getTeamById(team.id, userId);
  }

  /**
   * Get team by ID
   */
  async getTeamById(
    teamId: string,
    currentUserId?: string
  ): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: team, error } = await supabase
      .from("hackathon_teams")
      .select(
        `
                id,
                hackathon_id,
                name,
                description,
                avatar_url,
                leader_id,
                max_members,
                is_open,
                created_at,
                updated_at,
                leader:users!hackathon_teams_leader_id_fkey(id, username, avatar)
            `
      )
      .eq("id", teamId)
      .single();

    if (error || !team) {
      throw new NotFoundException("Team not found");
    }

    // Get members
    const { data: members } = await supabase
      .from("hackathon_team_members")
      .select(
        `
                id,
                role,
                joined_at,
                user:users!hackathon_team_members_user_id_fkey(id, username, avatar)
            `
      )
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    const leaderData = Array.isArray(team.leader)
      ? team.leader[0]
      : team.leader;
    const memberCount = members?.length || 0;

    return {
      success: true,
      data: {
        id: team.id,
        hackathonId: team.hackathon_id,
        name: team.name,
        description: team.description,
        avatarUrl: team.avatar_url,
        leaderId: team.leader_id,
        maxMembers: team.max_members,
        memberCount,
        isOpen: team.is_open,
        isFull: memberCount >= team.max_members,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
        leader: leaderData
          ? {
              id: leaderData.id,
              username: leaderData.username,
              avatar: leaderData.avatar,
            }
          : null,
        members:
          members?.map((m) => {
            const userData = Array.isArray(m.user) ? m.user[0] : m.user;
            return {
              id: m.id,
              userId: userData?.id,
              username: userData?.username,
              avatar: userData?.avatar,
              role: m.role,
              joinedAt: m.joined_at,
            };
          }) || [],
      },
    };
  }

  /**
   * Get user's team in a hackathon
   */
  async getMyTeam(
    hackathonIdOrSlug: string,
    userId: string
  ): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    // Resolve hackathon ID
    const hackathonId = await this.resolveHackathonId(hackathonIdOrSlug);
    if (!hackathonId) {
      this.logger.warn(
        `getMyTeam: hackathon not found for ${hackathonIdOrSlug}`
      );
      return { success: true, data: { team: null, role: null } };
    }

    this.logger.log(
      `getMyTeam: Looking for user ${userId} in hackathon ${hackathonId}`
    );

    // First, find all teams in this hackathon that user is a member of
    const { data: membership, error: membershipError } = await supabase
      .from("hackathon_team_members")
      .select(
        `
                team_id,
                role,
                hackathon_teams(id, hackathon_id)
            `
      )
      .eq("user_id", userId);

    if (membershipError) {
      this.logger.error(`getMyTeam error: ${membershipError.message}`);
      return { success: true, data: { team: null, role: null } };
    }

    this.logger.log(
      `getMyTeam: Found ${membership?.length || 0} memberships for user`
    );

    // Filter to find the one for this hackathon
    const teamMembership = membership?.find((m: any) => {
      const team = Array.isArray(m.hackathon_teams)
        ? m.hackathon_teams[0]
        : m.hackathon_teams;
      return team?.hackathon_id === hackathonId;
    });

    if (!teamMembership) {
      this.logger.log(`getMyTeam: No team found for user in this hackathon`);
      return { success: true, data: { team: null, role: null } };
    }

    this.logger.log(
      `getMyTeam: Found team ${teamMembership.team_id} with role ${teamMembership.role}`
    );

    // Get full team data
    const teamResponse = await this.getTeamById(teamMembership.team_id, userId);

    return {
      success: true,
      data: {
        team: teamResponse.data,
        role: teamMembership.role as "leader" | "member",
      },
    };
  }

  /**
   * Get all teams in a hackathon
   */
  async getHackathonTeams(
    hackathonIdOrSlug: string,
    options?: {
      search?: string;
      isOpen?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<{ teams: any[]; total: number }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Resolve hackathon ID
    const hackathonId = await this.resolveHackathonId(hackathonIdOrSlug);
    if (!hackathonId) {
      return { success: true, data: { teams: [], total: 0 } };
    }

    let query = supabase
      .from("hackathon_teams")
      .select(
        `
                id,
                hackathon_id,
                name,
                description,
                avatar_url,
                leader_id,
                max_members,
                is_open,
                created_at,
                leader:users!hackathon_teams_leader_id_fkey(id, username, avatar)
            `,
        { count: "exact" }
      )
      .eq("hackathon_id", hackathonId);

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    if (options?.isOpen !== undefined) {
      query = query.eq("is_open", options.isOpen);
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: teams, error, count } = await query;

    if (error) {
      this.logger.error(`Failed to get teams: ${error.message}`);
      throw new Error(`Failed to get teams: ${error.message}`);
    }

    // Get member counts for all teams
    const teamIds = teams?.map((t) => t.id) || [];
    const { data: memberCounts } = await supabase
      .from("hackathon_team_members")
      .select("team_id")
      .in("team_id", teamIds);

    const countMap = new Map<string, number>();
    memberCounts?.forEach((m) => {
      const current = countMap.get(m.team_id) || 0;
      countMap.set(m.team_id, current + 1);
    });

    return {
      success: true,
      data: {
        teams:
          teams?.map((t) => {
            const leaderData = Array.isArray(t.leader) ? t.leader[0] : t.leader;
            const memberCount = countMap.get(t.id) || 0;
            return {
              id: t.id,
              hackathonId: t.hackathon_id,
              name: t.name,
              description: t.description,
              avatarUrl: t.avatar_url,
              leaderId: t.leader_id,
              maxMembers: t.max_members,
              memberCount,
              isOpen: t.is_open,
              isFull: memberCount >= t.max_members,
              createdAt: t.created_at,
              leader: leaderData
                ? {
                    id: leaderData.id,
                    username: leaderData.username,
                    avatar: leaderData.avatar,
                  }
                : null,
            };
          }) || [],
        total: count || 0,
      },
    };
  }

  /**
   * Update a team
   */
  async updateTeam(
    teamId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      avatarUrl?: string;
      maxMembers?: number;
      isOpen?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    // Verify leadership
    const { data: team } = await supabase
      .from("hackathon_teams")
      .select("leader_id")
      .eq("id", teamId)
      .single();

    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (team.leader_id !== userId) {
      throw new ForbiddenException("Only the team leader can update the team");
    }

    // Update
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
    if (data.maxMembers !== undefined) updateData.max_members = data.maxMembers;
    if (data.isOpen !== undefined) updateData.is_open = data.isOpen;

    const { error } = await supabase
      .from("hackathon_teams")
      .update(updateData)
      .eq("id", teamId);

    if (error) {
      this.logger.error(`Failed to update team: ${error.message}`);
      throw new Error(`Failed to update team: ${error.message}`);
    }

    return this.getTeamById(teamId, userId);
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string, userId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    // Verify leadership
    const { data: team } = await supabase
      .from("hackathon_teams")
      .select("leader_id")
      .eq("id", teamId)
      .single();

    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (team.leader_id !== userId) {
      throw new ForbiddenException("Only the team leader can delete the team");
    }

    const { error } = await supabase
      .from("hackathon_teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      this.logger.error(`Failed to delete team: ${error.message}`);
      throw new Error(`Failed to delete team: ${error.message}`);
    }

    return { success: true, message: "Team deleted successfully" };
  }

  /**
   * Leave a team
   */
  async leaveTeam(teamId: string, userId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    // Get team and membership
    const { data: team } = await supabase
      .from("hackathon_teams")
      .select("leader_id")
      .eq("id", teamId)
      .single();

    if (!team) {
      throw new NotFoundException("Team not found");
    }

    // Leader cannot leave, must delete team or transfer leadership
    if (team.leader_id === userId) {
      throw new ForbiddenException(
        "Team leader cannot leave. Delete the team or transfer leadership first."
      );
    }

    const { error } = await supabase
      .from("hackathon_team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) {
      this.logger.error(`Failed to leave team: ${error.message}`);
      throw new Error(`Failed to leave team: ${error.message}`);
    }

    return { success: true, message: "Successfully left the team" };
  }

  /**
   * Kick a member from team
   */
  async kickMember(
    teamId: string,
    memberId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    // Verify leadership
    const { data: team } = await supabase
      .from("hackathon_teams")
      .select("leader_id")
      .eq("id", teamId)
      .single();

    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (team.leader_id !== userId) {
      throw new ForbiddenException("Only the team leader can kick members");
    }

    if (memberId === userId) {
      throw new ForbiddenException("Cannot kick yourself");
    }

    const { error } = await supabase
      .from("hackathon_team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", memberId);

    if (error) {
      this.logger.error(`Failed to kick member: ${error.message}`);
      throw new Error(`Failed to kick member: ${error.message}`);
    }

    return { success: true, message: "Member removed from team" };
  }

  // =============================================
  // TEAM INVITES
  // =============================================

  /**
   * Invite a user to team
   */
  async inviteToTeam(
    teamId: string,
    inviterId: string,
    inviteeId: string,
    message?: string
  ): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    // Get team info
    const { data: team } = await supabase
      .from("hackathon_teams")
      .select("id, hackathon_id, max_members")
      .eq("id", teamId)
      .single();

    if (!team) {
      throw new NotFoundException("Team not found");
    }

    // Check if inviter is a member of the team
    const { data: inviterMembership } = await supabase
      .from("hackathon_team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", inviterId)
      .single();

    if (!inviterMembership) {
      throw new ForbiddenException(
        "You must be a team member to invite others"
      );
    }

    // Check if team is full
    const { count: memberCount } = await supabase
      .from("hackathon_team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    if ((memberCount || 0) >= team.max_members) {
      throw new ConflictException("Team is full");
    }

    // Check if invitee is already in a team for this hackathon
    const { data: existingTeam } = await supabase
      .from("hackathon_team_members")
      .select("team_id, hackathon_teams!inner(hackathon_id)")
      .eq("user_id", inviteeId)
      .eq("hackathon_teams.hackathon_id", team.hackathon_id)
      .single();

    if (existingTeam) {
      throw new ConflictException(
        "User is already in a team for this hackathon"
      );
    }

    // Check if there's already a pending invite
    const { data: existingInvite } = await supabase
      .from("hackathon_team_invites")
      .select("id")
      .eq("team_id", teamId)
      .eq("invitee_id", inviteeId)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      throw new ConflictException(
        "There's already a pending invite for this user"
      );
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from("hackathon_team_invites")
      .insert({
        team_id: teamId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        message,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create invite: ${error.message}`);
      throw new Error(`Failed to create invite: ${error.message}`);
    }

    return {
      success: true,
      data: invite,
      message: "Invitation sent successfully",
    };
  }

  /**
   * Get user's pending invites
   */
  async getMyInvites(userId: string): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: invites, error } = await supabase
      .from("hackathon_team_invites")
      .select(
        `
                id,
                message,
                status,
                created_at,
                expires_at,
                team:hackathon_teams!hackathon_team_invites_team_id_fkey(
                    id,
                    name,
                    hackathon_id,
                    hackathon:hackathons!hackathon_teams_hackathon_id_fkey(slug)
                ),
                inviter:users!hackathon_team_invites_inviter_id_fkey(
                    id,
                    username,
                    avatar
                )
            `
      )
      .eq("invitee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error(`Failed to get invites: ${error.message}`);
      throw new Error(`Failed to get invites: ${error.message}`);
    }

    return {
      success: true,
      data:
        invites?.map((inv) => {
          const teamData = Array.isArray(inv.team) ? inv.team[0] : inv.team;
          const inviterData = Array.isArray(inv.inviter)
            ? inv.inviter[0]
            : inv.inviter;
          const hackathonData = teamData?.hackathon
            ? Array.isArray(teamData.hackathon)
              ? teamData.hackathon[0]
              : teamData.hackathon
            : null;
          return {
            id: inv.id,
            teamId: teamData?.id,
            teamName: teamData?.name,
            hackathonId: teamData?.hackathon_id,
            hackathonSlug: hackathonData?.slug,
            inviterId: inviterData?.id,
            inviterName: inviterData?.username,
            inviterAvatar: inviterData?.avatar,
            message: inv.message,
            status: inv.status,
            createdAt: inv.created_at,
            expiresAt: inv.expires_at,
          };
        }) || [],
    };
  }

  /**
   * Respond to an invite
   */
  async respondToInvite(
    inviteId: string,
    userId: string,
    action: "accept" | "reject"
  ): Promise<ApiResponse<{ hackathonSlug?: string }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Get invite with hackathon slug
    const { data: invite } = await supabase
      .from("hackathon_team_invites")
      .select(
        `
                id, 
                team_id, 
                invitee_id, 
                status, 
                expires_at,
                team:hackathon_teams!hackathon_team_invites_team_id_fkey(
                    hackathon_id,
                    hackathon:hackathons!hackathon_teams_hackathon_id_fkey(slug)
                )
            `
      )
      .eq("id", inviteId)
      .single();

    if (!invite) {
      throw new NotFoundException("Invite not found");
    }

    if (invite.invitee_id !== userId) {
      throw new ForbiddenException("This invite is not for you");
    }

    if (invite.status !== "pending") {
      throw new ConflictException("This invite has already been responded to");
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from("hackathon_team_invites")
        .update({ status: "expired" })
        .eq("id", inviteId);
      throw new ConflictException("This invite has expired");
    }

    if (action === "accept") {
      // Add user to team
      const { error: memberError } = await supabase
        .from("hackathon_team_members")
        .insert({
          team_id: invite.team_id,
          user_id: userId,
          role: "member",
        });

      if (memberError) {
        this.logger.error(`Failed to add member: ${memberError.message}`);
        throw new Error(`Failed to join team: ${memberError.message}`);
      }
    }

    // Update invite status
    const { error } = await supabase
      .from("hackathon_team_invites")
      .update({
        status: action === "accept" ? "accepted" : "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (error) {
      this.logger.error(`Failed to update invite: ${error.message}`);
      throw new Error(`Failed to respond to invite: ${error.message}`);
    }

    // Extract hackathon slug
    const teamData = Array.isArray(invite.team) ? invite.team[0] : invite.team;
    const hackathonData = teamData?.hackathon
      ? Array.isArray(teamData.hackathon)
        ? teamData.hackathon[0]
        : teamData.hackathon
      : null;

    return {
      success: true,
      message:
        action === "accept"
          ? "Successfully joined the team"
          : "Invite rejected",
      data: {
        hackathonSlug: hackathonData?.slug,
      },
    };
  }

  /**
   * Cancel an invite (by inviter)
   */
  async cancelInvite(
    inviteId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: invite } = await supabase
      .from("hackathon_team_invites")
      .select("inviter_id")
      .eq("id", inviteId)
      .single();

    if (!invite) {
      throw new NotFoundException("Invite not found");
    }

    if (invite.inviter_id !== userId) {
      throw new ForbiddenException("Only the inviter can cancel this invite");
    }

    const { error } = await supabase
      .from("hackathon_team_invites")
      .delete()
      .eq("id", inviteId);

    if (error) {
      this.logger.error(`Failed to cancel invite: ${error.message}`);
      throw new Error(`Failed to cancel invite: ${error.message}`);
    }

    return { success: true, message: "Invite cancelled" };
  }
}
