import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiResponse, Project } from '../shared/types';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  /**
   * GET /api/projects
   * Get all projects with filters
   */
  @Get()
  async findAll(@Query() query: QueryProjectsDto): Promise<ApiResponse<Project[]>> {
    return this.projectsService.findAll(query);
  }

  /**
   * GET /api/projects/recommended
   * Get top recommended ideas based on AI score
   */
  @Get('recommended')
  async getRecommended(
    @Query('limit') limit?: number,
    @Query('category') category?: string
  ): Promise<ApiResponse<Project[]>> {
    return this.projectsService.getRecommendedIdeas(limit || 3, category);
  }

  /**
   * GET /api/projects/:id
   * Get single project by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<Project>> {
    return this.projectsService.findOne(id);
  }

  /**
   * POST /api/projects
   * Create new project (requires authentication)
   */
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateProjectDto
  ): Promise<ApiResponse<Project>> {
    return this.projectsService.create(userId, createDto);
  }

  /**
   * PATCH /api/projects/:id
   * Update project (requires authentication)
   */
  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateDto: UpdateProjectDto
  ): Promise<ApiResponse<Project>> {
    return this.projectsService.update(id, userId, updateDto);
  }

  /**
   * DELETE /api/projects/:id
   * Delete project (requires authentication)
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ): Promise<ApiResponse<void>> {
    return this.projectsService.remove(id, userId);
  }

  /**
   * POST /api/projects/:id/vote
   * Vote for project (requires authentication)
   */
  @Post(':id/vote')
  @UseGuards(AuthGuard)
  async vote(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ): Promise<ApiResponse<{ votes: number }>> {
    return this.projectsService.vote(id, userId);
  }
}
