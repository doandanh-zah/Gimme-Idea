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

    // If response contains token, save it
    if (data.data?.token) {
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
    category?: string;
    stage?: string;
    search?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
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
};
