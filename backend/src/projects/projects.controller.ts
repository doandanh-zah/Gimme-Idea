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
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { QueryProjectsDto } from "./dto/query-projects.dto";
import { CreateDaoRequestDto } from "./dto/create-dao-request.dto";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { CreateIdeaPoolDto } from "./dto/create-idea-pool.dto";
import { ApiTokensService } from "../api-tokens/api-tokens.service";
import { RequirePatScope } from "../common/decorators/require-pat-scope.decorator";
import { AnyAuthGuard } from "../common/guards/any-auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";
import { PatScopeGuard } from "../common/guards/pat-scope.guard";
import { CacheControlInterceptor } from "../common/interceptors/cache-control.interceptor";
import { ApiResponse, Project } from "../shared/types";

@Controller("projects")
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private apiTokensService: ApiTokensService
  ) {}

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
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("post:write")
  async create(
    @Req() req: any,
    @CurrentUser("userId") userId: string,
    @Body() createDto: CreateProjectDto
  ): Promise<ApiResponse<Project>> {
    const result = await this.projectsService.create(userId, createDto);

    await this.apiTokensService.auditPatAction(req, {
      action: "project.create",
      resourceType: createDto.type || "project",
      resourceId: result.data?.id,
      metadata: {
        type: createDto.type || "project",
        category: createDto.category,
        stage: createDto.stage,
      },
    });

    return result;
  }

  /**
   * PATCH /api/projects/:id
   * Update project (requires authentication)
   */
  @Patch(":id")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("post:write")
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() updateDto: UpdateProjectDto
  ): Promise<ApiResponse<Project>> {
    const result = await this.projectsService.update(id, userId, updateDto);

    await this.apiTokensService.auditPatAction(req, {
      action: "project.update",
      resourceType: "project",
      resourceId: id,
      metadata: {
        updatedFields: Object.keys(updateDto || {}),
      },
    });

    return result;
  }

  /**
   * DELETE /api/projects/:id
   * Delete project (requires authentication)
   */
  @Delete(":id")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("post:write")
  async remove(
    @Req() req: any,
    @Param("id") id: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<void>> {
    const result = await this.projectsService.remove(id, userId);

    await this.apiTokensService.auditPatAction(req, {
      action: "project.delete",
      resourceType: "project",
      resourceId: id,
    });

    return result;
  }

  /**
   * POST /api/projects/:id/vote
   * Vote for project (requires authentication)
   */
  @Post(":id/vote")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("post:write")
  async vote(
    @Req() req: any,
    @Param("id") id: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<{ votes: number }>> {
    const result = await this.projectsService.vote(id, userId);

    await this.apiTokensService.auditPatAction(req, {
      action: "project.vote",
      resourceType: "project",
      resourceId: id,
      metadata: {
        votes: result.data?.votes,
      },
    });

    return result;
  }

  /**
   * POST /api/projects/:id/dao-request
   * Idea owner submits Create-DAO request with tx proof
   */
  @Post(":id/dao-request")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("post:write")
  async createDaoRequest(
    @Req() req: any,
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateDaoRequestDto
  ): Promise<ApiResponse<any>> {
    const result = await this.projectsService.createDaoRequest(id, userId, dto);

    await this.apiTokensService.auditPatAction(req, {
      action: "project.dao_request.create",
      resourceType: "dao_request",
      resourceId: result.data?.id || id,
      metadata: {
        projectId: id,
        txSignature: dto.txSignature,
      },
    });

    return result;
  }

  @Get(":id/proposals")
  async listProposals(@Param("id") id: string): Promise<ApiResponse<any[]>> {
    return this.projectsService.listProposals(id);
  }

  @Post(":id/proposals")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("post:write")
  async createProposal(
    @Req() req: any,
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateProposalDto
  ): Promise<ApiResponse<any>> {
    const result = await this.projectsService.createProposal(id, userId, dto);

    await this.apiTokensService.auditPatAction(req, {
      action: "project.proposal.create",
      resourceType: "proposal",
      resourceId: result.data?.id,
      metadata: {
        projectId: id,
        onchainProposalPubkey: dto.onchainProposalPubkey,
      },
    });

    return result;
  }

  @Post(":id/create-pool")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("post:write")
  async createIdeaPool(
    @Req() req: any,
    @Param("id") id: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateIdeaPoolDto
  ): Promise<ApiResponse<any>> {
    const result = await this.projectsService.createIdeaPool(id, userId, dto);

    await this.apiTokensService.auditPatAction(req, {
      action: "project.pool.create",
      resourceType: "idea_pool",
      resourceId: id,
      metadata: {
        projectId: id,
        proposalPubkey: dto.proposalPubkey,
        sponsor: !!dto.sponsor,
      },
    });

    return result;
  }

  @Get(":id/market-stats")
  async getIdeaMarketStats(
    @Param("id") id: string
  ): Promise<ApiResponse<any>> {
    return this.projectsService.getIdeaMarketStats(id);
  }
}
