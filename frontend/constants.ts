
import { JourneyStep } from './lib/types';
import { Lightbulb, Users, Zap, Rocket, Trophy } from 'lucide-react';
import React from 'react';

export const JOURNEY_STEPS: JourneyStep[] = [
  { id: 1, title: 'Raw Idea', description: 'Post your napkin sketch. Anon or doxxed.', icon: React.createElement(Lightbulb, { className: "w-6 h-6" }) },
  { id: 2, title: 'Community Audit', description: 'Builders tear it down to build it up.', icon: React.createElement(Users, { className: "w-6 h-6" }) },
  { id: 3, title: 'Rapid Iteration', description: 'Pivot based on 100+ dev insights.', icon: React.createElement(Zap, { className: "w-6 h-6" }) },
  { id: 4, title: 'Testnet Launch', description: 'Validate mechanics with incentivized testers.', icon: React.createElement(Rocket, { className: "w-6 h-6" }) },
  { id: 5, title: 'Success', description: 'Mainnet deploy with a pre-built community.', icon: React.createElement(Trophy, { className: "w-6 h-6" }) }
];
