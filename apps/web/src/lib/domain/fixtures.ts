import type {
  BountyModel,
  HistoricalAttemptModel,
  HomeFeedItem,
  OrganizationSummary,
  PrivateSubmissionModel,
  ProblemReferenceModel,
  ProjectModel,
} from './types';

export const organizations: OrganizationSummary[] = [
  {
    slug: 'northstar-foods',
    name: 'Northstar Foods',
    description:
      'A regional hospitality operator testing better ways to forecast purchasing and prevent avoidable food waste.',
    origin: 'database_fixture',
  },
  {
    slug: 'civic-repair-lab',
    name: 'Civic Repair Lab',
    description:
      'A public-interest product studio improving maintenance coordination in shared buildings.',
    origin: 'database_fixture',
  },
];

export const problemReferences: ProblemReferenceModel[] = [
  {
    slug: 'restaurant-food-waste',
    title: 'Restaurants cannot match daily supply with volatile demand',
    summary:
      'Independent kitchens over-purchase ingredients because tomorrow’s demand is difficult to forecast with the tools they have.',
    industry: 'Hospitality',
    region: 'Vietnam',
  },
  {
    slug: 'tenant-repair-visibility',
    title: 'Tenants cannot see what is happening with shared-building repairs',
    summary:
      'Residents lose trust when repair reports disappear into fragmented calls, spreadsheets and vendor messages.',
    industry: 'Property operations',
    region: 'Southeast Asia',
  },
];

const foodWaste = problemReferences[0]!;
const repairVisibility = problemReferences[1]!;

export const historicalAttempts: HistoricalAttemptModel[] = [
  {
    slug: 'pantry-pulse-archive',
    name: 'Pantry Pulse',
    source: 'Colosseum Radar',
    year: 2024,
    result: 'Finalist',
    similarity: 82,
    approach:
      'Combined point-of-sale history with a daily purchasing recommendation for small kitchens.',
    outcome: 'The prototype reached a hackathon final; current operating status is unknown.',
    origin: 'imported_public',
  },
  {
    slug: 'service-ledger-archive',
    name: 'Service Ledger',
    source: 'Renaissance',
    year: 2024,
    result: 'Participant',
    similarity: 76,
    approach: 'Created a shared maintenance trail for residents, managers and contractors.',
    outcome: 'A public demo remains available; adoption and operating outcome are unverified.',
    origin: 'imported_public',
  },
];

