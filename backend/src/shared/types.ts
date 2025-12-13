// Shared types - Synced with frontend/types.ts
// IMPORTANT: Keep this file in sync with frontend types

export interface Project {
  id: string;
  slug?: string; // URL-friendly identifier
  type?: "project" | "idea";
  title: string;
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
  votes: number;
  feedbackCount: number;
  stage: "Idea" | "Prototype" | "Devnet" | "Mainnet";
  tags: string[];
  website?: string;
  author?: {
    username: string;
    wallet: string;
    avatar?: string;
    slug?: string;
  } | null; // Nullable when isAnonymous
  bounty?: number;
  imageUrl?: string;
  // Idea-specific fields
  problem?: string;
  solution?: string;
  opportunity?: string;
  isAnonymous?: boolean;
  createdAt: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  projectId: string;
  content: string;
  author?: {
    username: string;
    wallet: string;
    avatar?: string;
    slug?: string;
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
  slug?: string; // URL-friendly identifier
  bio?: string;
  avatar?: string;
  coverImage?: string; // Profile cover/banner image
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
  // Email auth fields
  email?: string;
  authProvider?: "wallet" | "google";
  authId?: string;
  needsWalletConnect?: boolean;
  // Follow system
  followersCount?: number;
  followingCount?: number;
}

export interface Transaction {
  id: string;
  txHash: string;
  from: string;
  to: string;
  amount: number;
  type: "tip" | "bounty" | "reward";
  projectId?: string;
  commentId?: string;
  status: "pending" | "confirmed" | "failed";
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
