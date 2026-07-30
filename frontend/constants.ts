
import { JourneyStep, Project } from './lib/types';
import { Lightbulb, Users, Zap, Rocket, Trophy } from 'lucide-react';
import React from 'react';

// Mock data removed - Projects are now fetched from backend API
// See lib/store.ts for the fetchProjects() function
export const PROJECTS: Project[] = [];

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
