import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { QueryProjectsDto } from "./dto/query-projects.dto";
import { ApiResponse, Project } from "../shared/types";
import { AIService } from "../ai/ai.service";
import { TTLCache } from "../shared/ttl-cache";
import { Connection, PublicKey } from "@solana/web3.js";
import { CreateDaoRequestDto } from "./dto/create-dao-request.dto";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { CreateIdeaPoolDto } from "./dto/create-idea-pool.dto";

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly AI_BOT_WALLET =
    "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm";
  private readonly IDEA_POOL_VOTE_THRESHOLD = Number(
    process.env.IDEA_POOL_VOTE_THRESHOLD || 10
  );

  // Egress control: cache hot list/detail responses for a short TTL.
  // This reduces repeated Supabase reads from FE (refresh/retries, multi-tab).
  // Per-instance only (no cross-replica sharing).
  private readonly listCache = new TTLCache<ApiResponse<Project[]>>(30_000);
  private readonly oneCache = new TTLCache<ApiResponse<Project>>(30_000);

  constructor(
    private supabaseService: SupabaseService,
    private aiService: AIService
  ) {}

  /**
   * Get all projects with filters
   */
  async findAll(query: QueryProjectsDto): Promise<ApiResponse<Project[]>> {
    // Cache key includes all query params that affect output.
    const cacheKey = JSON.stringify({
      type: query.type,
      category: query.category,
      stage: query.stage,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      poolStatus: query.poolStatus,
      limit: query.limit,
      offset: query.offset,
    });
    const cached = this.listCache.get(cacheKey);
    if (cached) return cached;

    const supabase = this.supabaseService.getAdminClient();

    // OPTIMIZATION: Only select columns needed for list view to reduce egress
    // Full details (problem, solution, opportunity) are fetched in findOne
    let supabaseQuery = supabase.from("projects").select(`
        id,
        slug,
        type,
        title,
        description,
        category,
        votes,
        feedback_count,
        stage,
        tags,
        website,
        bounty,
        image_url,
        is_anonymous,
        created_at,
        ai_score,

        pool_status,
        governance_treasury_address,
        proposal_pubkey,
        pass_pool_address,
        fail_pool_address,
        pool_create_tx,
        pool_finalize_tx,
        pool_refs,
        final_decision,
        finalized_at,
        total_pass_volume,
        total_fail_volume,

        author:users!projects_author_id_fkey(
          username,
          wallet,
          avatar,
          slug
        )
      `);

    // Apply filters
    if (query.type) {
      supabaseQuery = supabaseQuery.eq("type", query.type);
    }

    if (query.category) {
      supabaseQuery = supabaseQuery.eq("category", query.category);
    }

    if (query.stage) {
      supabaseQuery = supabaseQuery.eq("stage", query.stage);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      );
    }

    if (query.poolStatus) {
      supabaseQuery = supabaseQuery.eq("pool_status", query.poolStatus);
    }

    // Apply sorting (convert camelCase to snake_case for database columns)
    const sortColumnMap = {
      feedbackCount: "feedback_count",
      createdAt: "created_at",
      votes: "votes",
      aiScore: "ai_score",
      recommended: "ai_score", // Alias for AI recommendations
    };

    // Default: For ideas without explicit sort, use AI score for recommendations
    let sortColumn = sortColumnMap[query.sortBy] || query.sortBy;
    let sortOrder = query.sortOrder === "asc";

    // If sorting by AI score, handle NULL values (put them at the end)
    if (sortColumn === "ai_score") {
      supabaseQuery = supabaseQuery.order(sortColumn, {
        ascending: sortOrder,
        nullsFirst: false, // NULLs last - projects without AI score go to the end
      });
    } else {
      supabaseQuery = supabaseQuery.order(sortColumn, { ascending: sortOrder });
    }

    // Apply pagination
    supabaseQuery = supabaseQuery.range(
      query.offset,
      query.offset + query.limit - 1
    );

    const { data, error } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    // Map database results to Project type (list view - minimal fields)
    const projects: Project[] = data.map((p) => {
      // Handle author - can be array or single object depending on query
      const authorData = Array.isArray(p.author) ? p.author[0] : p.author;

      return {
        id: p.id,
        type: p.type || "project",
        title: p.title,
        description: p.description,
        category: p.category,
        votes: p.votes || 0,
        feedbackCount: p.feedback_count || 0,
        stage: p.stage,
        tags: p.tags || [],
        website: p.website,
        author:
          p.is_anonymous || !authorData
            ? null
            : {
                username: authorData.username,
                wallet: authorData.wallet,
                avatar: authorData.avatar,
              },
        bounty: p.bounty,
        imageUrl: p.image_url,
        // Idea-specific fields NOT included in list view to save bandwidth
        // They are fetched in findOne for detail view
        isAnonymous: p.is_anonymous,
        createdAt: p.created_at,

        // Commit-to-Build (Phase 1)
        poolStatus: p.pool_status,
        governanceTreasuryAddress: p.governance_treasury_address,
        proposalPubkey: p.proposal_pubkey,
        passPoolAddress: p.pass_pool_address,
        failPoolAddress: p.fail_pool_address,
        poolCreateTx: p.pool_create_tx,
        poolFinalizeTx: p.pool_finalize_tx,
        poolRefs: p.pool_refs,
        finalDecision: p.final_decision,
        finalizedAt: p.finalized_at,
        totalPassVolume:
          p.total_pass_volume == null ? undefined : Number(p.total_pass_volume),
        totalFailVolume:
          p.total_fail_volume == null ? undefined : Number(p.total_fail_volume),
      };
    });

    const res: ApiResponse<Project[]> = {
      success: true,
      data: projects,
    };

    this.listCache.set(cacheKey, res);

    return res;
  }

  /**
   * Get top recommended ideas based on AI score
   */
  async getRecommendedIdeas(
    limit: number = 3,
    category?: string
  ): Promise<ApiResponse<Project[]>> {
    const supabase = this.supabaseService.getAdminClient();

    // OPTIMIZATION: Only select columns needed for recommended cards
    // Include 'problem' and 'solution' for preview text in recommended idea cards
    let query = supabase
      .from("projects")
      .select(
        `
        id,
        slug,
        type,
        title,
        description,
        category,
        votes,
        feedback_count,
        stage,
        tags,
        website,
        bounty,
        image_url,
        is_anonymous,
        created_at,
        ai_score,

        pool_status,
        governance_treasury_address,
        proposal_pubkey,
        pass_pool_address,
        fail_pool_address,
        pool_create_tx,
        pool_finalize_tx,
        pool_refs,
        final_decision,
        finalized_at,
        total_pass_volume,
        total_fail_volume,

        problem,
        solution,
        author:users!projects_author_id_fkey(
          username,
          wallet,
          avatar,
          slug
        )
      `
      )
      .eq("type", "idea")
      .not("ai_score", "is", null)
      .order("ai_score", { ascending: false, nullsFirst: false });

    // Filter by category if provided
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recommended ideas: ${error.message}`);
    }

    const projects: Project[] = data.map((p) => {
      const authorData = Array.isArray(p.author) ? p.author[0] : p.author;

      return {
        id: p.id,
        type: p.type || "project",
        title: p.title,
        description: p.description,
        category: p.category,
        votes: p.votes || 0,
        feedbackCount: p.feedback_count || 0,
        stage: p.stage,
        tags: p.tags || [],
        website: p.website,
        author:
          p.is_anonymous || !authorData
            ? null
            : {
                username: authorData.username,
                wallet: authorData.wallet,
                avatar: authorData.avatar,
              },
        bounty: p.bounty,
        imageUrl: p.image_url,
        problem: p.problem, // Include for recommended cards preview
        solution: p.solution, // Include for recommended cards preview
        isAnonymous: p.is_anonymous,
        createdAt: p.created_at,

        // Commit-to-Build (Phase 1)
        poolStatus: p.pool_status,
        governanceTreasuryAddress: p.governance_treasury_address,
        proposalPubkey: p.proposal_pubkey,
        passPoolAddress: p.pass_pool_address,
        failPoolAddress: p.fail_pool_address,
        poolCreateTx: p.pool_create_tx,
        poolFinalizeTx: p.pool_finalize_tx,
        poolRefs: p.pool_refs,
        finalDecision: p.final_decision,
        finalizedAt: p.finalized_at,
        totalPassVolume:
          p.total_pass_volume == null ? undefined : Number(p.total_pass_volume),
        totalFailVolume:
          p.total_fail_volume == null ? undefined : Number(p.total_fail_volume),
      };
    });

    return {
      success: true,
      data: projects,
    };
  }

  /**
   * Get single project by ID or slug
   */
  async findOne(idOrSlug: string): Promise<ApiResponse<Project>> {
    const supabase = this.supabaseService.getAdminClient();

    const selectQuery = `
      *,
      author:users!projects_author_id_fkey(
        username,
        wallet,
        avatar,
        slug
      )
    `;

    let project = null;
    let error = null;

    // Check if it's a UUID format first (most common case)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    if (isUUID) {
      // Direct UUID lookup
      const result = await supabase
        .from("projects")
        .select(selectQuery)
        .eq("id", idOrSlug)
        .single();

      project = result.data;
      error = result.error;
    }

    // If not UUID, try slug lookup first (clean URLs)
    if (!project && !isUUID) {
      const result = await supabase
        .from("projects")
        .select(selectQuery)
        .eq("slug", idOrSlug)
        .single();

      if (result.data) {
        project = result.data;
        error = null;
      }
    }

    // Fallback: try ID prefix match (for URLs like "my-idea-abc12345" or just "abc12345")
    if (!project) {
      const parts = idOrSlug.split("-");
      const lastPart = parts[parts.length - 1];

      // Check if lastPart looks like UUID prefix (8 hex chars)
      if (/^[a-f0-9]{8}$/i.test(lastPart)) {
        // Search for projects where ID starts with this prefix
        const { data: projects } = await supabase
          .from("projects")
          .select(selectQuery);

        if (projects && projects.length > 0) {
          project = projects.find((p) =>
            p.id.toLowerCase().startsWith(lastPart.toLowerCase())
          );
        }
      }
    }

    // Final fallback: if idOrSlug itself is 8 chars, try direct prefix match
    if (!project && /^[a-f0-9]{8}$/i.test(idOrSlug)) {
      const { data: projects } = await supabase
        .from("projects")
        .select(selectQuery);

      if (projects && projects.length > 0) {
        project = projects.find((p) =>
          p.id.toLowerCase().startsWith(idOrSlug.toLowerCase())
        );
      }
    }

    if (error || !project) {
      throw new NotFoundException("Project not found");
    }

    // Fetch comments for this project
    const { data: comments } = await supabase
      .from("comments")
      .select(
        `
        *,
        author:users!comments_user_id_fkey(
          username,
          wallet,
          avatar
        )
      `
      )
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });

    const projectResponse: Project = {
      id: project.id,
      slug: project.slug,
      type: project.type || "project",
      title: project.title,
      description: project.description,
      category: project.category,
      votes: project.votes || 0,
      feedbackCount: project.feedback_count || 0,
      stage: project.stage,
      tags: project.tags || [],
      website: project.website,
      author: project.is_anonymous
        ? null
        : {
            username: project.author.username,
            wallet: project.author.wallet,
            avatar: project.author.avatar,
            slug: project.author.slug,
          },
      bounty: project.bounty,
      imageUrl: project.image_url,

      // Commit-to-Build governance metadata (optional)
      poolStatus: project.pool_status,
      governanceRealmAddress: project.governance_realm_address,
      governanceTreasuryAddress: project.governance_treasury_address,
      governanceReceiptMint: project.governance_receipt_mint,
      supportFeeBps: project.support_fee_bps,
      supportFeeCapUsdc: project.support_fee_cap_usdc,
      supportFeeRecipient: project.support_fee_recipient,
      poolCreatedAt: project.pool_created_at,
      poolCreatedBy: project.pool_created_by,
      proposalPubkey: project.proposal_pubkey,
      passPoolAddress: project.pass_pool_address,
      failPoolAddress: project.fail_pool_address,
      poolCreateTx: project.pool_create_tx,
      poolFinalizeTx: project.pool_finalize_tx,
      poolRefs: project.pool_refs,
      finalDecision: project.final_decision,
      finalizedAt: project.finalized_at,
      totalPassVolume:
        project.total_pass_volume == null
          ? undefined
          : Number(project.total_pass_volume),
      totalFailVolume:
        project.total_fail_volume == null
          ? undefined
          : Number(project.total_fail_volume),

      // Idea-specific fields
      problem: project.problem,
      solution: project.solution,
      opportunity: project.opportunity,
      isAnonymous: project.is_anonymous,
      createdAt: project.created_at,
      // Include comments
      comments: comments
        ? comments.map((c) => ({
            id: c.id,
            projectId: c.project_id,
            content: c.content,
            author: c.is_anonymous
              ? null
              : {
                  username: c.author.username,
                  wallet: c.author.wallet,
                  avatar: c.author.avatar,
                },
            likes: c.likes || 0,
            parentCommentId: c.parent_comment_id,
            isAnonymous: c.is_anonymous,
            tipsAmount: c.tips_amount || 0,
            createdAt: c.created_at,
            is_ai_generated: c.is_ai_generated,
            ai_model: c.ai_model,
          }))
        : [],
    };

    return {
      success: true,
      data: projectResponse,
    };
  }

  /**
   * Create new project
   */
  async create(
    userId: string,
    createDto: CreateProjectDto
  ): Promise<ApiResponse<Project>> {
    const supabase = this.supabaseService.getAdminClient();

    const newProject = {
      type: createDto.type || "project",
      author_id: userId,
      title: createDto.title,
      description: createDto.description,
      category: createDto.category,
      stage: createDto.stage,
      tags: createDto.tags,
      website: createDto.website,
      bounty: createDto.bounty || 0,
      image_url: createDto.imageUrl,
      // Idea-specific fields
      problem: createDto.problem,
      solution: createDto.solution,
      opportunity: createDto.opportunity,
      // Anonymous idea/project submission is disabled (comments can still be anonymous)
      is_anonymous: false,
      votes: 0,
      feedback_count: 0,
      created_at: new Date().toISOString(),
    };

    const { data: project, error } = await supabase
      .from("projects")
      .insert(newProject)
      .select(
        `
        *,
        author:users!projects_author_id_fkey(
          username,
          wallet,
          avatar,
          slug
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    const projectResponse: Project = {
      id: project.id,
      slug: project.slug,
      type: project.type || "project",
      title: project.title,
      description: project.description,
      category: project.category,
      votes: project.votes || 0,
      feedbackCount: project.feedback_count || 0,
      stage: project.stage,
      tags: project.tags || [],
      website: project.website,
      author: project.is_anonymous
        ? null
        : {
            username: project.author.username,
            wallet: project.author.wallet,
            avatar: project.author.avatar,
            slug: project.author.slug,
          },
      bounty: project.bounty,
      imageUrl: project.image_url,
      // Idea-specific fields
      problem: project.problem,
      solution: project.solution,
      opportunity: project.opportunity,
      isAnonymous: project.is_anonymous,
      createdAt: project.created_at,
    };

    // Auto-generate AI feedback for ideas (async, don't wait)
    if (project.type === "idea" && project.problem && project.solution) {
      this.generateAIFeedbackAsync(project.id, {
        title: project.title,
        problem: project.problem,
        solution: project.solution,
        opportunity: project.opportunity,
      }).catch((err) => {
        this.logger.error(
          `Failed to generate AI feedback for project ${project.id}`,
          err
        );
      });
    }

    return {
      success: true,
      data: projectResponse,
      message: "Project created successfully",
    };
  }

  /**
   * Generate AI feedback asynchronously (background task)
   */
  private async generateAIFeedbackAsync(
    projectId: string,
    ideaData: {
      title: string;
      problem: string;
      solution: string;
      opportunity?: string;
    },
    options?: {
      reason?: "create" | "update";
    }
  ): Promise<void> {
    const reason = options?.reason || "create";
    this.logger.log(
      `Generating AI feedback for project ${projectId} (reason: ${reason})`
    );

    try {
      const supabase = this.supabaseService.getAdminClient();

      // Spam filter: check content quality
      const minLength = 20; // Guardrail only for near-empty inputs
      const totalLength =
        (ideaData.problem || "").length + (ideaData.solution || "").length;

      if (totalLength < minLength) {
        this.logger.warn(
          `Skipping AI feedback for project ${projectId}: content too short (${totalLength} chars). Clearing ai_score.`
        );
        await supabase
          .from("projects")
          .update({ ai_score: null })
          .eq("id", projectId);
        return;
      }

      // Check for spam patterns
      const spamKeywords = ["test", "bla bla", "asdf", "qwerty", "...", "spam"];
      const content =
        `${ideaData.title} ${ideaData.problem} ${ideaData.solution}`.toLowerCase();
      const hasSpam = spamKeywords.some((keyword) => content.includes(keyword));

      if (hasSpam && totalLength < 100) {
        this.logger.warn(
          `Project ${projectId} looks spammy; continue scoring to avoid stale/missing ai_score`
        );
      }

      // Generate AI feedback
      const feedback = await this.aiService.generateIdeaFeedback(ideaData);

      // First, get or create AI bot user
      let { data: aiUser } = await supabase
        .from("users")
        .select("id")
        .eq("wallet", this.AI_BOT_WALLET)
        .single();

      if (!aiUser) {
        // Create AI bot user
        const { data: newAiUser, error: createError } = await supabase
          .from("users")
          .insert({
            wallet: this.AI_BOT_WALLET,
            username: "Gimme Idea Guy",
            avatar: null,
          })
          .select("id")
          .single();

        if (createError) {
          this.logger.error("Failed to create AI bot user", createError);
          return;
        }
        aiUser = newAiUser;
      }

      // Save AI score to project (for recommendations)
      const { error: updateError } = await supabase
        .from("projects")
        .update({ ai_score: feedback.score })
        .eq("id", projectId);

      if (updateError) {
        this.logger.error("Failed to update project AI score", updateError);
      }

      // Create comment with AI feedback - natural conversational format
      // The main comment already contains the comprehensive feedback
      // Add strengths, weaknesses, and suggestions in a clean format
      let commentContent = feedback.comment;

      // Only add structured sections if they have meaningful content
      if (feedback.strengths && feedback.strengths.length > 0) {
        commentContent += `\n\n**💪 Strengths:**\n${feedback.strengths
          .map((s) => `• ${s}`)
          .join("\n")}`;
      }

      if (feedback.weaknesses && feedback.weaknesses.length > 0) {
        commentContent += `\n\n**⚠️ Areas to Improve:**\n${feedback.weaknesses
          .map((w) => `• ${w}`)
          .join("\n")}`;
      }

      if (feedback.suggestions && feedback.suggestions.length > 0) {
        commentContent += `\n\n**💡 Suggestions:**\n${feedback.suggestions
          .map((s) => `• ${s}`)
          .join("\n")}`;
      }

      // Upsert AI comment so update/rescore doesn't spam multiple AI comments
      const { data: existingAiComment, error: existingAiCommentError } =
        await supabase
          .from("comments")
          .select("id")
          .eq("project_id", projectId)
          .eq("user_id", aiUser.id)
          .eq("is_ai_generated", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (existingAiCommentError) {
        this.logger.error(
          "Failed to check existing AI comment",
          existingAiCommentError
        );
      }

      if (existingAiComment?.id) {
        const { error: updateCommentError } = await supabase
          .from("comments")
          .update({
            content: commentContent,
            ai_model: "gpt-4o-mini",
            ai_tokens_used: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAiComment.id);

        if (updateCommentError) {
          this.logger.error("Failed to update AI comment", updateCommentError);
        } else {
          this.logger.log(
            `AI feedback updated for project ${projectId} with score ${feedback.score}`
          );
        }
      } else {
        const { error: commentError } = await supabase.from("comments").insert({
          project_id: projectId,
          user_id: aiUser.id,
          content: commentContent,
          is_anonymous: false,
          likes: 0,
          tips_amount: 0,
          is_ai_generated: true,
          ai_model: "gpt-4o-mini",
          ai_tokens_used: 0, // TODO: track actual tokens
          created_at: new Date().toISOString(),
        });

        if (commentError) {
          this.logger.error("Failed to create AI comment", commentError);
        } else {
          this.logger.log(
            `AI feedback created for project ${projectId} with score ${feedback.score}`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `AI feedback generation failed for project ${projectId}`,
        error
      );
    }
  }

  /**
   * Update project
   */
  async update(
    id: string,
    userId: string,
    updateDto: UpdateProjectDto
  ): Promise<ApiResponse<Project>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user is the author
    const { data: project } = await supabase
      .from("projects")
      .select("author_id, type, title, problem, solution, opportunity")
      .eq("id", id)
      .single();

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.author_id !== userId) {
      throw new ForbiddenException("You can only update your own projects");
    }

    const aiRelevantContentChanged =
      project.type === "idea" &&
      ((updateDto.title !== undefined && updateDto.title !== project.title) ||
        (updateDto.problem !== undefined && updateDto.problem !== project.problem) ||
        (updateDto.solution !== undefined &&
          updateDto.solution !== project.solution) ||
        (updateDto.opportunity !== undefined &&
          (updateDto.opportunity || null) !== (project.opportunity || null)));

    // Update project - Only update fields that are provided
    const updateData: any = {};
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.category !== undefined)
      updateData.category = updateDto.category;
    if (updateDto.stage !== undefined) updateData.stage = updateDto.stage;
    if (updateDto.tags !== undefined) updateData.tags = updateDto.tags;
    if (updateDto.website !== undefined) updateData.website = updateDto.website;
    if (updateDto.bounty !== undefined) updateData.bounty = updateDto.bounty;
    if (updateDto.imageUrl !== undefined)
      updateData.image_url = updateDto.imageUrl;
    // Idea-specific fields
    if (updateDto.problem !== undefined) updateData.problem = updateDto.problem;
    if (updateDto.solution !== undefined)
      updateData.solution = updateDto.solution;
    if (updateDto.opportunity !== undefined)
      updateData.opportunity = updateDto.opportunity;
    // Anonymous idea/project submission is disabled; ignore updates to anonymity.
    // (Anonymous comments are still supported.)

    const { data: updated, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        author:users!projects_author_id_fkey(
          username,
          wallet,
          avatar,
          slug
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    const projectResponse: Project = {
      id: updated.id,
      slug: updated.slug,
      type: updated.type || "project",
      title: updated.title,
      description: updated.description,
      category: updated.category,
      votes: updated.votes || 0,
      feedbackCount: updated.feedback_count || 0,
      stage: updated.stage,
      tags: updated.tags || [],
      website: updated.website,
      author: updated.is_anonymous
        ? null
        : {
            username: updated.author.username,
            wallet: updated.author.wallet,
            avatar: updated.author.avatar,
            slug: updated.author.slug,
          },
      bounty: updated.bounty,
      imageUrl: updated.image_url,
      // Idea-specific fields
      problem: updated.problem,
      solution: updated.solution,
      opportunity: updated.opportunity,
      isAnonymous: updated.is_anonymous,
      createdAt: updated.created_at,
    };

    if (aiRelevantContentChanged) {
      if (updated.problem && updated.solution) {
        this.generateAIFeedbackAsync(
          id,
          {
            title: updated.title,
            problem: updated.problem,
            solution: updated.solution,
            opportunity: updated.opportunity,
          },
          { reason: "update" }
        ).catch((err) => {
          this.logger.error(
            `Failed to re-score AI feedback for updated project ${id}`,
            err
          );
        });
      } else {
        const { error: clearScoreError } = await supabase
          .from("projects")
          .update({ ai_score: null })
          .eq("id", id);
        if (clearScoreError) {
          this.logger.error(
            `Failed to clear ai_score for project ${id}`,
            clearScoreError
          );
        }
      }
    }

    return {
      success: true,
      data: projectResponse,
      message: "Project updated successfully",
    };
  }

  /**
   * Delete project (author or admin can delete)
   */
  async remove(id: string, userId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check project exists and get author info
    const { data: project } = await supabase
      .from("projects")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role, wallet")
      .eq("id", userId)
      .single();

    const isAdmin =
      user?.role === "admin" || user?.wallet === this.AI_BOT_WALLET;

    // Allow if user is author OR admin
    if (project.author_id !== userId && !isAdmin) {
      throw new ForbiddenException("You can only delete your own projects");
    }

    // Delete project
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    // Log if admin deleted someone else's project
    if (isAdmin && project.author_id !== userId) {
      this.logger.log(
        `Admin ${userId} deleted project ${id} (owner: ${project.author_id})`
      );
    }

    return {
      success: true,
      message: "Project deleted successfully",
    };
  }

  async listProposals(projectId: string): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from("proposals")
      .select(
        `id, project_id, proposer_id, title, description, status, onchain_tx, onchain_proposal_pubkey, onchain_create_tx, onchain_refs, execution_payload, created_at,
         proposer:users!proposals_proposer_id_fkey(id, username, wallet)`
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list proposals: ${error.message}`);
    }

    return { success: true, data: data || [] };
  }

  async createProposal(
    projectId: string,
    userId: string,
    dto: CreateProposalDto
  ): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: project } = await supabase
      .from("projects")
      .select("id, pool_status")
      .eq("id", projectId)
      .single();

    if (!project) throw new NotFoundException("Project not found");

    if (!["pool_open", "active"].includes(project.pool_status)) {
      throw new BadRequestException("Pool is not open yet");
    }

    try {
      new PublicKey(dto.onchainProposalPubkey);
    } catch {
      throw new BadRequestException("Invalid onchainProposalPubkey");
    }

    await this.assertConfirmedMainnetTx(dto.onchainCreateTx);

    const { data, error } = await supabase
      .from("proposals")
      .insert({
        project_id: projectId,
        proposer_id: userId,
        title: dto.title,
        description: dto.description,
        execution_payload: dto.executionPayload || null,
        onchain_proposal_pubkey: dto.onchainProposalPubkey,
        onchain_create_tx: dto.onchainCreateTx,
        onchain_refs: dto.onchainRefs || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create proposal: ${error.message}`);
    }

    return { success: true, data, message: "Proposal created" };
  }

  async createIdeaPool(
    projectId: string,
    userId: string,
    dto: CreateIdeaPoolDto
  ): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, type, title, votes, pool_status, proposal_pubkey, governance_realm_address"
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new NotFoundException("Project not found");
    }
    if (project.type !== "idea") {
      throw new BadRequestException("Decision pool is only supported for ideas");
    }
    if (project.proposal_pubkey && project.pool_status === "active") {
      throw new BadRequestException("Decision pool already active for this idea");
    }

    const reachedThreshold = Number(project.votes || 0) >= this.IDEA_POOL_VOTE_THRESHOLD;
    if (!reachedThreshold && !dto.sponsor) {
      throw new BadRequestException(
        `Idea needs ${this.IDEA_POOL_VOTE_THRESHOLD} upvotes or sponsor mode`
      );
    }

    let daoAddress = "";
    let proposalPubkey = "";
    let passPoolAddress = "";
    let failPoolAddress = "";
    try {
      daoAddress = new PublicKey(dto.daoAddress).toBase58();
      proposalPubkey = new PublicKey(dto.proposalPubkey).toBase58();
      passPoolAddress = new PublicKey(dto.passPoolAddress).toBase58();
      failPoolAddress = new PublicKey(dto.failPoolAddress).toBase58();
    } catch {
      throw new BadRequestException("Invalid pool/proposal pubkey in request body");
    }

    const createSignature = dto.poolCreateTx.trim();
    if (!createSignature) {
      throw new BadRequestException("poolCreateTx is required");
    }
    await this.assertConfirmedMainnetTx(createSignature);

    const { data: user } = await supabase
      .from("users")
      .select("wallet")
      .eq("id", userId)
      .single();

    const refs = {
      ...(dto.onchainRefs || {}),
      creatorUserId: userId,
      creatorWallet: user?.wallet || null,
      votesAtCreation: Number(project.votes || 0),
      threshold: this.IDEA_POOL_VOTE_THRESHOLD,
      sponsor: !!dto.sponsor,
    };

    const { data, error } = await supabase
      .from("projects")
      .update({
        pool_status: "active",
        governance_realm_address: daoAddress,
        governance_treasury_address: daoAddress,
        proposal_pubkey: proposalPubkey,
        pass_pool_address: passPoolAddress,
        fail_pool_address: failPoolAddress,
        pool_create_tx: createSignature,
        pool_finalize_tx: null,
        pool_refs: refs,
        final_decision: null,
        finalized_at: null,
        pool_created_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select(
        "id, title, pool_status, proposal_pubkey, pass_pool_address, fail_pool_address, pool_create_tx, pool_refs, governance_realm_address"
      )
      .single();

    if (error || !data) {
      throw new Error(`Failed to create idea pool mapping: ${error?.message}`);
    }

    return {
      success: true,
      data,
      message: "Decision pool created and mapped",
    };
  }

  async getIdeaMarketStats(projectId: string): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        "id, pool_status, proposal_pubkey, pass_pool_address, fail_pool_address, final_decision, finalized_at"
      )
      .eq("id", projectId)
      .single();

    if (error || !project) {
      throw new NotFoundException("Project not found");
    }

    const passPool = project.pass_pool_address;
    const failPool = project.fail_pool_address;

    if (!passPool || !failPool) {
      return {
        success: true,
        data: {
          poolStatus: project.pool_status || "none",
          passPoolAddress: passPool || null,
          failPoolAddress: failPool || null,
          passPoolBalance: 0,
          failPoolBalance: 0,
          passProbability: null,
          failProbability: null,
          finalDecision: project.final_decision || null,
          finalizedAt: project.finalized_at || null,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    const rpc =
      process.env.SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpc, "confirmed");
    const passPoolBalance = await this.getTokenAccountUiBalance(connection, passPool);
    const failPoolBalance = await this.getTokenAccountUiBalance(connection, failPool);
    const total = passPoolBalance + failPoolBalance;

    const passProbability = total > 0 ? passPoolBalance / total : null;
    const failProbability = total > 0 ? failPoolBalance / total : null;

    return {
      success: true,
      data: {
        poolStatus: project.pool_status || "none",
        proposalPubkey: project.proposal_pubkey || null,
        passPoolAddress: passPool,
        failPoolAddress: failPool,
        passPoolBalance,
        failPoolBalance,
        passProbability,
        failProbability,
        finalDecision: project.final_decision || null,
        finalizedAt: project.finalized_at || null,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Idea owner submits request to create DAO by proving SOL payment.
   * Required fee: $3 equivalent in SOL to admin/dev wallet.
   */
  async createDaoRequest(
    projectId: string,
    userId: string,
    dto: CreateDaoRequestDto
  ): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();
    const devWallet = this.AI_BOT_WALLET;
    const requiredUsd = 3;

    const { data: project } = await supabase
      .from("projects")
      .select("id, author_id, title")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.author_id !== userId) {
      throw new ForbiddenException("Only idea owner can request DAO creation");
    }

    const { data: requester } = await supabase
      .from("users")
      .select("wallet")
      .eq("id", userId)
      .single();

    if (!requester?.wallet) {
      throw new BadRequestException("Requester wallet not found");
    }

    const txProof = await this.verifyDaoRequestPayment(
      dto.txSignature,
      requester.wallet,
      devWallet,
      requiredUsd
    );

    const { data: inserted, error } = await supabase
      .from("dao_requests")
      .insert({
        project_id: projectId,
        requester_id: userId,
        tx_signature: dto.txSignature,
        from_wallet: txProof.fromWallet,
        to_wallet: txProof.toWallet,
        amount_sol: txProof.amountSol,
        amount_usd: txProof.amountUsd,
        required_usd: requiredUsd,
        status: "pending",
        note: dto.note || null,
      })
      .select("*")
      .single();

    if (error) {
      if ((error as any)?.message?.toLowerCase?.().includes("duplicate")) {
        throw new BadRequestException("This transaction was already used");
      }
      throw new Error(`Failed to create DAO request: ${error.message}`);
    }

    return {
      success: true,
      data: inserted,
      message: "DAO request submitted and pending admin approval",
    };
  }

  private async assertConfirmedMainnetTx(signature: string): Promise<void> {
    const rpc =
      process.env.SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpc, "confirmed");

    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
    if (!status.value) {
      throw new BadRequestException("onchain tx not found");
    }
    if (status.value.err) {
      throw new BadRequestException("onchain tx failed");
    }

    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx || tx.meta?.err) {
      throw new BadRequestException("onchain tx verification failed");
    }
  }

  private async getTokenAccountUiBalance(
    connection: Connection,
    tokenAccountAddress: string
  ): Promise<number> {
    try {
      const balance = await connection.getTokenAccountBalance(
        new PublicKey(tokenAccountAddress),
        "confirmed"
      );
      const amount = Number(balance.value.uiAmountString || 0);
      return Number.isFinite(amount) ? amount : 0;
    } catch {
      return 0;
    }
  }

  private async verifyDaoRequestPayment(
    txSignature: string,
    expectedFromWallet: string,
    expectedToWallet: string,
    requiredUsd: number
  ): Promise<{
    fromWallet: string;
    toWallet: string;
    amountSol: number;
    amountUsd: number;
  }> {
    const rpc =
      process.env.SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";

    const connection = new Connection(rpc, "confirmed");
    const tx = await connection.getParsedTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      throw new BadRequestException("Transaction not found on mainnet");
    }

    const expectedTo = new PublicKey(expectedToWallet).toBase58();
    const expectedFrom = new PublicKey(expectedFromWallet).toBase58();

    let lamports = 0;
    let fromWallet = "";

    for (const ix of tx.transaction.message.instructions as any[]) {
      if (ix?.program === "system" && ix?.parsed?.type === "transfer") {
        const info = ix.parsed.info;
        if (info?.destination === expectedTo && info?.source === expectedFrom) {
          lamports += Number(info.lamports || 0);
          fromWallet = info.source;
        }
      }
    }

    if (lamports <= 0) {
      throw new BadRequestException(
        `No valid SOL transfer from requester to ${expectedToWallet} found in tx`
      );
    }

    const amountSol = lamports / 1_000_000_000;
    const solPrice = await this.getSolUsdPrice();
    const amountUsd = amountSol * solPrice;

    if (amountUsd < requiredUsd) {
      throw new BadRequestException(
        `Transferred ${amountSol.toFixed(6)} SOL (~$${amountUsd.toFixed(
          2
        )}) which is below required $${requiredUsd}`
      );
    }

    return {
      fromWallet,
      toWallet: expectedTo,
      amountSol,
      amountUsd,
    };
  }

  private async getSolUsdPrice(): Promise<number> {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new BadRequestException("Failed to fetch SOL/USD price");
    }
    const json = (await res.json()) as any;
    const price = Number(json?.solana?.usd);
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException("Invalid SOL/USD price feed");
    }
    return price;
  }

  /**
   * Vote for project
   */
  async vote(
    id: string,
    userId: string
  ): Promise<ApiResponse<{ votes: number }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("project_votes")
      .select("*")
      .eq("project_id", id)
      .eq("user_id", userId)
      .single();

    if (existingVote) {
      return {
        success: false,
        error: "You already voted for this project",
      };
    }

    // Add vote
    await supabase
      .from("project_votes")
      .insert({ project_id: id, user_id: userId });

    // Increment vote count
    const { data: newVotes, error } = await supabase.rpc(
      "increment_project_votes",
      {
        project_id: id,
      }
    );

    if (error) {
      throw new Error(`Failed to vote: ${error.message}`);
    }

    return {
      success: true,
      data: { votes: newVotes },
      message: "Vote added successfully",
    };
  }
}
