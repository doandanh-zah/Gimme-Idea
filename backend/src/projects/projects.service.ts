import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { ApiResponse, Project } from '../shared/types';

@Injectable()
export class ProjectsService {
  constructor(private supabaseService: SupabaseService) {}

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

    // Apply sorting
    const sortColumn = query.sortBy === 'feedbackCount' ? 'feedback_count' : query.sortBy;
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
      title: p.title,
      description: p.description,
      category: p.category,
      votes: p.votes || 0,
      feedbackCount: p.feedback_count || 0,
      stage: p.stage,
      tags: p.tags || [],
      author: {
        username: p.author.username,
        wallet: p.author.wallet,
        avatar: p.author.avatar,
      },
      bounty: p.bounty,
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

    const projectResponse: Project = {
      id: project.id,
      title: project.title,
      description: project.description,
      category: project.category,
      votes: project.votes || 0,
      feedbackCount: project.feedback_count || 0,
      stage: project.stage,
      tags: project.tags || [],
      author: {
        username: project.author.username,
        wallet: project.author.wallet,
        avatar: project.author.avatar,
      },
      bounty: project.bounty,
      createdAt: project.created_at,
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
      author_id: userId,
      title: createDto.title,
      description: createDto.description,
      category: createDto.category,
      stage: createDto.stage,
      tags: createDto.tags,
      bounty: createDto.bounty || 0,
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
      title: project.title,
      description: project.description,
      category: project.category,
      votes: project.votes || 0,
      feedbackCount: project.feedback_count || 0,
      stage: project.stage,
      tags: project.tags || [],
      author: {
        username: project.author.username,
        wallet: project.author.wallet,
        avatar: project.author.avatar,
      },
      bounty: project.bounty,
      createdAt: project.created_at,
    };

    return {
      success: true,
      data: projectResponse,
      message: 'Project created successfully',
    };
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

    // Update project
    const { data: updated, error } = await supabase
      .from('projects')
      .update({
        title: updateDto.title,
        description: updateDto.description,
        category: updateDto.category,
        stage: updateDto.stage,
        tags: updateDto.tags,
        bounty: updateDto.bounty,
      })
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
      title: updated.title,
      description: updated.description,
      category: updated.category,
      votes: updated.votes || 0,
      feedbackCount: updated.feedback_count || 0,
      stage: updated.stage,
      tags: updated.tags || [],
      author: {
        username: updated.author.username,
        wallet: updated.author.wallet,
        avatar: updated.author.avatar,
      },
      bounty: updated.bounty,
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
