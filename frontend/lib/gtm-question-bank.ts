export type GTMQuestion = {
  id: number;
  stage: 'qualification' | 'problem' | 'jtbd' | 'icp' | 'mvp' | 'pricing' | 'pmf';
  prompt: string;
};

export const QUESTION_PACK_SIZE = 5;
export const FREE_QUESTIONS_PER_DAY = 2;

export const GTM_QUESTION_BANK: GTMQuestion[] = [
  { id: 1, stage: 'qualification', prompt: 'Which profile best matches you for this problem?' },
  { id: 2, stage: 'qualification', prompt: 'How many times did this problem happen in the last 30 days?' },
  { id: 3, stage: 'problem', prompt: 'When was the last time this problem happened?' },
  { id: 4, stage: 'problem', prompt: 'How did you handle it the last time?' },
  { id: 5, stage: 'problem', prompt: 'What is your biggest loss from this problem?' },
  { id: 6, stage: 'problem', prompt: 'What happens in the next 3 months if this is not solved?' },
  { id: 7, stage: 'problem', prompt: 'Have you already paid for any alternative solution?' },
  { id: 8, stage: 'jtbd', prompt: 'What is the closest alternative you currently use?' },
  { id: 9, stage: 'jtbd', prompt: 'What triggered you to consider switching?' },
  { id: 10, stage: 'jtbd', prompt: 'What is stopping you from switching right now?' },
  { id: 11, stage: 'jtbd', prompt: 'What is the main job you need to get done?' },
  { id: 12, stage: 'jtbd', prompt: 'Which metric defines success for you?' },
  { id: 13, stage: 'icp', prompt: 'Who feels this pain the most in your workflow?' },
  { id: 14, stage: 'icp', prompt: 'Who makes the final payment decision?' },
  { id: 15, stage: 'icp', prompt: 'Where does the budget usually come from?' },
  { id: 16, stage: 'icp', prompt: 'How urgent is this problem for you right now (1-5)?' },
  { id: 17, stage: 'icp', prompt: 'If a better tool existed, how soon would you try it?' },
  { id: 18, stage: 'mvp', prompt: 'If you could only choose one outcome, what would it be?' },
  { id: 19, stage: 'mvp', prompt: 'What is the must-have feature for your first trial?' },
  { id: 20, stage: 'mvp', prompt: 'Which features are nice-to-have but not needed for v1?' },
  { id: 21, stage: 'mvp', prompt: 'What would make you drop the product after first use?' },
  { id: 22, stage: 'mvp', prompt: 'What onboarding time is acceptable to you?' },
  { id: 23, stage: 'pricing', prompt: 'At what price would this feel too cheap to trust?' },
  { id: 24, stage: 'pricing', prompt: 'At what price would this feel like a great deal?' },
  { id: 25, stage: 'pricing', prompt: 'At what price does it start to feel expensive but still possible?' },
  { id: 26, stage: 'pricing', prompt: 'At what price is it too expensive to buy?' },
  { id: 27, stage: 'pricing', prompt: 'Do you prefer monthly pricing or usage-based pricing?' },
  { id: 28, stage: 'pmf', prompt: 'How would you feel if this product disappeared tomorrow?' },
  { id: 29, stage: 'pmf', prompt: 'Who would you recommend this product to first?' },
  { id: 30, stage: 'pmf', prompt: 'What is the main reason you would not recommend it yet?' },
];
