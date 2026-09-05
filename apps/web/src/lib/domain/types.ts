export type DataOrigin =
  | 'api'
  | 'database_fixture'
  | 'local_dev'
  | 'imported_public'
  | 'ai_preview'
  | 'onchain_devnet'
  | 'mock';

export type Visibility =
  'public' | 'restricted_summary' | 'restricted_full' | 'private_owner' | 'private_judge';

export type BountyStage = 'idea' | 'build';
export type BountyStatus =
  | 'draft'
  | 'awaiting_funding'
  | 'funding_pending'
  | 'funded'
  | 'open'
  | 'closed'
  | 'judging'
  | 'winner_pending_chain'
  | 'settlement_pending'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'resolution';

export type FundingState =
  'not_connected' | 'development_unverified' | 'devnet_verified' | 'mainnet_verified';

export type OrganizationSummary = {
  slug: string;
  name: string;
  description: string;
  origin: DataOrigin;
};

export type ProblemReferenceModel = {
  slug: string;
  title: string;
  summary: string;
  industry: string;
  region: string;
};

export type IdeaReferenceModel = {
  slug: string;
  title: string;
  summary?: string;
  visibility: Visibility;
};

export type HistoricalAttemptModel = {
  slug: string;
  name: string;
  source: string;
  year: number;
  result: string;
  similarity: number;
  approach: string;
  outcome: string;
  origin: DataOrigin;
};

export type ProjectMode =
  'historical_imported' | 'public_community' | 'private_workspace' | 'restricted_winner';

export type ProjectModel = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  mode: ProjectMode;
  visibility: Visibility;
  origin: DataOrigin;
  status: string;
  source?: {
    label: string;
    year: number;
    result: string;
    originalDescription: string;
    url: string;
  };
  problem: ProblemReferenceModel;
  idea?: IdeaReferenceModel;
  team: string[];
  technologies: string[];
  repositoryUrl?: string;
  demoUrl?: string;
  research: {
    problemSignal: string;
    approach: string;
    targetUsers: string[];
    whatChanged: string;
    confidence: 'low' | 'medium' | 'high';
    reviewed: boolean;
  };
  outcome: {
    state: 'live' | 'paused' | 'shutdown' | 'acquired' | 'unknown';
    summary: string;
  };
  bountyResult?: {
    label: string;
    amountUsdc: number;
    paymentVerification: 'pending' | 'devnet_verified';
  };
};

export type BountyModel = {
  id?: string;
  slug: string;
  title: string;
  stage: BountyStage;
  status: BountyStatus;
  visibility: Visibility;
  origin: DataOrigin;
  organization: OrganizationSummary;
  problem: ProblemReferenceModel;
  selectedIdea?: IdeaReferenceModel;
  parentBountySlug?: string;
  amountUsdc: number;
  platformFeeUsdc: number | null;
  amountRaw?: string;
  platformFeeRaw?: string;
  termsHash?: string;
  funding: FundingState;
  explorerUrl?: string;
  deadline: string;
  judgingDeadline: string;
  privateSubmissionCount: number;
  joinedBuilders?: number;
  summary: string;
  objective: string;
  requirements: string[];
  constraints: string[];
  criteria: Array<{ name: string; weight: number }>;
  eligibility: string[];
  ipTerms: string;
  technologies?: string[];
};

export type PrivateSubmissionModel = {
  id: string;
  bountySlug: string;
  kind: 'idea' | 'project';
  title: string;
  summary: string;
  owner: string;
  visibility: 'private_owner' | 'private_judge';
  status: 'draft' | 'submitted' | 'shortlisted' | 'selected' | 'not_selected';
  submittedAt?: string;
  snapshotVersion?: string;
};

export type HomeFeedItem =
  | { type: 'bounty'; priority: number; bounty: BountyModel }
  | {
      type: 'problem';
      priority: number;
      problem: ProblemReferenceModel;
      ideaCount: number;
      archiveCount: number;
    }
  | { type: 'project'; priority: number; project: ProjectModel }
  | {
      type: 'update';
      priority: number;
      id: string;
      label: string;
      title: string;
      body: string;
      href: string;
    };

export type SearchResult =
  | { type: 'problem'; title: string; summary: string; href: string; origin: DataOrigin }
  | { type: 'idea'; title: string; summary: string; href: string; origin: DataOrigin }
  | { type: 'project'; title: string; summary: string; href: string; origin: DataOrigin }
  | { type: 'bounty'; title: string; summary: string; href: string; origin: DataOrigin }
  | { type: 'organization'; title: string; summary: string; href: string; origin: DataOrigin };
