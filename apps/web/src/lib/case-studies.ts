import rawCaseStudies from '../data/case-studies.json';

export type CaseStudyStage = 'unicorn' | 'growth' | 'live' | 'prototype' | 'sunset';

export type CaseStudyTheme =
  | 'AI'
  | 'Finance & DeFi'
  | 'Technology & DevTools'
  | 'Blockchain & Web3'
  | 'Social & Civic Tech'
  | 'Climate & Sustainability'
  | 'Education & Edtech'
  | 'Economics & Commerce'
  | 'Healthcare & Medtech'
  | 'Travel & Tourism';

export interface CaseStudyProblem {
  title: string;
  summary: string;
  target_audience: string[];
}

export interface CaseStudySolution {
  thesis: string;
  description: string;
  key_features: string[];
}

export interface CaseStudyTeam {
  name: string;
  founders: string[];
  contact_email: string | null;
}

export interface CaseStudyDetails {
  origin_hackathon: string | null;
  stage: CaseStudyStage;
  score: number;
  github_url: string | null;
  website_url: string | null;
  team: CaseStudyTeam;
  metrics_and_traction: string;
  key_takeaway: string;
  internal_notes: string;
}

export interface CaseStudyItem {
  id: string;
  name: string;
  tagline: string;
  theme: CaseStudyTheme;
  tags: string[];
  problem: CaseStudyProblem;
  solution: CaseStudySolution;
  case_study: CaseStudyDetails;
}

export interface FilterCaseStudiesOptions {
  theme?: string | null;
  stage?: string | null;
  query?: string | null;
  sortBy?: 'score_desc' | 'score_asc' | 'name_asc' | 'name_desc';
}

export const CASE_STUDY_THEMES: readonly CaseStudyTheme[] = [
  'AI',
  'Finance & DeFi',
  'Technology & DevTools',
  'Blockchain & Web3',
  'Social & Civic Tech',
  'Climate & Sustainability',
  'Education & Edtech',
  'Economics & Commerce',
  'Healthcare & Medtech',
  'Travel & Tourism',
] as const;

export const CASE_STUDY_STAGES: readonly CaseStudyStage[] = [
  'unicorn',
  'growth',
  'live',
  'prototype',
  'sunset',
] as const;

const typedCaseStudies: CaseStudyItem[] = rawCaseStudies as CaseStudyItem[];

export function getAllCaseStudies(): CaseStudyItem[] {
  return typedCaseStudies;
}

export function getCaseStudyById(id: string): CaseStudyItem | undefined {
  const normalizedId = id.trim().toLowerCase();
  return typedCaseStudies.find((item) => item.id.toLowerCase() === normalizedId);
}

export function getCaseStudiesByTheme(theme: string): CaseStudyItem[] {
  const normalized = theme.trim().toLowerCase();
  return typedCaseStudies.filter((item) => item.theme.toLowerCase() === normalized);
}

export function getCaseStudiesByStage(stage: string): CaseStudyItem[] {
  const normalized = stage.trim().toLowerCase();
  return typedCaseStudies.filter((item) => item.case_study.stage.toLowerCase() === normalized);
}

export function filterCaseStudies(options: FilterCaseStudiesOptions = {}): CaseStudyItem[] {
  const { theme, stage, query, sortBy = 'score_desc' } = options;

  let results = [...typedCaseStudies];

  if (theme && theme !== 'all') {
    const targetTheme = theme.toLowerCase();
    results = results.filter((item) => item.theme.toLowerCase() === targetTheme);
  }

  if (stage && stage !== 'all') {
    const targetStage = stage.toLowerCase();
    results = results.filter((item) => item.case_study.stage.toLowerCase() === targetStage);
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchTagline = item.tagline.toLowerCase().includes(q);
      const matchProblem =
        item.problem.title.toLowerCase().includes(q) ||
        item.problem.summary.toLowerCase().includes(q);
      const matchSolution = item.solution.thesis.toLowerCase().includes(q);
      const matchTags = item.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchName || matchTagline || matchProblem || matchSolution || matchTags;
    });
  }

  results.sort((a, b) => {
    switch (sortBy) {
      case 'score_asc':
        return a.case_study.score - b.case_study.score;
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'score_desc':
      default:
        return b.case_study.score - a.case_study.score;
    }
  });

  return results;
}
