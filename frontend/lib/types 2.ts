
import React from 'react';

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  tips: number; // Total USDC tipped
  replies?: Comment[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure' | 'DAO' | 'DePIN' | 'Social' | 'Mobile' | 'Security';
  stage: 'Idea' | 'Prototype' | 'Devnet' | 'Mainnet';
  votes: number;
  feedbackCount: number;
  bounty?: number; // USDC
  tags: string[];
  image?: string; // URL to project banner/screenshot
  website?: string; // URL to demo/landing page
  author: {
    username: string;
    wallet: string;
    avatar?: string;
  };
  createdAt: string;
  comments?: Comment[];
}

export interface User {
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
