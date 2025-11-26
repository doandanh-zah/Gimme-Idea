import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { ApiResponse, Project } from '../shared/types';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly AI_BOT_WALLET = 'GimmeAI1111111111111111111111111111111111111';

  constructor(
    private supabaseService: SupabaseService,
    private aiService: AIService,
  ) {}

  /**
   * Get all projects with filters
   */
  async findAll(query: QueryProjectsDto): Promise<ApiResponse<Project[]>> {
    const supabase = this.supabaseService.getAdminClient();

    let supabaseQuery = supabase
      .from('projects')
      .select(`
        *,
        author:users!projects_author_id_fkey(
          username,
          wallet,
          avatar
        )
      `);

    // Apply filters
    if (query.type) {
      supabaseQuery = supabaseQuery.eq('type', query.type);
    }

    if (query.category) {
      supabaseQuery = supabaseQuery.eq('category', query.category);
    }

    if (query.stage) {
      supabaseQuery = supabaseQuery.eq('stage', query.stage);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      );
    }

    // Apply sorting (convert camelCase to snake_case for database columns)
    const sortColumnMap = {
      feedbackCount: 'feedback_count',
      createdAt: 'created_at',
      votes: 'votes'
    };
    const sortColumn = sortColumnMap[query.sortBy] || query.sortBy;
    supabaseQuery = supabaseQuery.order(sortColumn, { ascending: query.sortOrder === 'asc' });

    // Apply pagination
    supabaseQuery = supabaseQuery.range(query.offset, query.offset + query.limit - 1);

    const { data, error } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    // Map database results to Project type
    const projects: Project[] = data.map(p => ({
      id: p.id,
      type: p.type || 'project',
      title: p.title,
      description: p.description,
      category: p.category,
      votes: p.votes || 0,
      feedbackCount: p.feedback_count || 0,
      stage: p.stage,
      tags: p.tags || [],
      website: p.website,
      author: p.is_anonymous ? null : {
        username: p.author.username,
        wallet: p.author.wallet,
        avatar: p.author.avatar,
      },
      bounty: p.bounty,
      imageUrl: p.image_url,
      // Idea-specific fields
      problem: p.problem,
      solution: p.solution,
      opportunity: p.opportunity,
      goMarket: p.go_market,
      teamInfo: p.team_info,
      isAnonymous: p.is_anonymous,
      createdAt: p.created_at,
    }));

    return {
      success: true,
      data: projects,
    };
  }

  /**
   * Get single project by ID
   */
  async findOne(id: string): Promise<ApiResponse<Project>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        author:users!projects_author_id_fkey(
          username,
          wallet,
          avatar
        )
      `)
      .eq('id', id)
      .single();

    if (error || !project) {
      throw new NotFoundException('Project not found');
    }

    // Fetch comments for this project
    const { data: comments } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_user_id_fkey(
          username,
          wallet,
          avatar
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    const projectResponse: Project = {
      id: project.id,
      type: project.type || 'project',
      title: project.title,
      description: project.description,
      category: project.category,
      votes: project.votes || 0,
      feedbackCount: project.feedback_count || 0,
      stage: project.stage,
      tags: project.tags || [],
      website: project.website,
      author: project.is_anonymous ? null : {
        username: project.author.username,
        wallet: project.author.wallet,
        avatar: project.author.avatar,
      },
      bounty: project.bounty,
      imageUrl: project.image_url,
      // Idea-specific fields
      problem: project.problem,
      solution: project.solution,
      opportunity: project.opportunity,
      goMarket: project.go_market,
      teamInfo: project.team_info,
      isAnonymous: project.is_anonymous,
      createdAt: project.created_at,
      // Include comments
      comments: comments ? comments.map(c => ({
        id: c.id,
        projectId: c.project_id,
        content: c.content,
        author: c.is_anonymous ? null : {
          username: c.author.username,
          wallet: c.author.wallet,
          avatar: c.author.avatar,
        },
        likes: c.likes || 0,
        parentCommentId: c.parent_comment_id,
        isAnonymous: c.is_anonymous,
        tipsAmount: c.tips_amount || 0,
        createdAt: c.created_at,
      })) : [],
    };

    return {
      success: true,
      data: projectResponse,
    };
  }

  /**
   * Create new project
   */
  async create(userId: string, createDto: CreateProjectDto): Promise<ApiResponse<Project>> {
    const supabase = this.supabaseService.getAdminClient();

    const newProject = {
      type: createDto.type || 'project',
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
      go_market: createDto.goMarket,
      team_info: createDto.teamInfo,
      is_anonymous: createDto.isAnonymous || false,
      votes: 0,
      feedback_count: 0,
      created_at: new Date().toISOString(),
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select(`
        *,
        author:users!projects_author_id_fkey(
          username,
          wallet,
          avatar
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    const projectResponse: Project = {
      id: project.id,
      type: project.type || 'project',
      title: project.title,
      description: project.description,
      category: project.category,
      votes: project.votes || 0,
      feedbackCount: project.feedback_count || 0,
      stage: project.stage,
      tags: project.tags || [],
      website: project.website,
      author: project.is_anonymous ? null : {
        username: project.author.username,
        wallet: project.author.wallet,
        avatar: project.author.avatar,
      },
      bounty: project.bounty,
      imageUrl: project.image_url,
      // Idea-specific fields
      problem: project.problem,
      solution: project.solution,
      opportunity: project.opportunity,
      goMarket: project.go_market,
      teamInfo: project.team_info,
      isAnonymous: project.is_anonymous,
      createdAt: project.created_at,
    };

    // Auto-generate AI feedback for ideas (async, don't wait)
    if (project.type === 'idea' && project.problem && project.solution) {
      this.generateAIFeedbackAsync(project.id, {
        title: project.title,
        problem: project.problem,
        solution: project.solution,
        opportunity: project.opportunity,
        goMarket: project.go_market,
        teamInfo: project.team_info,
      }).catch(err => {
        this.logger.error(`Failed to generate AI feedback for project ${project.id}`, err);
      });
    }

    return {
      success: true,
      data: projectResponse,
      message: 'Project created successfully',
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
      goMarket?: string;
      teamInfo?: string;
    },
  ): Promise<void> {
    this.logger.log(`Generating AI feedback for project ${projectId}`);

    try {
      // Generate AI feedback
      const feedback = await this.aiService.generateIdeaFeedback(ideaData);

      // Create AI comment
      const supabase = this.supabaseService.getAdminClient();

      // First, get or create AI bot user
      let { data: aiUser } = await supabase
        .from('users')
        .select('id')
        .eq('wallet', this.AI_BOT_WALLET)
        .single();

      if (!aiUser) {
        // Create AI bot user
        const { data: newAiUser, error: createError } = await supabase
          .from('users')
          .insert({
            wallet: this.AI_BOT_WALLET,
            username: 'AI Assistant',
            avatar: null,
          })
          .select('id')
          .single();

        if (createError) {
          this.logger.error('Failed to create AI bot user', createError);
          return;
        }
        aiUser = newAiUser;
      }

      // Create comment with AI feedback
      const commentContent = `**AI Assessment (Score: ${feedback.score}/100)**\n\n${feedback.comment}\n\n**Strengths:**\n${feedback.strengths.map(s => `• ${s}`).join('\n')}\n\n**Areas for Improvement:**\n${feedback.weaknesses.map(w => `• ${w}`).join('\n')}\n\n**Suggestions:**\n${feedback.suggestions.map(s => `• ${s}`).join('\n')}`;

      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          project_id: projectId,
          user_id: aiUser.id,
          content: commentContent,
          is_anonymous: false,
          likes: 0,
          tips_amount: 0,
          is_ai_generated: true,
          ai_model: 'gpt-4o-mini',
          ai_tokens_used: 0, // TODO: track actual tokens
          created_at: new Date().toISOString(),
        });

      if (commentError) {
        this.logger.error('Failed to create AI comment', commentError);
      } else {
        this.logger.log(`AI feedback comment created for project ${projectId}`);
      }
    } catch (error) {
      this.logger.error(`AI feedback generation failed for project ${projectId}`, error);
    }
  }

  /**
   * Update project
   */
  async update(id: string, userId: string, updateDto: UpdateProjectDto): Promise<ApiResponse<Project>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user is the author
    const { data: project } = await supabase
      .from('projects')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.author_id !== userId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    // Update project - Only update fields that are provided
    const updateData: any = {};
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.category !== undefined) updateData.category = updateDto.category;
    if (updateDto.stage !== undefined) updateData.stage = updateDto.stage;
    if (updateDto.tags !== undefined) updateData.tags = updateDto.tags;
    if (updateDto.website !== undefined) updateData.website = updateDto.website;
    if (updateDto.bounty !== undefined) updateData.bounty = updateDto.bounty;
    if (updateDto.imageUrl !== undefined) updateData.image_url = updateDto.imageUrl;
    // Idea-specific fields
    if (updateDto.problem !== undefined) updateData.problem = updateDto.problem;
    if (updateDto.solution !== undefined) updateData.solution = updateDto.solution;
    if (updateDto.opportunity !== undefined) updateData.opportunity = updateDto.opportunity;
    if (updateDto.goMarket !== undefined) updateData.go_market = updateDto.goMarket;
    if (updateDto.teamInfo !== undefined) updateData.team_info = updateDto.teamInfo;
    if (updateDto.isAnonymous !== undefined) updateData.is_anonymous = updateDto.isAnonymous;

    const { data: updated, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        author:users!projects_author_id_fkey(
          username,
          wallet,
          avatar
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    const projectResponse: Project = {
      id: updated.id,
      type: updated.type || 'project',
      title: updated.title,
      description: updated.description,
      category: updated.category,
      votes: updated.votes || 0,
      feedbackCount: updated.feedback_count || 0,
      stage: updated.stage,
      tags: updated.tags || [],
      website: updated.website,
      author: updated.is_anonymous ? null : {
        username: updated.author.username,
        wallet: updated.author.wallet,
        avatar: updated.author.avatar,
      },
      bounty: updated.bounty,
      imageUrl: updated.image_url,
      // Idea-specific fields
      problem: updated.problem,
      solution: updated.solution,
      opportunity: updated.opportunity,
      goMarket: updated.go_market,
      teamInfo: updated.team_info,
      isAnonymous: updated.is_anonymous,
      createdAt: updated.created_at,
    };

    return {
      success: true,
      data: projectResponse,
      message: 'Project updated successfully',
    };
  }

  /**
   * Delete project
   */
  async remove(id: string, userId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user is the author
    const { data: project } = await supabase
      .from('projects')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.author_id !== userId) {
      throw new ForbiddenException('You can only delete your own projects');
    }

    // Delete project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    return {
      success: true,
      message: 'Project deleted successfully',
    };
  }

  /**
   * Vote for project
   */
  async vote(id: string, userId: string): Promise<ApiResponse<{ votes: number }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('project_votes')
      .select('*')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      return {
        success: false,
        error: 'You already voted for this project',
      };
    }

    // Add vote
    await supabase
      .from('project_votes')
      .insert({ project_id: id, user_id: userId });

    // Increment vote count
    const { data: newVotes, error } = await supabase.rpc('increment_project_votes', {
      project_id: id,
    });

    if (error) {
      throw new Error(`Failed to vote: ${error.message}`);
    }

    return {
      success: true,
      data: { votes: newVotes },
      message: 'Vote added successfully',
    };
  }
}
