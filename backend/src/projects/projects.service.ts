import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { QueryProjectsDto } from "./dto/query-projects.dto";
import { ApiResponse, Project } from "../shared/types";
import { AIService } from "../ai/ai.service";

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly AI_BOT_WALLET =
    "FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm";

  constructor(
    private supabaseService: SupabaseService,
    private aiService: AIService
  ) {}

  /**
   * Get all projects with filters
   */
  async findAll(query: QueryProjectsDto): Promise<ApiResponse<Project[]>> {
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
      };
    });

    return {
      success: true,
      data: projects,
    };
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
      is_anonymous: createDto.isAnonymous || false,
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
    }
  ): Promise<void> {
    this.logger.log(`Generating AI feedback for project ${projectId}`);

    try {
      // Spam filter: check content quality
      const minLength = 50; // Minimum total length
      const totalLength =
        (ideaData.problem || "").length + (ideaData.solution || "").length;

      if (totalLength < minLength) {
        this.logger.warn(
          `Skipping AI feedback for project ${projectId}: content too short (${totalLength} chars)`
        );
        return;
      }

      // Check for spam patterns
      const spamKeywords = ["test", "bla bla", "asdf", "qwerty", "...", "spam"];
      const content =
        `${ideaData.title} ${ideaData.problem} ${ideaData.solution}`.toLowerCase();
      const hasSpam = spamKeywords.some((keyword) => content.includes(keyword));

      if (hasSpam && totalLength < 100) {
        this.logger.warn(
          `Skipping AI feedback for project ${projectId}: likely spam content`
        );
        return;
      }

      // Generate AI feedback
      const feedback = await this.aiService.generateIdeaFeedback(ideaData);

      // Create AI comment
      const supabase = this.supabaseService.getAdminClient();

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
        commentContent += `\n\n**💪 Điểm mạnh:**\n${feedback.strengths
          .map((s) => `• ${s}`)
          .join("\n")}`;
      }

      if (feedback.weaknesses && feedback.weaknesses.length > 0) {
        commentContent += `\n\n**⚠️ Cần cải thiện:**\n${feedback.weaknesses
          .map((w) => `• ${w}`)
          .join("\n")}`;
      }

      if (feedback.suggestions && feedback.suggestions.length > 0) {
        commentContent += `\n\n**💡 Gợi ý:**\n${feedback.suggestions
          .map((s) => `• ${s}`)
          .join("\n")}`;
      }

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
      .select("author_id")
      .eq("id", id)
      .single();

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.author_id !== userId) {
      throw new ForbiddenException("You can only update your own projects");
    }

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
    if (updateDto.isAnonymous !== undefined)
      updateData.is_anonymous = updateDto.isAnonymous;

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