export const projects: ProjectModel[] = [
  {
    slug: 'pantry-pulse-archive',
    name: 'Pantry Pulse',
    summary: 'A historical forecasting prototype for independent restaurant purchasing.',
    mode: 'historical_imported',
    visibility: 'public',
    origin: 'imported_public',
    status: 'Historical record',
    source: {
      label: 'Colosseum Radar',
      year: 2024,
      result: 'Finalist',
      originalDescription:
        'Inventory planning software that helps small hospitality teams prepare purchasing plans from recent sales signals.',
      url: 'https://www.colosseum.org/',
    },
    problem: foodWaste,
    team: ['Public source lists a two-person team'],
    technologies: ['Forecasting', 'Point of sale', 'Web'],
    repositoryUrl: 'https://github.com/',
    demoUrl: 'https://www.colosseum.org/',
    research: {
      problemSignal:
        'Small kitchens appear to need a lower-friction demand signal before they commit tomorrow’s purchasing budget.',
      approach:
        'Translate recent sales and waste records into an explainable daily recommendation.',
      targetUsers: ['Independent restaurant operators', 'Kitchen managers'],
      whatChanged:
        'More point-of-sale systems now expose usable exports and lightweight integrations.',
      confidence: 'medium',
      reviewed: false,
    },
    outcome: {
      state: 'unknown',
      summary:
        'Finalist result is source-backed. Current product and customer status have not been verified.',
    },
  },
  {
    slug: 'kitchen-signal-lab',
    name: 'Kitchen Signal Lab',
    summary: 'A public community build testing calm next-day demand recommendations.',
    mode: 'public_community',
    visibility: 'public',
    origin: 'local_dev',
    status: 'Prototype',
    problem: foodWaste,
    idea: {
      slug: 'demand-pulse-for-kitchens',
      title: 'Demand Pulse for independent kitchens',
      summary: 'A planning signal that helps kitchens make tomorrow’s purchasing decision.',
      visibility: 'public',
    },
    team: ['Minh Nguyen', 'Lan Ho'],
    technologies: ['Next.js', 'Forecasting', 'PostgreSQL'],
    repositoryUrl: 'https://github.com/',
    demoUrl: 'https://example.com/',
    research: {
      problemSignal:
        'Daily purchasing is the decision point with the clearest measurable waste impact.',
      approach: 'Show a recommendation with confidence and the evidence that changed it.',
      targetUsers: ['Kitchen managers'],
      whatChanged: 'The prototype now includes uncertainty instead of hiding it behind one number.',
      confidence: 'high',
      reviewed: true,
    },
    outcome: { state: 'live', summary: 'Prototype is being tested with two development kitchens.' },
  },
  {
    slug: 'foodloop-mvp',
    name: 'FoodLoop MVP',
    summary: 'Private build workspace for the selected restaurant demand direction.',
    mode: 'private_workspace',
    visibility: 'private_owner',
    origin: 'local_dev',
    status: 'Building · v0.8',
    problem: foodWaste,
    idea: {
      slug: 'selected-demand-direction',
      title: 'Selected direction',
      visibility: 'restricted_full',
    },
    team: ['Devnet Builder'],
    technologies: ['React', 'Node.js', 'Mobile'],
    research: {
      problemSignal: 'Restricted build context',
      approach: 'Available only after accepting the build brief terms.',
      targetUsers: ['Authorized builder'],
      whatChanged: 'Private workspace fixture',
      confidence: 'high',
      reviewed: true,
    },
    outcome: { state: 'unknown', summary: 'The project is still being built.' },
  },
  {
    slug: 'foodloop-winning-build',
    name: 'FoodLoop Operations Pilot',
    summary: 'A selected project whose publication decision is still private.',
    mode: 'restricted_winner',
    visibility: 'restricted_summary',
    origin: 'local_dev',
    status: 'Selected · restricted',
    problem: foodWaste,
    idea: {
      slug: 'selected-demand-direction',
      title: 'Selected direction',
      visibility: 'restricted_full',
    },
    team: [],
    technologies: [],
    research: {
      problemSignal: 'Restricted',
      approach: 'Restricted',
      targetUsers: [],
      whatChanged: 'Restricted',
      confidence: 'high',
      reviewed: true,
    },
    outcome: { state: 'unknown', summary: 'Outcome has not been recorded.' },
    bountyResult: {
      label: 'Build result recorded',
      amountUsdc: 10000,
      paymentVerification: 'pending',
    },
  },
];

