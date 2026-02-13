/**
 * API Client for Gimme Idea Backend
 * Handles all HTTP requests to the NestJS backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Base fetch wrapper with auth token
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  console.log(
    `[API] ${options.method || "GET"} ${endpoint}`,
    token ? "with token" : "no token"
  );

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    console.log(`[API] ${endpoint} response:`, response.status, data.success, data);

    // Handle 400 Bad Request - validation errors
    if (response.status === 400) {
      console.error("[API] 400 Bad Request:", data);
      return {
        success: false,
        error: data.message || data.error || "Bad Request",
      };
    }

    // Handle 401 Unauthorized - clear token and trigger re-auth
    if (response.status === 401) {
      console.warn("[API] 401 Unauthorized - clearing token");
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        // Clear any other auth-related storage
        localStorage.removeItem("gimme_ai_chat_sessions");
        // Dispatch custom event to notify auth context
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      return {
        success: false,
        error: "Session expired. Please sign in again.",
      };
    }

    // Handle 403 Forbidden - also might indicate auth issues
    if (response.status === 403) {
      return {
        success: false,
        error: data.error || "Access denied.",
      };
    }

    // If response contains token, save it
    if (data.data?.token) {
      console.log("[API] Saving new token from response");
      localStorage.setItem("auth_token", data.data.token);
    }

    return data;
  } catch (error: any) {
    console.error("API fetch error:", error);
    return {
      success: false,
      error: error.message || "Network error",
    };
  }
}

// =====================================
// AUTH API
// =====================================

export interface LoginParams {
  publicKey: string;
  signature: string;
  message: string;
}

export const apiClient = {
  // Auth
  login: (params: LoginParams) =>
    apiFetch<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  getCurrentUser: () => apiFetch<any>("/auth/me"),

  healthCheck: () => apiFetch("/auth/health"),

  // Projects
  getProjects: (params?: {
    type?: string;
    category?: string;
    stage?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return apiFetch<any[]>(`/projects${query ? `?${query}` : ""}`);
  },

  getProject: (id: string) => apiFetch<any>(`/projects/${id}`),

  createProject: (data: {
    title: string;
    description: string;
    category: string;
    stage: string;
    tags: string[];
    image?: string;
    website?: string;
  }) =>
    apiFetch<any>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, data: any) =>
    apiFetch<any>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    apiFetch<void>(`/projects/${id}`, {
      method: "DELETE",
    }),

  voteProject: (id: string) =>
    apiFetch<{ votes: number }>(`/projects/${id}/vote`, {
      method: "POST",
    }),

  // Comments
  getProjectComments: (projectId: string) =>
    apiFetch<any[]>(`/comments/project/${projectId}`),

  createComment: (data: {
    projectId: string;
    content: string;
    parentCommentId?: string;
    isAnonymous?: boolean;
  }) =>
    apiFetch<any>("/comments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  likeComment: (commentId: string) =>
    apiFetch<{ likes: number }>(`/comments/${commentId}/like`, {
      method: "POST",
    }),

  dislikeComment: (commentId: string) =>
    apiFetch<{ dislikes: number }>(`/comments/${commentId}/dislike`, {
      method: "POST",
    }),

  updateComment: (commentId: string, content: string) =>
    apiFetch<any>(`/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),

  deleteComment: (commentId: string) =>
    apiFetch<{ deleted: boolean }>(`/comments/${commentId}`, {
      method: "DELETE",
    }),

  // Payments
  verifyTransaction: (data: {
    signature: string;
    type: "tip" | "bounty" | "reward";
    amount: number;
    commentId?: string;
    projectId?: string;
  }) =>
    apiFetch<any>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTopDonators: (limit?: number) =>
    apiFetch<any[]>(`/payments/top-donators${limit ? `?limit=${limit}` : ""}`),

  getRecentDonations: (limit?: number) =>
    apiFetch<any[]>(
      `/payments/recent-donations${limit ? `?limit=${limit}` : ""}`
    ),

  // Users
  getUserByUsername: (username: string) => apiFetch<any>(`/users/${username}`),

  getUserStats: (username: string) =>
    apiFetch<{
      reputation: number;
      ideasCount: number;
      projectsCount: number;
      feedbackCount: number;
      tipsReceived: number;
      likesReceived: number;
    }>(`/users/${username}/stats`),

  getUserProjects: (username: string) =>
    apiFetch<any[]>(`/users/${username}/projects`),

  updateUserProfile: (data: {
    username?: string;
    bio?: string;
    avatar?: string;
    socialLinks?: any;
  }) =>
    apiFetch<any>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Search users (for invite member feature)
  searchUsers: (query: string, excludeUserIds?: string[], limit?: number) => {
    const params = new URLSearchParams();
    params.append("q", query);
    if (excludeUserIds && excludeUserIds.length > 0) {
      params.append("exclude", excludeUserIds.join(","));
    }
    if (limit) params.append("limit", limit.toString());
    return apiFetch<Array<{
      id: string;
      username: string;
      avatar?: string;
      bio?: string;
      reputationScore: number;
    }>>(`/users/search?${params.toString()}`);
  },

  // =====================================
  // AI API
  // =====================================

  generateAIFeedback: (data: {
    projectId: string;
    title: string;
    problem: string;
    solution: string;
    opportunity?: string;
    goMarket?: string;
    teamInfo?: string;
  }) =>
    apiFetch<any>("/ai/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateAIReply: (data: {
    projectId: string;
    userMessage: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    ideaContext: {
      title: string;
      problem: string;
      solution: string;
    };
  }) =>
    apiFetch<{ reply: string }>("/ai/reply", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // AI Auto-Reply: Automatically create AI reply comment when user replies to AI comment
  createAIAutoReply: (data: {
    projectId: string;
    parentCommentId: string;
    userQuestion: string;
    previousAIComment: string;
    ideaContext: {
      title: string;
      problem: string;
      solution: string;
      opportunity?: string;
    };
  }) =>
    apiFetch<{ comment?: any; skipped?: boolean; skipReason?: string }>(
      "/ai/auto-reply",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  generateMarketAssessment: (data: {
    projectId: string;
    title: string;
    problem: string;
    solution: string;
    opportunity?: string;
  }) =>
    apiFetch<any>("/ai/market-assessment", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  checkAIQuota: (projectId: string) => apiFetch<any>(`/ai/quota/${projectId}`),

  // Email Auth
  loginWithEmail: (params: {
    email: string;
    authId: string;
    username?: string;
  }) =>
    apiFetch<{ token: string; user: any; isNewUser: boolean }>(
      "/auth/login-email",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    ),

  linkWallet: (params: {
    walletAddress: string;
    signature: string;
    message: string;
    signedPayload?: string; // For passkey wallets
    isPasskey?: boolean; // Flag for passkey wallet
  }) =>
    apiFetch<{ user: any; merged: boolean }>("/auth/link-wallet", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  checkWalletExists: (walletAddress: string) =>
    apiFetch<{ exists: boolean; userId?: string }>(
      `/auth/check-wallet/${walletAddress}`
    ),

  // Settings
  getMenuConfig: () => apiFetch<any[]>("/settings/menu-config"),

  // =====================================
  // API Tokens (PAT)
  // =====================================
  createApiToken: (data: { name: string; scopes: string[]; expiresAt?: string | null }) =>
    apiFetch<{ token: string; tokenMeta: any }>("/v1/tokens", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listApiTokens: () => apiFetch<any[]>("/v1/tokens"),

  revokeApiToken: (id: string) =>
    apiFetch<{ revoked: boolean }>(`/v1/tokens/${id}`, {
      method: "DELETE",
    }),

  // =====================================
  // FOLLOW API
  // =====================================

  // Follow a user
  followUser: (userId: string) =>
    apiFetch<{ message: string }>(`/users/${userId}/follow`, {
      method: "POST",
    }),

  // Unfollow a user
  unfollowUser: (userId: string) =>
    apiFetch<{ message: string }>(`/users/${userId}/follow`, {
      method: "DELETE",
    }),

  // Get follow stats for a user
  getFollowStats: (userId: string) =>
    apiFetch<{
      followersCount: number;
      followingCount: number;
      isFollowing: boolean;
      isFollowedBy: boolean;
    }>(`/users/${userId}/follow-stats`),

  // Get followers of a user
  getFollowers: (
    userId: string,
    params?: { limit?: number; offset?: number }
  ) => {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiFetch<any[]>(
      `/users/${userId}/followers${query ? `?${query}` : ""}`
    );
  },

  // Get users that a user is following
  getFollowing: (
    userId: string,
    params?: { limit?: number; offset?: number }
  ) => {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return apiFetch<any[]>(
      `/users/${userId}/following${query ? `?${query}` : ""}`
    );
  },

  // Check if user follows another user
  isFollowing: (userId: string, targetId: string) =>
    apiFetch<{ isFollowing: boolean }>(
      `/users/${userId}/is-following/${targetId}`
    ),

  // ============================================
  // NOTIFICATIONS API
  // ============================================

  // Get notifications
  getNotifications: (params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) => {
    const query = params
      ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      : "";
    return apiFetch<{
      success: boolean;
      notifications: any[];
    }>(`/notifications${query ? `?${query}` : ""}`);
  },

  // Get unread notification count
  getUnreadNotificationCount: () =>
    apiFetch<{ success: boolean; unreadCount: number }>(
      "/notifications/unread-count"
    ),

  // Mark notification as read
  markNotificationRead: (notificationId: string) =>
    apiFetch<{ success: boolean }>(`/notifications/${notificationId}/read`, {
      method: "POST",
    }),

  // Mark all notifications as read
  markAllNotificationsRead: () =>
    apiFetch<{ success: boolean; markedCount: number }>(
      "/notifications/read-all",
      {
        method: "POST",
      }
    ),

  // Delete a notification
  deleteNotification: (notificationId: string) =>
    apiFetch<{ success: boolean }>(`/notifications/${notificationId}`, {
      method: "DELETE",
    }),

  // Clear all notifications
  clearAllNotifications: () =>
    apiFetch<{ success: boolean }>("/notifications", {
      method: "DELETE",
    }),

  // =====================================
  // FEEDS API (GmiFeeds)
  // =====================================

  // Get all public feeds
  getFeeds: (params?: {
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const query = params
      ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      : "";
    return apiFetch<any>(`/feeds${query ? `?${query}` : ""}`);
  },

  // Get featured feeds for discovery
  getDiscoverFeeds: () => apiFetch<any>("/feeds/discover"),

  // Get current user's created feeds
  getMyFeeds: () => apiFetch<any>("/feeds/my"),

  // Get a specific user's public feeds
  getUserFeeds: (userId: string) => apiFetch<any>(`/feeds/user/${userId}`),

  // Get feeds user is following
  getFollowingFeeds: () => apiFetch<any>("/feeds/following"),

  // Get user's feeds for bookmark selection
  getFeedsForBookmark: (projectId: string) =>
    apiFetch<any>(`/feeds/for-bookmark/${projectId}`),

  // Get single feed by ID or slug
  getFeed: (feedIdOrSlug: string) => apiFetch<any>(`/feeds/${feedIdOrSlug}`),

  // Get items in a feed
  getFeedItems: (
    feedIdOrSlug: string,
    params?: { limit?: number; offset?: number }
  ) => {
    const query = params
      ? new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      : "";
    return apiFetch<any>(
      `/feeds/${feedIdOrSlug}/items${query ? `?${query}` : ""}`
    );
  },

  // Create a new feed
  createFeed: (data: {
    name: string;
    description?: string;
    coverImage?: string;
    visibility?: "private" | "unlisted" | "public";
  }) =>
    apiFetch<any>("/feeds", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update a feed
  updateFeed: (
    feedId: string,
    data: {
      name?: string;
      description?: string;
      coverImage?: string;
      visibility?: "private" | "unlisted" | "public";
    }
  ) =>
    apiFetch<any>(`/feeds/${feedId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Delete a feed
  deleteFeed: (feedId: string) =>
    apiFetch<any>(`/feeds/${feedId}`, {
      method: "DELETE",
    }),

  // Follow a feed
  followFeed: (feedId: string) =>
    apiFetch<any>(`/feeds/${feedId}/follow`, {
      method: "POST",
    }),

  // Unfollow a feed
  unfollowFeed: (feedId: string) =>
    apiFetch<any>(`/feeds/${feedId}/follow`, {
      method: "DELETE",
    }),

  // Add item to feed (bookmark)
  addItemToFeed: (feedId: string, data: { projectId: string; note?: string }) =>
    apiFetch<any>(`/feeds/${feedId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Remove item from feed
  removeItemFromFeed: (feedId: string, itemId: string) =>
    apiFetch<any>(`/feeds/${feedId}/items/${itemId}`, {
      method: "DELETE",
    }),

  // =====================================
  // ADMIN API
  // =====================================

  // Check admin status
  getAdminStatus: () =>
    apiFetch<{ isAdmin: boolean; role: string }>("/admin/status"),

  // Admin delete any project
  adminDeleteProject: (projectId: string) =>
    apiFetch<void>(`/admin/projects/${projectId}`, {
      method: "DELETE",
    }),

  // Admin verify project
  adminVerifyProject: (projectId: string, verified: boolean) =>
    apiFetch<void>(`/admin/projects/${projectId}/verify`, {
      method: "POST",
      body: JSON.stringify({ verified }),
    }),

  // Get all hackathons (admin view)
  getHackathons: () => apiFetch<any[]>("/admin/hackathons"),

  // Create hackathon
  createHackathon: (data: {
    slug: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    prizePool?: string;
    imageUrl?: string;
    tags?: string[];
  }) =>
    apiFetch<any>("/admin/hackathons", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update hackathon
  updateHackathon: (
    hackathonId: string,
    data: {
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      prizePool?: string;
      imageUrl?: string;
      tags?: string[];
      status?: string;
    }
  ) =>
    apiFetch<any>(`/admin/hackathons/${hackathonId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Delete hackathon
  deleteHackathon: (hackathonId: string) =>
    apiFetch<void>(`/admin/hackathons/${hackathonId}`, {
      method: "DELETE",
    }),

  // Get hackathon submissions
  getHackathonSubmissions: (hackathonId: string) =>
    apiFetch<any[]>(`/admin/hackathons/${hackathonId}/submissions`),

  // Score submission
  scoreSubmission: (
    submissionId: string,
    data: {
      score: number;
      scoreBreakdown?: {
        innovation: number;
        execution: number;
        impact: number;
        presentation: number;
      };
      adminNotes?: string;
      status?: "approved" | "rejected" | "winner" | "finalist";
    }
  ) =>
    apiFetch<any>(`/admin/submissions/${submissionId}/score`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update submission status
  updateSubmissionStatus: (
    submissionId: string,
    status: "pending" | "approved" | "rejected" | "winner" | "finalist"
  ) =>
    apiFetch<void>(`/admin/submissions/${submissionId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Get admin activity log
  getAdminActivityLog: (limit?: number) =>
    apiFetch<any[]>(`/admin/activity${limit ? `?limit=${limit}` : ""}`),

  // =============================================
  // HACKATHON SUBMISSIONS (Public)
  // =============================================

  // Get all submissions for a hackathon
  getSubmissions: (
    hackathonId: string,
    options?: {
      userId?: string;
      status?: string;
      search?: string;
      category?: string;
      sortBy?: "newest" | "votes" | "score";
      limit?: number;
      offset?: number;
    }
  ) => {
    const params = new URLSearchParams();
    if (options?.userId) params.append("userId", options.userId);
    if (options?.status) params.append("status", options.status);
    if (options?.search) params.append("search", options.search);
    if (options?.category) params.append("category", options.category);
    if (options?.sortBy) params.append("sortBy", options.sortBy);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());

    const queryString = params.toString();
    return apiFetch<any[]>(
      `/hackathons/${hackathonId}/submissions${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get single submission by ID
  getSubmissionById: (submissionId: string) =>
    apiFetch<any>(`/hackathons/submissions/${submissionId}`),

  // Create a new submission (submit idea to hackathon)
  createSubmission: (data: {
    hackathonId: string;
    projectId: string;
    pitchVideoUrl?: string;
    pitchDeckUrl?: string;
    notes?: string;
  }) =>
    apiFetch<any>("/hackathons/submissions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update a submission
  updateSubmission: (
    submissionId: string,
    data: {
      pitchVideoUrl?: string;
      pitchDeckUrl?: string;
      notes?: string;
      status?: string;
    }
  ) =>
    apiFetch<any>(`/hackathons/submissions/${submissionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete a submission
  deleteSubmission: (submissionId: string) =>
    apiFetch<void>(`/hackathons/submissions/${submissionId}`, {
      method: "DELETE",
    }),

  // Vote for a submission
  voteSubmission: (submissionId: string) =>
    apiFetch<any>(`/hackathons/submissions/${submissionId}/vote`, {
      method: "POST",
    }),

  // Unvote a submission
  unvoteSubmission: (submissionId: string) =>
    apiFetch<void>(`/hackathons/submissions/${submissionId}/vote`, {
      method: "DELETE",
    }),

  // Get my submissions for a hackathon
  getMySubmissions: (hackathonId: string) =>
    apiFetch<any[]>(`/hackathons/${hackathonId}/submissions?mine=true`),

  // =============================================
  // HACKATHON REGISTRATION
  // =============================================

  // Register for a hackathon
  registerForHackathon: (hackathonId: string, teamName?: string) =>
    apiFetch<{ id: string; registeredAt: string }>(
      `/hackathons/${hackathonId}/register`,
      {
        method: "POST",
        body: JSON.stringify({ teamName }),
      }
    ),

  // Check if user is registered for a hackathon
  getMyRegistration: (hackathonId: string) =>
    apiFetch<{ isRegistered: boolean; registration?: { id: string; teamName?: string; registeredAt: string } }>(
      `/hackathons/${hackathonId}/registration`
    ),

  // Get all participants for a hackathon
  getHackathonParticipants: (hackathonId: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString();
    return apiFetch<{ participants: any[]; total: number }>(
      `/hackathons/${hackathonId}/participants${queryString ? `?${queryString}` : ""}`
    );
  },

  // =============================================
  // HACKATHON TEAMS
  // =============================================

  // Create a new team for a hackathon
  createTeam: (hackathonId: string, data: { name: string; description?: string; isLookingForMembers?: boolean }) =>
    apiFetch<{
      id: string;
      name: string;
      description?: string;
      hackathonId: string;
      leaderId: string;
      isLookingForMembers: boolean;
      memberCount: number;
      createdAt: string;
    }>(`/hackathons/${hackathonId}/teams`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Get all teams for a hackathon
  getHackathonTeams: (hackathonId: string, lookingForMembers?: boolean, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (lookingForMembers !== undefined) params.append("lookingForMembers", lookingForMembers.toString());
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString();
    return apiFetch<{
      teams: Array<{
        id: string;
        name: string;
        description?: string;
        leaderId: string;
        leaderName: string;
        leaderAvatar?: string;
        isLookingForMembers: boolean;
        memberCount: number;
        maxMembers: number;
        members: Array<{ id: string; username: string; avatar?: string; role: string }>;
      }>;
      total: number;
    }>(`/hackathons/${hackathonId}/teams${queryString ? `?${queryString}` : ""}`);
  },

  // Get current user's team for a hackathon
  getMyTeam: (hackathonId: string) =>
    apiFetch<{
      team?: {
        id: string;
        name: string;
        description?: string;
        hackathonId: string;
        leaderId: string;
        isLookingForMembers: boolean;
        memberCount: number;
        maxMembers: number;
        members: Array<{ id: string; username: string; avatar?: string; role: string; joinedAt: string }>;
      };
      role?: 'leader' | 'member';
    }>(`/hackathons/${hackathonId}/my-team`),

  // Update a team
  updateTeam: (hackathonId: string, teamId: string, data: { name?: string; description?: string; isLookingForMembers?: boolean }) =>
    apiFetch<{
      id: string;
      name: string;
      description?: string;
      isLookingForMembers: boolean;
    }>(`/hackathons/teams/${teamId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Delete a team (leader only)
  deleteTeam: (hackathonId: string, teamId: string) =>
    apiFetch<void>(`/hackathons/teams/${teamId}`, {
      method: "DELETE",
    }),

  // Invite a user to the team
  inviteToTeam: (hackathonId: string, teamId: string, inviteeId: string) =>
    apiFetch<{
      id: string;
      teamId: string;
      invitedUserId: string;
      status: string;
      createdAt: string;
    }>(`/hackathons/teams/${teamId}/invite`, {
      method: "POST",
      body: JSON.stringify({ inviteeId }),
    }),

  // Accept a team invite
  acceptInvite: (hackathonId: string, inviteId: string) =>
    apiFetch<{
      teamId?: string;
      hackathonSlug?: string;
      message: string;
    }>(`/hackathons/teams/invites/${inviteId}/accept`, {
      method: "POST",
    }),

  // Reject a team invite
  rejectInvite: (hackathonId: string, inviteId: string) =>
    apiFetch<void>(`/hackathons/teams/invites/${inviteId}/reject`, {
      method: "POST",
    }),

  // Leave a team
  leaveTeam: (hackathonId: string, teamId: string) =>
    apiFetch<void>(`/hackathons/teams/${teamId}/leave`, {
      method: "POST",
    }),

  // Kick a member from the team (leader only)
  kickMember: (hackathonId: string, teamId: string, memberId: string) =>
    apiFetch<void>(`/hackathons/teams/${teamId}/members/${memberId}`, {
      method: "DELETE",
    }),

  // Get all pending invites for current user
  getMyInvites: (hackathonId?: string) =>
    apiFetch<Array<{
      id: string;
      teamId: string;
      teamName: string;
      hackathonId: string;
      inviterId: string;
      inviterName: string;
      inviterAvatar?: string;
      message?: string;
      status: string;
      createdAt: string;
      expiresAt: string;
    }>>(`/hackathons/teams/invites/my`),

  // ==================== ANNOUNCEMENTS ====================
  // Get user's active announcements
  getAnnouncements: () =>
    apiFetch<Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      referenceType?: string;
      referenceId?: string;
      actionUrl?: string;
      actionLabel?: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      isRead: boolean;
      createdAt: string;
      expiresAt?: string;
      metadata?: Record<string, any>;
    }>>(`/users/me/announcements`),

  // Mark announcement as read
  markAnnouncementRead: (announcementId: string) =>
    apiFetch<void>(`/users/announcements/${announcementId}/read`, {
      method: "PATCH",
    }),

  // Dismiss announcement
  dismissAnnouncement: (announcementId: string) =>
    apiFetch<void>(`/users/announcements/${announcementId}/dismiss`, {
      method: "PATCH",
    }),

  // =============================================
  // RELATED PROJECTS DETECTION API
  // =============================================

  // Search for related projects on the internet (Tavily API)
  searchRelatedProjects: (data: {
    ideaId: string;
    title: string;
    problem: string;
    solution: string;
    category?: string;
    tags?: string[];
  }) =>
    apiFetch<{
      results: Array<{
        id?: string;
        title: string;
        url: string;
        snippet: string;
        source: string;
        score: number;
      }>;
      quotaInfo: {
        remaining: number;
        used: number;
        max: number;
      };
      aiSummary?: string;
      searchMeta?: {
        query: string;
        fallbackUsed: boolean;
        rawCount: number;
      };
    }>("/ai/search-related-projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Get all related projects for an idea
  getRelatedProjects: (ideaId: string) =>
    apiFetch<{
      aiDetected: Array<{
        id: string;
        title: string;
        url: string;
        snippet: string;
        source: string;
        score: number;
        isPinned: boolean;
        createdAt: string;
      }>;
      userPinned: Array<{
        id: string;
        title: string;
        url: string;
        description?: string;
        pinnedBy: string;
        createdAt: string;
        user?: {
          username: string;
          avatar?: string;
        };
      }>;
    }>(`/ai/related-projects/${ideaId}`),

  // Pin user's own project to an idea
  pinProject: (data: {
    ideaId: string;
    projectTitle: string;
    projectUrl: string;
    projectDescription?: string;
  }) =>
    apiFetch<void>("/ai/pin-project", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Unpin user's project from an idea
  unpinProject: (ideaId: string) =>
    apiFetch<void>("/ai/unpin-project", {
      method: "POST",
      body: JSON.stringify({ ideaId }),
    }),

  // Get user's search quota for related projects
  getSearchQuota: () =>
    apiFetch<{
      canSearch: boolean;
      remaining: number;
      used: number;
      max: number;
    }>("/ai/search-quota"),

  // Clear all AI-detected related projects for an idea
  clearRelatedProjects: (ideaId: string) =>
    apiFetch<{
      deletedCount: number;
    }>("/ai/clear-related-projects", {
      method: "POST",
      body: JSON.stringify({ ideaId }),
    }),
};

