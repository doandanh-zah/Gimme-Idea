/** Shared sentinel for viewer-scoped query keys when unauthenticated. */
export const viewerKey = (userId?: string | null) => userId ?? "anonymous";

export const queryKeys = {
  notifications: {
    all: ["notifications"] as const,
    list: (userId: string, limit: number, offset: number) =>
      ["notifications", "list", userId, limit, offset] as const,
    unread: (userId: string) => ["notifications", "unread", userId] as const,
  },
  announcements: (userId: string) => ["announcements", userId] as const,
  ideaVelocity: ["idea-velocity"] as const,
  teamInvites: (userId: string) => ["team-invites", userId] as const,
  projects: {
    list: (filters: Record<string, unknown>) =>
      ["projects", "list", filters] as const,
    detail: (routeKey: string) => ["projects", "detail", routeKey] as const,
  },
  feeds: {
    public: (limit: number) => ["feeds", "public", limit] as const,
    mine: (userId: string) => ["feeds", "mine", userId] as const,
    following: (userId: string) => ["feeds", "following", userId] as const,
    detail: (feedId: string, viewerId?: string | null) =>
      ["feeds", "detail", feedId, viewerKey(viewerId)] as const,
    items: (feedId: string) => ["feeds", "items", feedId] as const,
    bookmark: (projectId: string, userId: string) =>
      ["feeds", "bookmark", projectId, userId] as const,
  },
  hackathons: {
    list: ["hackathons", "list"] as const,
    detail: (hackathonId: string) =>
      ["hackathons", "detail", hackathonId] as const,
    registration: (hackathonId: string, userId: string) =>
      ["hackathons", "registration", hackathonId, userId] as const,
    myTeam: (hackathonId: string, userId: string) =>
      ["hackathons", "my-team", hackathonId, userId] as const,
    teams: (hackathonId: string) =>
      ["hackathons", "teams", hackathonId] as const,
  },
  relatedProjects: (ideaId: string) => ["related-projects", ideaId] as const,
  profile: {
    followLists: ["profile", "follow-list"] as const,
    user: (username: string) => ["profile", "user", username] as const,
    stats: (username: string) => ["profile", "stats", username] as const,
    follow: (targetUserId: string, viewerId?: string | null) =>
      ["profile", "follow", targetUserId, viewerKey(viewerId)] as const,
    followList: (
      userId: string,
      type: string,
      limit: number,
      viewerId?: string | null
    ) =>
      [
        "profile",
        "follow-list",
        userId,
        type,
        limit,
        viewerKey(viewerId),
      ] as const,
    ideas: (username: string) => ["profile", "ideas", username] as const,
    feeds: (userId: string, own: boolean) =>
      ["profile", "feeds", userId, own] as const,
  },
};
