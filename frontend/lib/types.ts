
import React from 'react';

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
  type: 'project' | 'idea'; // Distinguish between fully formed projects and raw ideas
  title: string;
  description: string;
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure' | 'DAO' | 'DePIN' | 'Social' | 'Mobile' | 'Security';
  stage: 'Idea' | 'Prototype' | 'Devnet' | 'Mainnet';
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
}

export interface User {
  id?: string; // Database user ID (returned from backend)
  wallet: string;
  username: string;
  reputation: number;
  balance: number; // USDC
  projects: string[]; // Project IDs
  avatar?: string;
  bio?: string;
  socials?: {
    twitter?: string;
    github?: string;
    telegram?: string;
    facebook?: string;
  };
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
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
  marketSize: 'small' | 'medium' | 'large';
  competitionLevel: 'low' | 'medium' | 'high';
}

export interface AIQuota {
  canUse: boolean;
  freeRemaining: number;
  paidCredits: number;
  interactionsUsed: number;
  maxFreeInteractions: number;
}
