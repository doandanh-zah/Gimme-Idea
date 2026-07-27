import { buildCommentTree } from "./comment-utils";
import type { Project } from "./types";

/**
 * Map backend project payload → frontend Project (image alias + nested comments).
 * Shared by RQ detail queries and Zustand fetch/hydrate paths.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeProject(raw: any): Project {
  const project = {
    ...raw,
    image: raw.imageUrl || raw.image,
  };
  if (project.comments?.length) {
    project.comments = buildCommentTree(project.comments);
  }
  return project as Project;
}
