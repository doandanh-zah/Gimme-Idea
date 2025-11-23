/**
 * API Client for Gimme Idea Backend
 * Handles all HTTP requests to the NestJS backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // If response contains token, save it
    if (data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
    }

    return data;
  } catch (error: any) {
    console.error('API fetch error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
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
    apiFetch<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getCurrentUser: () => apiFetch<any>('/auth/me'),

  healthCheck: () => apiFetch('/auth/health'),

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
    return apiFetch<any[]>(`/projects${query ? `?${query}` : ''}`);
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
    apiFetch<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, data: any) =>
    apiFetch<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    apiFetch<void>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  voteProject: (id: string) =>
    apiFetch<{ votes: number }>(`/projects/${id}/vote`, {
      method: 'POST',
    }),

  // Comments
  getProjectComments: (projectId: string) =>
    apiFetch<any[]>(`/comments/project/${projectId}`),

  createComment: (data: { projectId: string; content: string; parentCommentId?: string }) =>
    apiFetch<any>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  likeComment: (commentId: string) =>
    apiFetch<{ likes: number }>(`/comments/${commentId}/like`, {
      method: 'POST',
    }),

  // Payments (if you have payment endpoints)
  verifyTransaction: (data: {
    signature: string;
    type: 'tip' | 'bounty' | 'reward';
    amount: number;
    commentId?: string;
    projectId?: string;
  }) =>
    apiFetch<any>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
