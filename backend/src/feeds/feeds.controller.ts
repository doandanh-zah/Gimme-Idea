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
} from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { AnyAuthGuard } from '../common/guards/any-auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { RequirePatScope } from '../common/decorators/require-pat-scope.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { PatScopeGuard } from '../common/guards/pat-scope.guard';
import { CreateFeedDto, UpdateFeedDto, AddFeedItemDto } from './dto/feed.dto';
import { ApiResponse } from '../shared/types';

@Controller('feeds')
export class FeedsController {
  constructor(private feedsService: FeedsService) {}

  /**
   * GET /api/feeds
   * Get all public feeds
   */
  @Get()
  @UseGuards(OptionalAuthGuard)
  async findAll(
    @Query('featured') featured?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser('userId') userId?: string
  ) {
    return this.feedsService.findAll({
      featured: featured === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      userId,
    });
  }

  /**
   * GET /api/feeds/discover
   * Get featured/system feeds for discovery
   */
  @Get('discover')
  @UseGuards(OptionalAuthGuard)
  async discover(@CurrentUser('userId') userId?: string) {
    return this.feedsService.findAll({
      featured: true,
      userId,
      limit: 10,
    });
  }

  /**
   * GET /api/feeds/my
   * Get current user's created feeds
   */
  @Get('my')
  @UseGuards(AuthGuard)
  async getMyFeeds(@CurrentUser('userId') userId: string) {
    return this.feedsService.findByUser(userId);
  }

  /**
   * GET /api/feeds/user/:userId
   * Get a specific user's public feeds
   */
  @Get('user/:userId')
  async getUserPublicFeeds(@Param('userId') userId: string) {
    return this.feedsService.findPublicByUser(userId);
  }

  /**
   * GET /api/feeds/following
   * Get feeds current user is following
   */
  @Get('following')
  @UseGuards(AuthGuard)
  async getFollowingFeeds(@CurrentUser('userId') userId: string) {
    return this.feedsService.findFollowing(userId);
  }

  /**
   * GET /api/feeds/for-bookmark/:projectId
   * Get user's feeds to show in bookmark modal
   */
  @Get('for-bookmark/:projectId')
  @UseGuards(AuthGuard)
  async getFeedsForBookmark(
    @CurrentUser('userId') userId: string,
    @Param('projectId') projectId: string
  ) {
    return this.feedsService.getUserFeedsForBookmark(userId, projectId);
  }

  /**
   * GET /api/feeds/:id
   * Get single feed by ID
   */
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId?: string
  ) {
    return this.feedsService.findOne(id, userId);
  }

  /**
   * GET /api/feeds/:id/items
   * Get items in a feed
   */
  @Get(':id/items')
  async getFeedItems(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.feedsService.getFeedItems(id, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * POST /api/feeds
   * Create a new feed
   */
  @Post()
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope('feed:write')
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateFeedDto
  ) {
    return this.feedsService.create(userId, dto);
  }

  /**
   * PATCH /api/feeds/:id
   * Update a feed
   */
  @Patch(':id')
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope('feed:write')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFeedDto
  ) {
    return this.feedsService.update(id, userId, dto);
  }

  /**
   * DELETE /api/feeds/:id
   * Delete a feed
   */
  @Delete(':id')
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope('feed:write')
  async delete(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string
  ) {
    return this.feedsService.delete(id, userId);
  }

  /**
   * POST /api/feeds/:id/follow
   * Follow a feed
   */
  @Post(':id/follow')
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope('feed:write')
  async follow(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string
  ) {
    return this.feedsService.follow(id, userId);
  }

  /**
   * DELETE /api/feeds/:id/follow
   * Unfollow a feed
   */
  @Delete(':id/follow')
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope('feed:write')
  async unfollow(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string
  ) {
    return this.feedsService.unfollow(id, userId);
  }

  /**
   * POST /api/feeds/:id/items
   * Add item to feed (bookmark)
   */
  @Post(':id/items')
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope('feed:write')
  async addItem(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: AddFeedItemDto
  ) {
    return this.feedsService.addItem(id, userId, dto);
  }

  /**
   * DELETE /api/feeds/:id/items/:itemId
   * Remove item from feed
   */
  @Delete(':id/items/:itemId')
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope('feed:write')
  async removeItem(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string
  ) {
    return this.feedsService.removeItem(id, itemId, userId);
  }
}