export const bounties: BountyModel[] = [
  {
    slug: 'restaurant-demand-idea',
    title: 'Find a practical demand-planning direction for independent kitchens',
    stage: 'idea',
    status: 'open',
    visibility: 'public',
    origin: 'local_dev',
    organization: organizations[0]!,
    problem: foodWaste,
    amountUsdc: 1500,
    platformFeeUsdc: null,
    funding: 'development_unverified',
    deadline: '2026-09-16T16:00:00.000Z',
    judgingDeadline: '2026-09-23T16:00:00.000Z',
    privateSubmissionCount: 18,
    summary: 'Propose the direction before Northstar commits a larger budget to execution.',
    objective:
      'Identify an operationally simple way for independent kitchens to make a better next-day purchasing decision.',
    requirements: [
      'A clear opportunity thesis',
      'An explainable solution',
      'A realistic adoption path',
    ],
    constraints: [
      'Works with CSV exports',
      'No new kitchen hardware',
      'Pilotable within six weeks',
    ],
    criteria: [
      { name: 'Problem fit', weight: 35 },
      { name: 'Operational simplicity', weight: 30 },
      { name: 'Evidence and feasibility', weight: 35 },
    ],
    eligibility: ['Individuals or teams', 'One private entry per direction'],
    ipTerms:
      'Entries remain private. Selection does not publish the work; detailed usage terms are reviewed before submission.',
  },
  {
    slug: 'foodloop-build',
    title: 'Build a pilot-ready demand planning prototype',
    stage: 'build',
    status: 'open',
    visibility: 'restricted_summary',
    origin: 'local_dev',
    organization: organizations[0]!,
    problem: foodWaste,
    selectedIdea: {
      slug: 'selected-demand-direction',
      title: 'Selected direction',
      visibility: 'restricted_full',
    },
    parentBountySlug: 'restaurant-demand-idea',
    amountUsdc: 10000,
    platformFeeUsdc: 250,
    funding: 'development_unverified',
    deadline: '2026-10-16T16:00:00.000Z',
    judgingDeadline: '2026-10-23T16:00:00.000Z',
    privateSubmissionCount: 27,
    joinedBuilders: 34,
    summary: 'Build a working prototype for a privately selected solution direction.',
    objective:
      'Deliver a testable workflow from sales import to next-day purchasing recommendation.',
    requirements: [
      'Working responsive product',
      'Demo walkthrough',
      'Repository snapshot',
      'Setup documentation',
    ],
    constraints: ['React or equivalent web stack', 'CSV import', 'No production customer data'],
    criteria: [
      { name: 'Problem fit', weight: 25 },
      { name: 'Execution quality', weight: 30 },
      { name: 'Technical quality', weight: 25 },
      { name: 'Usability', weight: 20 },
    ],
    eligibility: ['Accept confidentiality terms', 'Designate one payout recipient'],
    ipTerms:
      'The brief and selected direction are restricted to joined builders. Projects remain private unless their owners publish them.',
    technologies: ['React', 'Node.js', 'Mobile'],
  },
  {
    slug: 'repair-routing-build-draft',
    title: 'Prototype a shared repair status trail',
    stage: 'build',
    status: 'awaiting_funding',
    visibility: 'restricted_summary',
    origin: 'local_dev',
    organization: organizations[1]!,
    problem: repairVisibility,
    selectedIdea: {
      slug: 'repair-routing-selected',
      title: 'Selected direction',
      visibility: 'restricted_full',
    },
    amountUsdc: 6000,
    platformFeeUsdc: 150,
    funding: 'not_connected',
    deadline: '2026-10-30T16:00:00.000Z',
    judgingDeadline: '2026-11-06T16:00:00.000Z',
    privateSubmissionCount: 0,
    joinedBuilders: 0,
    summary: 'A configured Build Bounty waiting for an organization funding wallet.',
    objective: 'Create a clear status trail shared by residents, property managers and vendors.',
    requirements: ['Responsive prototype', 'Role-aware status updates'],
    constraints: ['No public tenant data'],
    criteria: [{ name: 'Workflow clarity', weight: 100 }],
    eligibility: ['Joined builders'],
    ipTerms: 'Restricted development brief. Funding and submission are not connected in Phase 1.',
  },
];

export const privateSubmissions: PrivateSubmissionModel[] = [
  {
    id: 'idea-submission-saffron',
    bountySlug: 'restaurant-demand-idea',
    kind: 'idea',
    title: 'Saffron demand window',
    summary: 'Private solution content visible only to its owner and authorized reviewers.',
    owner: 'Devnet Builder',
    visibility: 'private_judge',
    status: 'selected',
    submittedAt: '2026-09-03T07:32:00.000Z',
    snapshotVersion: 'Idea entry v1',
  },
  {
    id: 'project-submission-foodloop',
    bountySlug: 'foodloop-build',
    kind: 'project',
    title: 'FoodLoop MVP',
    summary: 'Submitted Project snapshot. The working Project may continue to change.',
    owner: 'Devnet Builder',
    visibility: 'private_judge',
    status: 'shortlisted',
    submittedAt: '2026-09-21T07:32:00.000Z',
    snapshotVersion: 'v0.8',
  },
];

export const homeFeed: HomeFeedItem[] = [
  { type: 'bounty', priority: 100, bounty: bounties[0]! },
  { type: 'bounty', priority: 90, bounty: bounties[1]! },
  { type: 'problem', priority: 80, problem: repairVisibility, ideaCount: 3, archiveCount: 9 },
  { type: 'project', priority: 70, project: projects[0]! },
  { type: 'project', priority: 60, project: projects[1]! },
  {
    type: 'update',
    priority: 50,
    id: 'update-kitchen-signal-01',
    label: 'PROJECT UPDATE',
    title: 'Kitchen Signal Lab published a test note',
    body: 'The team changed its recommendation view to show uncertainty instead of hiding it.',
    href: '/projects/kitchen-signal-lab',
  },
];
