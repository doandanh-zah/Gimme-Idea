import { IsUUID, IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class FollowUserDto {
  @IsUUID()
  userId: string;
}

export class GetFollowersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export interface FollowUser {
  userId: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  wallet: string;
  followersCount: number;
  followingCount: number;
  followedAt: string;
  isFollowingBack?: boolean;
  isFollowing?: boolean;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}
