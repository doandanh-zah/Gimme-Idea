import React from 'react';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure' | 'DAO';
  votes: number;
  feedbackCount: number;
  stage: 'Idea' | 'Prototype' | 'Devnet' | 'Mainnet';
  tags: string[];
  author: {
    username: string;
    wallet: string;
    avatar?: string;
  };
  bounty?: number;
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