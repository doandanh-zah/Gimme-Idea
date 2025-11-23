
import { JourneyStep } from './types';
import { Project } from './lib/types';
import { Lightbulb, Users, Zap, Rocket, Trophy } from 'lucide-react';
import React from 'react';

export const PROJECTS: Project[] = [
  {
    id: '1',
    type: 'project',
    title: 'SolStream Protocol',
    description: 'Decentralized video streaming with real-time creator payouts using compressed NFTs. Built to handle high-throughput media encoding on-chain.',
    category: 'Infrastructure',
    votes: 1240,
    feedbackCount: 85,
    stage: 'Prototype',
    tags: ['Rust', 'Compression', 'Media'],
    image: 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?q=80&w=2070&auto=format&fit=crop',
    website: 'https://solana.com',
    author: {
      username: 'stream_wizard',
      wallet: '8x...92a',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stream_wizard'
    },
    bounty: 500,
    createdAt: '2024-03-10T10:00:00Z',
    comments: [
      { 
        id: 'c1', 
        author: 'dev_chad', 
        content: 'Have you considered using Shadow Drive for storage?', 
        timestamp: '2h ago',
        likes: 12,
        dislikes: 0,
        tips: 5,
        replies: []
      }
    ]
  },
  {
    id: '2',
    type: 'project',
    title: 'Aurum DeFi',
    description: 'Synthetic gold pegging mechanism with zero-slippage swaps. Uses Pyth oracles for real-time price feeds and supports cross-chain collateral.',
    category: 'DeFi',
    votes: 890,
    feedbackCount: 120,
    stage: 'Idea',
    tags: ['Oracle', 'Stablecoin'],
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=2070&auto=format&fit=crop',
    website: 'https://solana.com',
    author: {
      username: 'gold_dao',
      wallet: '3y...44b',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gold_dao'
    },
    createdAt: '2024-03-15T14:00:00Z',
    comments: []
  },
  {
    id: '3',
    type: 'project',
    title: 'Pixel Raiders',
    description: 'On-chain roguelike where every item is a tradeable cNFT. Features procedural dungeon generation and permadeath mechanics.',
    category: 'Gaming',
    votes: 2100,
    feedbackCount: 340,
    stage: 'Mainnet',
    tags: ['GameFi', 'Mobile'],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
    website: 'https://solana.com',
    author: {
      username: 'pixel_labs',
      wallet: '9z...11c',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pixel_labs'
    },
    bounty: 1000,
    createdAt: '2024-02-20T09:30:00Z',
    comments: []
  },
  {
    id: '4',
    type: 'idea',
    title: 'Decentralized Uber for Drones',
    description: 'A concept for autonomous drone delivery network managed by DAO.',
    problem: 'Current logistics are slow and rely on human drivers. Traffic congestion causes delays.',
    opportunity: 'Drone technology is maturing. Solana fast finality allows for real-time micro-payments per mile.',
    solution: 'A protocol where anyone can register a drone. Users request delivery, protocol matches nearest drone. Payment executes on-chain.',
    goMarket: 'Start with medical supplies in rural areas, then expand to urban food delivery.',
    teamInfo: 'Looking for Rust devs and Hardware engineers.',
    category: 'DePIN',
    votes: 45,
    feedbackCount: 12,
    stage: 'Idea',
    tags: ['DePIN', 'Logistics'],
    isAnonymous: true,
    author: {
      username: 'Hidden_Visionary',
      wallet: '5k...11x',
    },
    createdAt: '2024-03-20T11:00:00Z',
    comments: []
  }
];

export const JOURNEY_STEPS: JourneyStep[] = [
  { id: 1, title: 'Raw Idea', description: 'Post your napkin sketch. Anon or doxxed.', icon: React.createElement(Lightbulb, { className: "w-6 h-6" }) },
  { id: 2, title: 'Community Audit', description: 'Builders tear it down to build it up.', icon: React.createElement(Users, { className: "w-6 h-6" }) },
  { id: 3, title: 'Rapid Iteration', description: 'Pivot based on 100+ dev insights.', icon: React.createElement(Zap, { className: "w-6 h-6" }) },
  { id: 4, title: 'Testnet Launch', description: 'Validate mechanics with incentivized testers.', icon: React.createElement(Rocket, { className: "w-6 h-6" }) },
  { id: 5, title: 'Success', description: 'Mainnet deploy with a pre-built community.', icon: React.createElement(Trophy, { className: "w-6 h-6" }) }
];

export const CHART_DATA = [
  { name: 'DeFi', value: 400, fill: '#8884d8' },
  { name: 'NFTs', value: 300, fill: '#83a6ed' },
  { name: 'Gaming', value: 300, fill: '#8dd1e1' },
  { name: 'Infra', value: 200, fill: '#82ca9d' },
];

export const ACTIVITY_DATA = [
  { name: 'Mon', feedback: 400, projects: 240 },
  { name: 'Tue', feedback: 300, projects: 139 },
  { name: 'Wed', feedback: 200, projects: 980 },
  { name: 'Thu', feedback: 278, projects: 390 },
  { name: 'Fri', feedback: 189, projects: 480 },
  { name: 'Sat', feedback: 239, projects: 380 },
  { name: 'Sun', feedback: 349, projects: 430 },
];
