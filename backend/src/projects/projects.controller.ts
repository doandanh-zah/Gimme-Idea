import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { QueryProjectsDto } from "./dto/query-projects.dto";
import { CreateDaoRequestDto } from "./dto/create-dao-request.dto";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { CreateIdeaPoolDto } from "./dto/create-idea-pool.dto";
import { AnyAuthGuard } from "../common/guards/any-auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";
import { CacheControlInterceptor } from "../common/interceptors/cache-control.interceptor";
import { ApiResponse, Project } from "../shared/types";

@Controller("projects")
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  /**
   * GET /api/projects
   * Get all projects with filters
   * Cached for 2 minutes at edge
   */
  @Get()
  @UseInterceptors(new CacheControlInterceptor(120, 60)) // 2 min cache, 1 min stale
  async findAll(
    @Query() query: QueryProjectsDto
  ): Promise<ApiResponse<Project[]>> {
    return this.projectsService.findAll(query);
  }

  /**
   * GET /api/projects/recommended
   * Get top recommended ideas based on AI score
   * Cached for 5 minutes at edge
   */
  @Get("recommended")
  @UseInterceptors(new CacheControlInterceptor(300, 60)) // 5 min cache, 1 min stale
  async getRecommended(
    @Query("limit") limit?: number,
    @Query("category") category?: string
  ): Promise<ApiResponse<Project[]>> {
    return this.projectsService.getRecommendedIdeas(limit || 3, category);
  }

  /**
   * GET /api/projects/:id
   * Get single project by ID
   * Cached for 1 minute at edge
   */
  @Get(":id")
  @UseInterceptors(new CacheControlInterceptor(60, 30)) // 1 min cache, 30s stale
  async findOne(@Param("id") id: string): Promise<ApiResponse<Project>> {
    return this.projectsService.findOne(id);
  }

  /**
   * POST /api/projects
   * Create new project (requires authentication)
   */
  @Post()
  @UseGuards(AnyAuthGuard)
  async create(
    @Req() req: any,
    @CurrentUser("userId") userId: string,
    @Body() createDto: CreateProjectDto
  ): Promise<ApiResponse<Project>> {
    // TODO: add audit log for PAT once audit table is deployed
    return this.projectsService.create(userId, createDto);
  }

  /**
   * PATCH /api/projects/:id
   * Update project (requires authentication)
   */
  @Patch(":id")
  @UseGuards(AnyAuthGuard)
  async update(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() updateDto: UpdateProjectDto
  ): Promise<ApiResponse<Project>> {
    return this.projectsService.update(id, userId, updateDto);
  }

  /**
   * DELETE /api/projects/:id
   * Delete project (requires authentication)
   */
  @Delete(":id")
  @UseGuards(AnyAuthGuard)
  async remove(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<void>> {
    return this.projectsService.remove(id, userId);
  }

  /**
   * POST /api/projects/:id/vote
   * Vote for project (requires authentication)
   */
  @Post(":id/vote")
  @UseGuards(AnyAuthGuard)
  async vote(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<{ votes: number }>> {
    return this.projectsService.vote(id, userId);
  }

  /**
   * POST /api/projects/:id/dao-request
   * Idea owner submits Create-DAO request with tx proof
   */
  @Post(":id/dao-request")
  @UseGuards(AnyAuthGuard)
  async createDaoRequest(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateDaoRequestDto
  ): Promise<ApiResponse<any>> {
    return this.projectsService.createDaoRequest(id, userId, dto);
  }

  @Get(":id/proposals")
  async listProposals(@Param("id") id: string): Promise<ApiResponse<any[]>> {
    return this.projectsService.listProposals(id);
  }

  @Post(":id/proposals")
  @UseGuards(AnyAuthGuard)
  async createProposal(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateProposalDto
  ): Promise<ApiResponse<any>> {
    return this.projectsService.createProposal(id, userId, dto);
  }

  @Post(":id/create-pool")
  @UseGuards(AnyAuthGuard)
  async createIdeaPool(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateIdeaPoolDto
  ): Promise<ApiResponse<any>> {
    return this.projectsService.createIdeaPool(id, userId, dto);
  }

  @Get(":id/market-stats")
  async getIdeaMarketStats(
    @Param("id") id: string
  ): Promise<ApiResponse<any>> {
    return this.projectsService.getIdeaMarketStats(id);
  }
}
