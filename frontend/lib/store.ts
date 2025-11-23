
import { create } from 'zustand';
import { Project, User, Comment, Notification } from './types';
import { apiClient } from './api-client';

type View = 'landing' | 'projects-dashboard' | 'ideas-dashboard' | 'project-detail' | 'idea-detail' | 'profile' | 'donate';

interface AppState {
  user: User | null;
  viewedUser: User | null;
  walletConnected: boolean;
  projects: Project[];
  isLoading: boolean;
  isNavigating: boolean;
  isWalletModalOpen: boolean;
  
  // Connect Wallet Reminder State
  isConnectReminderOpen: boolean;

  // Submission Modal State
  isSubmitModalOpen: boolean;
  submitType: 'project' | 'idea';
  
  // Navigation & Search State
  currentView: View;
  selectedProjectId: string | null;
  searchQuery: string;
  notifications: Notification[];
  
  // Actions
  openWalletModal: () => void;
  closeWalletModal: () => void;

  openConnectReminder: () => void;
  closeConnectReminder: () => void;

  openSubmitModal: (type: 'project' | 'idea') => void;
  closeSubmitModal: () => void;

  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;

  openUserProfile: (author: { username: string; wallet: string; avatar?: string }) => Promise<void>;

  fetchProjects: (filters?: { type?: 'project' | 'idea'; category?: string; search?: string }) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'votes' | 'feedbackCount' | 'createdAt' | 'author' | 'comments'>) => Promise<void>;
  updateProject: (data: Partial<Project> & { id: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  voteProject: (id: string) => Promise<void>;
  
  // Comment Actions (Updated to support anonymous)
  addComment: (projectId: string, content: string, isAnonymous?: boolean) => Promise<void>;
  replyComment: (projectId: string, commentId: string, content: string, isAnonymous?: boolean) => Promise<void>;
  likeComment: (projectId: string, commentId: string) => Promise<void>;
  dislikeComment: (projectId: string, commentId: string) => Promise<void>;
  tipComment: (projectId: string, commentId: string, amount: number) => Promise<void>;
  
  setView: (view: View) => void;
  navigateToProject: (id: string, type: 'project' | 'idea') => Promise<void>;
  setSearchQuery: (query: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  viewedUser: null,
  walletConnected: false,
  projects: [],
  isLoading: false,
  isNavigating: false,
  isWalletModalOpen: false,
  isConnectReminderOpen: false,
  isSubmitModalOpen: false,
  submitType: 'project',
  currentView: 'landing',
  selectedProjectId: null,
  searchQuery: '',
  notifications: [],

  openWalletModal: () => set({ isWalletModalOpen: true }),
  closeWalletModal: () => set({ isWalletModalOpen: false }),

  openConnectReminder: () => set({ isConnectReminderOpen: true }),
  closeConnectReminder: () => set({ isConnectReminderOpen: false }),

  openSubmitModal: (type) => {
    const { user } = get();
    // Gate submission: If no user, show reminder instead of form
    if (!user) {
        set({ isConnectReminderOpen: true });
        return;
    }
    set({ isSubmitModalOpen: true, submitType: type });
  },
  closeSubmitModal: () => set({ isSubmitModalOpen: false }),

  connectWallet: async (walletType: string) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 1500));
    set({
      isLoading: false,
      walletConnected: true,
      isWalletModalOpen: false,
      user: {
        wallet: '8xF3...92a',
        username: 'anon_builder',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anon_builder',
        bio: 'Solana developer building the future of DeFi. Rust enthusiast.',
        reputation: 420,
        balance: 1250.50,
        projects: [],
        socials: {
            twitter: 'https://twitter.com/solana',
            github: 'https://github.com/solana-labs'
        }
      }
    });
  },

  disconnectWallet: () => {
    set({ user: null, walletConnected: false, currentView: 'landing' });
  },

  updateUserProfile: async (data) => {
    try {
      const response = await apiClient.updateUserProfile(data);
      if (response.success && response.data) {
        set((state) => ({
          user: state.user ? { ...state.user, ...response.data } : null
        }));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  openUserProfile: async (author) => {
    const state = get();
    const isOwnProfile = state.user?.username === author.username;

    if (isOwnProfile && state.user) {
      set({ viewedUser: state.user, currentView: 'profile' });
      return;
    }

    try {
      set({ isLoading: true });
      const response = await apiClient.getUserByUsername(author.username);
      if (response.success && response.data) {
        const userData = response.data;
        const displayedUser: User = {
          username: userData.username,
          wallet: userData.wallet,
          avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
          reputation: userData.reputationScore || 0,
          balance: userData.balance || 0,
          projects: [],
          bio: userData.bio || 'Builder on Solana',
          socials: userData.socialLinks || {}
        };
        set({ viewedUser: displayedUser, currentView: 'profile', isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      set({ isLoading: false });
    }
  },

  fetchProjects: async (filters) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.getProjects(filters);
      if (response.success && response.data) {
        set({ projects: response.data, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      set({ isLoading: false });
    }
  },

  addProject: async (project) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.createProject(project);
      if (response.success && response.data) {
        set((state) => ({
          projects: [response.data, ...state.projects],
          currentView: project.type === 'project' ? 'projects-dashboard' : 'ideas-dashboard',
          isLoading: false,
          isSubmitModalOpen: false
        }));
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateProject: async (data) => {
    try {
      const response = await apiClient.updateProject(data.id, data);
      if (response.success && response.data) {
        set((state) => ({
          projects: state.projects.map(p => p.id === data.id ? response.data : p)
        }));
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await apiClient.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  voteProject: async (id) => {
    try {
      const response = await apiClient.voteProject(id);
      if (response.success && response.data) {
        set((state) => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, votes: response.data.votes } : p
          )
        }));
      }
    } catch (error) {
      console.error('Failed to vote on project:', error);
      throw error;
    }
  },

  addComment: async (projectId, content, isAnonymous = false) => {
    try {
      const response = await apiClient.createComment({
        projectId,
        content,
        isAnonymous
      });
      if (response.success && response.data) {
        // Refresh project to get updated comments
        const projectResponse = await apiClient.getProject(projectId);
        if (projectResponse.success && projectResponse.data) {
          set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? projectResponse.data : p)
          }));
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  },

  replyComment: async (projectId, commentId, content, isAnonymous = false) => {
    try {
      const response = await apiClient.createComment({
        projectId,
        content,
        parentCommentId: commentId,
        isAnonymous
      });
      if (response.success && response.data) {
        // Refresh project to get updated comments
        const projectResponse = await apiClient.getProject(projectId);
        if (projectResponse.success && projectResponse.data) {
          set((state) => ({
            projects: state.projects.map(p => p.id === projectId ? projectResponse.data : p)
          }));
        }
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      throw error;
    }
  },

  likeComment: async (projectId, commentId) => {
    try {
      await apiClient.likeComment(commentId);
      // Refresh project to get updated comment likes
      const projectResponse = await apiClient.getProject(projectId);
      if (projectResponse.success && projectResponse.data) {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? projectResponse.data : p)
        }));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
      throw error;
    }
  },

  dislikeComment: async (projectId, commentId) => {
    try {
      await apiClient.dislikeComment(commentId);
      // Refresh project to get updated comment dislikes
      const projectResponse = await apiClient.getProject(projectId);
      if (projectResponse.success && projectResponse.data) {
        set((state) => ({
          projects: state.projects.map(p => p.id === projectId ? projectResponse.data : p)
        }));
      }
    } catch (error) {
      console.error('Failed to dislike comment:', error);
      throw error;
    }
  },

  tipComment: async (projectId, commentId, amount) => {
    try {
      // This would require payment verification flow with Solana transaction
      // For now, just update optimistically
      console.log('Tip comment functionality requires Solana payment integration');
      // After payment is verified, the backend would update the tips_amount
      // and we would refresh the project data
    } catch (error) {
      console.error('Failed to tip comment:', error);
      throw error;
    }
  },

  setView: (view) => {
    set({ currentView: view });
    if (view !== 'profile') {
        set({ viewedUser: null });
    } else if (!get().viewedUser && get().user) {
        set({ viewedUser: get().user });
    }
  },
  
  navigateToProject: async (id, type) => {
    set({ isNavigating: true });

    try {
      // Fetch project details if not already in store
      const state = get();
      const existingProject = state.projects.find(p => p.id === id);

      if (!existingProject) {
        const response = await apiClient.getProject(id);
        if (response.success && response.data) {
          set((state) => ({
            projects: [response.data, ...state.projects]
          }));
        }
      }

      set({
        currentView: type === 'project' ? 'project-detail' : 'idea-detail',
        selectedProjectId: id,
        isNavigating: false
      });
    } catch (error) {
      console.error('Failed to navigate to project:', error);
      set({ isNavigating: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  clearNotifications: () => set({ notifications: [] })
}));
