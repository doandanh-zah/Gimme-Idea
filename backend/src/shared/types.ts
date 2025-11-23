// Shared types - Synced with frontend/types.ts
// IMPORTANT: Keep this file in sync with frontend types

export interface Project {
  id: string;
  type?: 'project' | 'idea';
  title: string;
  description: string;
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure' | 'DAO';
  votes: number;
  feedbackCount: number;
  stage: 'Idea' | 'Prototype' | 'Devnet' | 'Mainnet';
  tags: string[];
  website?: string;
  author?: {
    username: string;
    wallet: string;
    avatar?: string;
  } | null; // Nullable when isAnonymous
  bounty?: number;
  imageUrl?: string;
  // Idea-specific fields
  problem?: string;
  solution?: string;
  opportunity?: string;
  goMarket?: string;
  teamInfo?: string;
  isAnonymous?: boolean;
  createdAt: string;
}

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
}

export interface User {
  id: string;
  wallet: string;
  username: string;
  bio?: string;
  avatar?: string;
  reputationScore: number;
  balance?: number; // Track tips received
  socialLinks?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  lastLoginAt?: string;
  loginCount?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  txHash: string;
  from: string;
  to: string;
  amount: number;
  type: 'tip' | 'bounty' | 'reward';
  projectId?: string;
  commentId?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
