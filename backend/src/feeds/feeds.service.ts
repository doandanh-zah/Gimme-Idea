import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { CreateFeedDto, UpdateFeedDto, AddFeedItemDto } from './dto/feed.dto';
import { ApiResponse } from '../shared/types';

export interface Feed {
  id: string;
  slug: string;
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
  visibility: 'private' | 'unlisted' | 'public';
  isFeatured: boolean;
  feedType: 'custom' | 'trending' | 'ai_top' | 'hidden_gems' | 'staff_picks';
  itemsCount: number;
  followersCount: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    username: string;
    wallet: string;
    avatar?: string;
  };
  isFollowing?: boolean;
}

export interface FeedItem {
  id: string;
  feedId: string;
  projectId: string;
  addedBy: string;
  note?: string;
  createdAt: string;
  project?: any; // Project details
  addedByUser?: {
    username: string;
    avatar?: string;
  };
}

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Create a new feed
   */
  async create(userId: string, dto: CreateFeedDto): Promise<ApiResponse<Feed>> {
    const supabase = this.supabaseService.getAdminClient();

    const newFeed = {
      creator_id: userId,
      name: dto.name,
      description: dto.description || null,
      cover_image: dto.coverImage || null,
      visibility: dto.visibility || 'public',
      feed_type: 'custom',
      items_count: 0,
      followers_count: 0,
    };

    const { data: feed, error } = await supabase
      .from('feeds')
      .insert(newFeed)
      .select(`
        *,
        creator:users!feeds_creator_id_fkey(username, wallet, avatar)
      `)
      .single();

    if (error) {
      this.logger.error('Failed to create feed:', error);
      throw new Error(`Failed to create feed: ${error.message}`);
    }

    return {
      success: true,
      data: this.mapFeed(feed),
      message: 'Feed created successfully',
    };
  }

  /**
   * Get all public feeds with optional filters
   */
  async findAll(options?: {
    featured?: boolean;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Feed[]>> {
    const supabase = this.supabaseService.getAdminClient();

    let query = supabase
      .from('feeds')
      .select(`
        *,
        creator:users!feeds_creator_id_fkey(username, wallet, avatar)
      `)
      .eq('visibility', 'public')
      .order('followers_count', { ascending: false });

    if (options?.featured) {
      query = query.eq('is_featured', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data: feeds, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch feeds: ${error.message}`);
    }

    // If user is logged in, check if they're following each feed
    let feedsWithFollowStatus = feeds.map(f => this.mapFeed(f));

    if (options?.userId) {
      const { data: following } = await supabase
        .from('feed_followers')
        .select('feed_id')
        .eq('user_id', options.userId);

      const followingIds = new Set(following?.map(f => f.feed_id) || []);
      feedsWithFollowStatus = feedsWithFollowStatus.map(feed => ({
        ...feed,
        isFollowing: followingIds.has(feed.id),
      }));
    }

    return {
      success: true,
      data: feedsWithFollowStatus,
    };
  }

  /**
   * Get user's created feeds
   */
  async findByUser(userId: string): Promise<ApiResponse<Feed[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: feeds, error } = await supabase
      .from('feeds')
      .select(`
        *,
        creator:users!feeds_creator_id_fkey(username, wallet, avatar)
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user feeds: ${error.message}`);
    }

    return {
      success: true,
      data: feeds.map(f => this.mapFeed(f)),
    };
  }

  /**
   * Get feeds user is following
   */
  async findFollowing(userId: string): Promise<ApiResponse<Feed[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: following, error } = await supabase
      .from('feed_followers')
      .select(`
        feed:feeds(
          *,
          creator:users!feeds_creator_id_fkey(username, wallet, avatar)
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch following feeds: ${error.message}`);
    }

    const feeds = following
      .filter(f => f.feed)
      .map(f => this.mapFeed(f.feed as any));

    return {
      success: true,
      data: feeds.map(f => ({ ...f, isFollowing: true })),
    };
  }

  /**
   * Get single feed by ID or slug
   */
  async findOne(feedIdOrSlug: string, userId?: string): Promise<ApiResponse<Feed>> {
    const supabase = this.supabaseService.getAdminClient();

    // Try to find by slug first, then by ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(feedIdOrSlug);
    
    let query = supabase
      .from('feeds')
      .select(`
        *,
        creator:users!feeds_creator_id_fkey(username, wallet, avatar)
      `);
    
    if (isUUID) {
      query = query.eq('id', feedIdOrSlug);
    } else {
      query = query.eq('slug', feedIdOrSlug);
    }

    const { data: feed, error } = await query.single();

    if (error || !feed) {
      throw new NotFoundException('Feed not found');
    }

    // Check access permissions
    const isOwner = userId && feed.creator_id === userId;
    
    // Private feeds are only accessible by owner
    if (feed.visibility === 'private' && !isOwner) {
      throw new ForbiddenException('This feed is private');
    }

    let mappedFeed = this.mapFeed(feed);

    // Check if user is following
    if (userId) {
      const { data: follower } = await supabase
        .from('feed_followers')
        .select('id')
        .eq('feed_id', feed.id)
        .eq('user_id', userId)
        .single();

      mappedFeed = {
        ...mappedFeed,
        isFollowing: !!follower,
      };
    }

    return {
      success: true,
      data: mappedFeed,
    };
  }

  /**
   * Update feed
   */
  async update(
    feedId: string,
    userId: string,
    dto: UpdateFeedDto
  ): Promise<ApiResponse<Feed>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check ownership
    const { data: feed } = await supabase
      .from('feeds')
      .select('creator_id')
      .eq('id', feedId)
      .single();

    if (!feed || feed.creator_id !== userId) {
      throw new ForbiddenException('Not authorized to update this feed');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.coverImage !== undefined) updateData.cover_image = dto.coverImage;
    if (dto.visibility) updateData.visibility = dto.visibility;

    const { data: updatedFeed, error } = await supabase
      .from('feeds')
      .update(updateData)
      .eq('id', feedId)
      .select(`
        *,
        creator:users!feeds_creator_id_fkey(username, wallet, avatar)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update feed: ${error.message}`);
    }

    return {
      success: true,
      data: this.mapFeed(updatedFeed),
      message: 'Feed updated successfully',
    };
  }

  /**
   * Delete feed
   */
  async delete(feedId: string, userId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check ownership
    const { data: feed } = await supabase
      .from('feeds')
      .select('creator_id')
      .eq('id', feedId)
      .single();

    if (!feed || feed.creator_id !== userId) {
      throw new ForbiddenException('Not authorized to delete this feed');
    }

    const { error } = await supabase.from('feeds').delete().eq('id', feedId);

    if (error) {
      throw new Error(`Failed to delete feed: ${error.message}`);
    }

    return {
      success: true,
      message: 'Feed deleted successfully',
    };
  }

  /**
   * Follow a feed
   */
  async follow(feedId: string, userId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase.from('feed_followers').insert({
      feed_id: feedId,
      user_id: userId,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: true, message: 'Already following' };
      }
      throw new Error(`Failed to follow feed: ${error.message}`);
    }

    return {
      success: true,
      message: 'Now following this feed',
    };
  }

  /**
   * Unfollow a feed
   */
  async unfollow(feedId: string, userId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from('feed_followers')
      .delete()
      .eq('feed_id', feedId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to unfollow feed: ${error.message}`);
    }

    return {
      success: true,
      message: 'Unfollowed this feed',
    };
  }

  /**
   * Add item (project/idea) to feed
   */
  async addItem(
    feedId: string,
    userId: string,
    dto: AddFeedItemDto
  ): Promise<ApiResponse<FeedItem>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user is owner
    const { data: feed } = await supabase
      .from('feeds')
      .select('creator_id')
      .eq('id', feedId)
      .single();

    if (feed?.creator_id !== userId) {
      throw new ForbiddenException('Not authorized to add items to this feed');
    }

    const { data: item, error } = await supabase
      .from('feed_items')
      .insert({
        feed_id: feedId,
        project_id: dto.projectId,
        added_by: userId,
        note: dto.note || null,
      })
      .select(`
        *,
        project:projects(id, title, description, type, category, votes, ai_score, image_url),
        added_by_user:users!feed_items_added_by_fkey(username, avatar)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'This idea is already in this feed',
        };
      }
      throw new Error(`Failed to add item: ${error.message}`);
    }

    return {
      success: true,
      data: this.mapFeedItem(item),
      message: 'Item added to feed',
    };
  }

  /**
   * Remove item from feed
   */
  async removeItem(
    feedId: string,
    itemId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check authorization
    const { data: item } = await supabase
      .from('feed_items')
      .select('added_by')
      .eq('id', itemId)
      .eq('feed_id', feedId)
      .single();

    const { data: feed } = await supabase
      .from('feeds')
      .select('creator_id')
      .eq('id', feedId)
      .single();

    if (!item || (item.added_by !== userId && feed?.creator_id !== userId)) {
      throw new ForbiddenException('Not authorized to remove this item');
    }

    const { error } = await supabase
      .from('feed_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to remove item: ${error.message}`);
    }

    return {
      success: true,
      message: 'Item removed from feed',
    };
  }

  /**
   * Get items in a feed
   */
  async getFeedItems(
    feedId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ApiResponse<FeedItem[]>> {
    const supabase = this.supabaseService.getAdminClient();

    let query = supabase
      .from('feed_items')
      .select(`
        *,
        project:projects(
          id, type, title, description, category, votes, feedback_count, 
          stage, tags, image_url, ai_score, created_at,
          author:users!projects_author_id_fkey(username, wallet, avatar)
        ),
        added_by_user:users!feed_items_added_by_fkey(username, avatar)
      `)
      .eq('feed_id', feedId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    const { data: items, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch feed items: ${error.message}`);
    }

    return {
      success: true,
      data: items.map(i => this.mapFeedItem(i)),
    };
  }

  /**
   * Get user's feeds for bookmark selection
   */
  async getUserFeedsForBookmark(
    userId: string,
    projectId: string
  ): Promise<ApiResponse<(Feed & { hasItem: boolean })[]>> {
    const supabase = this.supabaseService.getAdminClient();

    // Get user's feeds (created by them or member of)
    const { data: feeds, error } = await supabase
      .from('feeds')
      .select(`
        *,
        creator:users!feeds_creator_id_fkey(username, wallet, avatar)
      `)
      .or(`creator_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch feeds: ${error.message}`);
    }

    // Check which feeds already have this item
    const { data: existingItems } = await supabase
      .from('feed_items')
      .select('feed_id')
      .eq('project_id', projectId);

    const feedsWithItem = new Set(existingItems?.map(i => i.feed_id) || []);

    const result = feeds.map(f => ({
      ...this.mapFeed(f),
      hasItem: feedsWithItem.has(f.id),
    }));

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Map database feed to API response
   */
  private mapFeed(feed: any): Feed {
    const creator = Array.isArray(feed.creator) ? feed.creator[0] : feed.creator;
    return {
      id: feed.id,
      slug: feed.slug,
      creatorId: feed.creator_id,
      name: feed.name,
      description: feed.description,
      coverImage: feed.cover_image,
      visibility: feed.visibility || 'public',
      isFeatured: feed.is_featured,
      feedType: feed.feed_type,
      itemsCount: feed.items_count || 0,
      followersCount: feed.followers_count || 0,
      createdAt: feed.created_at,
      updatedAt: feed.updated_at,
      creator: creator
        ? {
            username: creator.username,
            wallet: creator.wallet,
            avatar: creator.avatar,
          }
        : undefined,
    };
  }

  /**
   * Map database feed item to API response
   */
  private mapFeedItem(item: any): FeedItem {
    const addedByUser = Array.isArray(item.added_by_user)
      ? item.added_by_user[0]
      : item.added_by_user;
    return {
      id: item.id,
      feedId: item.feed_id,
      projectId: item.project_id,
      addedBy: item.added_by,
      note: item.note,
      createdAt: item.created_at,
      project: item.project,
      addedByUser: addedByUser
        ? {
            username: addedByUser.username,
            avatar: addedByUser.avatar,
          }
        : undefined,
    };
  }
}
