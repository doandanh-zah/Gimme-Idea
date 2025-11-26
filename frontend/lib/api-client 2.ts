/**
 * API Client for Gimme Idea Backend
 * Handles all HTTP requests to the NestJS backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuthToken();
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== Auth Methods ====================

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private clearAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Login with Solana wallet signature
   */
  async login(data: {
    publicKey: string;
    signature: string;
    message: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.client.post('/auth/login', data);
    if (response.data.success && response.data.data.token) {
      this.setAuthToken(response.data.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }
    return response.data;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.client.get('/auth/health');
    return response.data;
  }

  // ==================== Projects Methods ====================

  /**
   * Get all projects with optional filters
   */
  async getProjects(params?: {
    category?: string;
    stage?: string;
    sort?: string;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  /**
   * Get single project by ID
   */
  async getProject(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  /**
   * Create new project
   */
  async createProject(data: {
    title: string;
    description: string;
    category: string;
    stage: string;
    tags: string[];
    bounty?: number;
    images?: string[];
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      category: string;
      stage: string;
      tags: string[];
      bounty: number;
    }>
  ): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/projects/${id}`, data);
    return response.data;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/projects/${id}`);
    return response.data;
  }

  /**
   * Vote for project
   */
  async voteProject(id: string): Promise<ApiResponse<{ votes: number }>> {
    const response = await this.client.post(`/projects/${id}/vote`);
    return response.data;
  }

  // ==================== Comments Methods ====================

  /**
   * Get comments for a project
   */
  async getComments(projectId: string): Promise<ApiResponse<any[]>> {
    const response = await this.client.get(`/comments/project/${projectId}`);
    return response.data;
  }

  /**
   * Create new comment
   */
  async createComment(data: {
    projectId: string;
    content: string;
    parentCommentId?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/comments', data);
    return response.data;
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<ApiResponse<{ likes: number }>> {
    const response = await this.client.post(`/comments/${commentId}/like`);
    return response.data;
  }

  // ==================== Users Methods ====================

  /**
   * Get user profile by username
   */
  async getUserProfile(username: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/users/${username}`);
    return response.data;
  }

  /**
   * Get user's projects
   */
  async getUserProjects(username: string): Promise<ApiResponse<any[]>> {
    const response = await this.client.get(`/users/${username}/projects`);
    return response.data;
  }

  /**
   * Update own profile
   */
  async updateProfile(data: {
    username?: string;
    bio?: string;
    avatar?: string;
    socialLinks?: {
      twitter?: string;
      github?: string;
      website?: string;
    };
  }): Promise<ApiResponse<any>> {
    const response = await this.client.patch('/users/profile', data);
    return response.data;
  }

  // ==================== Payments Methods ====================

  /**
   * Verify Solana transaction
   */
  async verifyTransaction(data: {
    signature: string;
    type: 'tip' | 'bounty' | 'reward';
    recipientWallet: string;
    amount: number;
    projectId?: string;
    commentId?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/payments/verify', data);
    return response.data;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/payments/history');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse };
