export type FrontendEventName =
  | 'problem_view'
  | 'problem_discuss'
  | 'idea_view'
  | 'archive_project_view'
  | 'landscape_check_open'
  | 'idea_bounty_view'
  | 'idea_submission_start'
  | 'idea_submission_submit_dev'
  | 'idea_submission_submit'
  | 'build_bounty_view'
  | 'build_bounty_join'
  | 'private_project_start'
  | 'project_submission_submit_dev'
  | 'project_submission_submit'
  | 'wallet_open'
  | 'withdraw_start'
  | 'organization_problem_create';

export type FrontendEvent = {
  name: FrontendEventName;
  entityId?: string;
  origin?: string;
};

export function trackFrontendEvent(event: FrontendEvent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('gimme-frontend-event', { detail: event }));
}
