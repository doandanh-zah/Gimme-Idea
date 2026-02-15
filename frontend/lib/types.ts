import React from "react";

export interface Comment {
  id: string;
  projectId: string;
  content: string;
  author?: {
    username: string;
    wallet: string;
    avatar?: string;
  } | null; // Nullable when isAnonymous
  likes: number;
  parentCommentId?: string; // For nested replies
  isAnonymous?: boolean;
  tipsAmount?: number; // Total tips received
  createdAt: string;
  // AI-related fields
  is_ai_generated?: boolean;
  ai_model?: string;
  ai_tokens_used?: number;
  // Frontend-only fields for compatibility
  timestamp?: string;
  dislikes?: number;
  tips?: number;
  replies?: Comment[];
}

export interface Project {
  id: string;
  type: "project" | "idea"; // Distinguish between fully formed projects and raw ideas
  title: string;
  slug?: string; // URL-friendly identifier
  description: string;
  category:
    | "DeFi"
    | "NFT"
    | "Gaming"
    | "Infrastructure"
    | "DAO"
    | "DePIN"
    | "Social"
    | "Mobile"
    | "Security";
  stage: "Idea" | "Prototype" | "Devnet" | "Mainnet";
  votes: number;
  feedbackCount: number;
  tags: string[];
  createdAt: string;
  comments?: Comment[];

  // Project specific fields
  image?: string;
  website?: string;
  bounty?: number;

  // Idea specific fields (Long text)
  problem?: string;
  opportunity?: string;
  solution?: string;
  goMarket?: string;
  teamInfo?: string;
  isAnonymous?: boolean;

  author: {
    username: string; // If anonymous idea, this is hidden in UI
    wallet: string;
    avatar?: string;
  } | null; // Null for anonymous projects/ideas

  // ============================================
  // Commit-to-Build (Phase 1) - Governance/Pool metadata
  // ============================================
  poolStatus?: 'draft' | 'reviewing' | 'approved_for_pool' | 'pool_open' | 'rejected' | string;
  governanceRealmAddress?: string;
  governanceTreasuryAddress?: string;
  governanceReceiptMint?: string;
  supportFeeBps?: number; // e.g. 50 = 0.5%
  supportFeeCapUsdc?: number; // e.g. 20
  supportFeeRecipient?: string; // dev wallet
  poolCreatedAt?: string;
  poolCreatedBy?: string;
}

export interface User {
  id?: string; // Database user ID (returned from backend)
  wallet: string;
  username: string;
  slug?: string; // URL-friendly identifier
  reputation: number;
  balance: number; // USDC
  projects: string[]; // Project IDs
  avatar?: string;
  coverImage?: string; // Profile cover/banner image
  bio?: string;
  socials?: {
    twitter?: string;
    github?: string;
    telegram?: string;
    facebook?: string;
  };
  // Email auth fields
  email?: string;
  authProvider?: "wallet" | "google";
  authId?: string;
  needsWalletConnect?: boolean;
  role?: "user" | "admin" | "moderator";
  // Follow system
  followersCount?: number;
  followingCount?: number;
}

export type NotificationType =
  | "follow"
  | "new_post"
  | "comment"
  | "comment_reply"
  | "like"
  | "comment_like"
  | "donation"
  | "mention";

export interface Notification {
  id: string;
  actorId: string | null;
  actorUsername: string | null;
  actorAvatar: string | null;
  type: NotificationType;
  title: string;
  message: string;
  targetType: "project" | "comment" | "user" | null;
  targetId: string | null;
  metadata?: {
    amount?: number;
    tx_hash?: string;
  };
  read: boolean;
  createdAt: string;
}

export interface StatMetric {
  label: string;
  value: string;
  trend?: string;
  icon?: React.ReactNode;
}

export interface JourneyStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// ============================================
// AI-related types
// ============================================

export interface AIFeedback {
  comment: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface MarketAssessment {
  score: number;
  assessmentText: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketSize: "small" | "medium" | "large";
  competitionLevel: "low" | "medium" | "high";
}

export interface AIQuota {
  canUse: boolean;
  freeRemaining: number;
  paidCredits: number;
  interactionsUsed: number;
  maxFreeInteractions: number;
}

// ============================================
// GmiFeeds Types
// ============================================

export interface Feed {
  id: string;
  slug: string;
  creatorId: string;
  name: string;
  description?: string;
  coverImage?: string;
  visibility: "private" | "unlisted" | "public";
  isFeatured: boolean;
  feedType: "custom" | "trending" | "ai_top" | "hidden_gems" | "staff_picks";
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
  hasItem?: boolean; // For bookmark modal
}

export interface FeedItem {
  id: string;
  feedId: string;
  projectId: string;
  addedBy: string;
  note?: string;
  createdAt: string;
  project?: Project;
  addedByUser?: {
    username: string;
    avatar?: string;
  };
}

// ============================================
// Follow System Types
// ============================================

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
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}
