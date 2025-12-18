// API wrapper that uses Supabase directly
// This file provides a consistent interface for components

import {
  getIdeas,
  getIdeaById,
  createIdea,
  voteIdea,
  getComments,
  createComment,
  recordTransaction,
  getCurrentUser,
  loginWithWallet,
  type Project,
  type Comment,
  type User,
} from './supabase';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const api = {
  // Auth - Sử dụng wallet address làm authentication
  login: async (params: { publicKey: string }): Promise<ApiResponse<{ user: User }>> => {
    try {
      // Tạo hoặc cập nhật user trong Supabase
      const user = await loginWithWallet(params.publicKey);
      if (user) {
        // Lưu wallet address vào localStorage để dùng cho các request sau
        localStorage.setItem('wallet_address', params.publicKey);
        return { success: true, data: { user } };
      }
      return { success: false, error: 'Failed to create user' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('wallet_address');
    return { success: true };
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) {
        return { success: false, error: 'Not logged in' };
      }
      const user = await getCurrentUser(walletAddress);
      if (user) {
        return { success: true, data: user };
      }
      return { success: false, error: 'User not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Ideas/Projects
  getIdeas: async (params?: { limit?: number; search?: string }): Promise<ApiResponse<Project[]>> => {
    try {
      const projects = await getIdeas(params?.limit, params?.search);
      return { success: true, data: projects };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getIdea: async (id: string): Promise<ApiResponse<Project>> => {
    try {
      const project = await getIdeaById(id);
      if (project) {
        return { success: true, data: project };
      }
      return { success: false, error: 'Idea not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  createIdea: async (data: {
    title: string;
    description: string;
    problem: string;
    solution: string;
    category: string;
    tags: string[];
  }): Promise<ApiResponse<Project>> => {
    try {
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) {
        return { success: false, error: 'Please connect wallet first' };
      }

      // Lấy user ID từ wallet address
      const user = await getCurrentUser(walletAddress);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const project = await createIdea({
        title: data.title,
        description: data.description,
        problem: data.problem,
        solution: data.solution,
        category: data.category,
        tags: data.tags,
        author_id: user.id,
      });

      if (project) {
        return { success: true, data: project };
      }
      return { success: false, error: 'Failed to create idea' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  voteIdea: async (id: string): Promise<ApiResponse<{ votes: number }>> => {
    try {
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) {
        return { success: false, error: 'Please connect wallet first' };
      }

      const user = await getCurrentUser(walletAddress);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      await voteIdea(id, user.id);
      // Fetch updated vote count
      const updated = await getIdeaById(id);
      return { success: true, data: { votes: updated?.votes || 0 } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Comments
  getComments: async (projectId: string): Promise<ApiResponse<Comment[]>> => {
    try {
      const comments = await getComments(projectId);
      return { success: true, data: comments };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  createComment: async (data: { projectId: string; content: string }): Promise<ApiResponse<Comment>> => {
    try {
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) {
        return { success: false, error: 'Please connect wallet first' };
      }

      const user = await getCurrentUser(walletAddress);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const comment = await createComment({ 
        project_id: data.projectId, 
        user_id: user.id, 
        content: data.content 
      });
      if (comment) {
        return { success: true, data: comment };
      }
      return { success: false, error: 'Failed to create comment' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Payments - Ghi nhận transaction sau khi tip thành công
  recordTip: async (data: {
    signature: string;
    amount: number;
    projectId: string;
    recipientAddress: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) {
        return { success: false, error: 'Please connect wallet first' };
      }

      const user = await getCurrentUser(walletAddress);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const transaction = await recordTransaction({
        tx_hash: data.signature,
        from_wallet: walletAddress,
        to_wallet: data.recipientAddress,
        amount: data.amount,
        type: 'tip',
        project_id: data.projectId,
        user_id: user.id,
      });

      if (transaction) {
        return { success: true, data: transaction };
      }
      return { success: false, error: 'Failed to record tip' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export type { ApiResponse };
