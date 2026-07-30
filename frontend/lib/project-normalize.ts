import { buildCommentTree } from "./comment-utils";
import type { Project } from "./types";

/**
 * Canonical backend → frontend project mapper.
 * Use this from React Query hooks and Zustand hydrate paths — do not re-map ad hoc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeProject(raw: any): Project {
  if (!raw) {
    return raw as Project;
  }

  const project: Project = {
    ...raw,
    image: raw.imageUrl || raw.image_url || raw.image,
    imageUrl: raw.imageUrl || raw.image_url || raw.image,
    createdAt: raw.createdAt || raw.created_at || raw.createdAt,
    feedbackCount:
      raw.feedbackCount ?? raw.feedback_count ?? raw.feedbackCount ?? 0,
    isVerified: raw.isVerified ?? raw.is_verified ?? false,
    hackathonId: raw.hackathonId ?? raw.hackathon_id ?? undefined,
    hackathonTrack: raw.hackathonTrack ?? raw.hackathon_track ?? undefined,
    // Prefer camelCase author already shaped by API; fall back to nested snake
    author: raw.author
      ? {
          ...raw.author,
          avatar: raw.author.avatar ?? raw.author.avatar_url,
          wallet: raw.author.wallet ?? "",
          username: raw.author.username ?? "unknown",
        }
      : raw.author,
  };

  if (project.comments?.length) {
    project.comments = buildCommentTree(project.comments);
  }

  return project;
}
