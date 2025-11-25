
import { create } from 'zustand';
import { Project, User, Comment, Notification } from './types';
import { apiClient } from './api-client';
import { buildCommentTree } from './comment-utils';

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
  setUser: (user: User) => void;
  setWalletConnected: (connected: boolean) => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;

  openUserProfile: (author: { username: string; wallet: string; avatar?: string }) => Promise<void>;

  fetchProjects: (filters?: { type?: 'project' | 'idea'; category?: string; search?: string }) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'votes' | 'feedbackCount' | 'createdAt' | 'author' | 'comments'>) => Promise<void>;
  updateProject: (data: Partial<Project> & { id: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  voteProject: (id: string) => Promise<void>;

  // Realtime handlers
  handleRealtimeNewProject: (project: any) => void;
  handleRealtimeUpdateProject: (project: any) => void;
  handleRealtimeDeleteProject: (projectId: string) => void;
  handleRealtimeNewComment: (projectId: string, comment: any) => void;
  handleRealtimeUpdateComment: (projectId: string, comment: any) => void;
  handleRealtimeDeleteComment: (projectId: string, commentId: string) => void;

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
      currentView: 'ideas-dashboard', // Auto-redirect to Ideas Dashboard after wallet connect
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

  setUser: (user) => {
    set({ user });
  },

  setWalletConnected: (connected) => {
    set({ walletConnected: connected });
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
        // Map imageUrl to image for frontend compatibility
        const projects = response.data.map(p => ({
          ...p,
          image: p.imageUrl || p.image
        }));
        set({ projects, isLoading: false });
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
        // Map imageUrl to image for frontend compatibility
        const newProject = {
          ...response.data,
          image: response.data.imageUrl || response.data.image
        };
        set((state) => ({
          projects: [newProject, ...state.projects],
          currentView: project.type === 'project' ? 'projects-dashboard' : 'ideas-dashboard',
          isLoading: false
          // Note: isSubmitModalOpen is controlled by SubmissionModal to show success animation
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

  // Realtime event handlers
  handleRealtimeNewProject: (projectData) => {
    const newProject: Project = {
      id: projectData.id,
      type: projectData.type || 'project',
      title: projectData.title,
      description: projectData.description,
      category: projectData.category,
      votes: projectData.votes || 0,
      feedbackCount: projectData.feedback_count || 0,
      stage: projectData.stage,
      tags: projectData.tags || [],
      website: projectData.website,
      author: projectData.is_anonymous ? null : (projectData.author || null),
      bounty: projectData.bounty,
      image: projectData.image_url,
      problem: projectData.problem,
      solution: projectData.solution,
      opportunity: projectData.opportunity,
      goMarket: projectData.go_market,
      teamInfo: projectData.team_info,
      isAnonymous: projectData.is_anonymous,
      createdAt: projectData.created_at,
      comments: [],
    };

    set((state) => {
      // Check if project already exists (avoid duplicates)
      const exists = state.projects.some(p => p.id === newProject.id);
      if (exists) return state;

      return {
        projects: [newProject, ...state.projects]
      };
    });
  },

  handleRealtimeUpdateProject: (projectData) => {
    set((state) => {
      const existingProject = state.projects.find(p => p.id === projectData.id);
      if (!existingProject) return state;

      const updatedProject: Project = {
        ...existingProject,
        type: projectData.type || existingProject.type,
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        votes: projectData.votes || 0,
        feedbackCount: projectData.feedback_count || 0,
        stage: projectData.stage,
        tags: projectData.tags || [],
        website: projectData.website,
        bounty: projectData.bounty,
        image: projectData.image_url,
        problem: projectData.problem,
        solution: projectData.solution,
        opportunity: projectData.opportunity,
        goMarket: projectData.go_market,
        teamInfo: projectData.team_info,
        isAnonymous: projectData.is_anonymous,
      };

      return {
        projects: state.projects.map(p => p.id === projectData.id ? updatedProject : p)
      };
    });
  },

  handleRealtimeDeleteProject: (projectId) => {
    set((state) => ({
      projects: state.projects.filter(p => p.id !== projectId)
    }));
  },

  handleRealtimeNewComment: (projectId, commentData) => {
    set((state) => {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return state;

      const newComment: Comment = {
        id: commentData.id,
        projectId: commentData.project_id,
        content: commentData.content,
        author: commentData.is_anonymous ? null : commentData.author,
        likes: commentData.likes || 0,
        dislikes: commentData.dislikes || 0,
        parentCommentId: commentData.parent_comment_id,
        isAnonymous: commentData.is_anonymous,
        tipsAmount: commentData.tips_amount || 0,
        createdAt: commentData.created_at,
        replies: [],
      };

      // Check if it's a reply or a top-level comment
      if (newComment.parentCommentId) {
        // It's a reply - add it to the parent comment
        const addReplyToParent = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === newComment.parentCommentId) {
              // Check if reply already exists (avoid duplicates)
              const replyExists = comment.replies?.some(r => r.id === newComment.id);
              if (replyExists) return comment;

              return {
                ...comment,
                replies: [...(comment.replies || []), newComment]
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: addReplyToParent(comment.replies)
              };
            }
            return comment;
          });
        };

        const updatedProject = {
          ...project,
          comments: addReplyToParent(project.comments || []),
          feedbackCount: (project.feedbackCount || 0) + 1
        };

        return {
          projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
        };
      } else {
        // It's a top-level comment - check if it already exists
        const commentExists = project.comments?.some(c => c.id === newComment.id);
        if (commentExists) return state;

        const updatedProject = {
          ...project,
          comments: [...(project.comments || []), newComment],
          feedbackCount: (project.feedbackCount || 0) + 1
        };

        return {
          projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
        };
      }
    });
  },

  handleRealtimeUpdateComment: (projectId, commentData) => {
    set((state) => {
      const project = state.projects.find(p => p.id === projectId);
      if (!project || !project.comments) return state;

      const updateComment = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentData.id) {
            return {
              ...comment,
              content: commentData.content,
              likes: commentData.likes || 0,
              dislikes: commentData.dislikes || 0,
              tipsAmount: commentData.tips_amount || 0,
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateComment(comment.replies)
            };
          }
          return comment;
        });
      };

      const updatedProject = {
        ...project,
        comments: updateComment(project.comments)
      };

      return {
        projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
      };
    });
  },

  handleRealtimeDeleteComment: (projectId, commentId) => {
    set((state) => {
      const project = state.projects.find(p => p.id === projectId);
      if (!project || !project.comments) return state;

      const removeComment = (comments: Comment[]): Comment[] => {
        return comments
          .filter(c => c.id !== commentId)
          .map(comment => {
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: removeComment(comment.replies)
              };
            }
            return comment;
          });
      };

      const updatedComments = removeComment(project.comments);
      const commentCountDiff = (project.comments.length - updatedComments.length);

      const updatedProject = {
        ...project,
        comments: updatedComments,
        feedbackCount: Math.max(0, (project.feedbackCount || 0) - commentCountDiff)
      };

      return {
        projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
      };
    });
  },

  addComment: async (projectId, content, isAnonymous = false) => {
    try {
      const response = await apiClient.createComment({
        projectId,
        content,
        isAnonymous
      });
      if (response.success && response.data) {
        // Optimistic update: Add comment immediately without refetching
        const newComment = response.data;
        set((state) => {
          const project = state.projects.find(p => p.id === projectId);
          if (!project) return state;

          const updatedProject = {
            ...project,
            comments: [...(project.comments || []), newComment],
            feedbackCount: (project.feedbackCount || 0) + 1
          };

          return {
            projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
          };
        });
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
        // Optimistic update: Add reply immediately
        const newReply = response.data;
        set((state) => {
          const project = state.projects.find(p => p.id === projectId);
          if (!project || !project.comments) return state;

          // Add reply to parent comment
          const updateCommentsWithReply = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newReply]
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateCommentsWithReply(comment.replies)
                };
              }
              return comment;
            });
          };

          const updatedProject = {
            ...project,
            comments: updateCommentsWithReply(project.comments),
            feedbackCount: (project.feedbackCount || 0) + 1
          };

          return {
            projects: state.projects.map(p => p.id === projectId ? updatedProject : p)
          };
        });
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
        // Transform flat comments to nested structure
        if (projectResponse.data.comments && projectResponse.data.comments.length > 0) {
          projectResponse.data.comments = buildCommentTree(projectResponse.data.comments);
        }
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
        // Transform flat comments to nested structure
        if (projectResponse.data.comments && projectResponse.data.comments.length > 0) {
          projectResponse.data.comments = buildCommentTree(projectResponse.data.comments);
        }
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
      // Fetch project details if not already in store OR if it doesn't have comments
      const state = get();
      const existingProject = state.projects.find(p => p.id === id);
      const needsFetch = !existingProject || !existingProject.comments || existingProject.comments.length === 0;

      if (needsFetch) {
        // Fetch full project data with comments
        const response = await apiClient.getProject(id);
        if (response.success && response.data) {
          // Map imageUrl to image for frontend compatibility
          const project = {
            ...response.data,
            image: response.data.imageUrl || response.data.image
          };
          // Transform flat comments to nested structure
          if (project.comments && project.comments.length > 0) {
            project.comments = buildCommentTree(project.comments);
          }

          if (existingProject) {
            // Update existing project with full data
            set((state) => ({
              projects: state.projects.map(p => p.id === id ? project : p)
            }));
          } else {
            // Add new project to store
            set((state) => ({
              projects: [project, ...state.projects]
            }));
          }
        }
      } else {
        // Transform existing project's comments if not already transformed
        const hasNestedReplies = existingProject.comments.some(c => c.replies && c.replies.length > 0);
        if (!hasNestedReplies) {
          const transformedProject = {
            ...existingProject,
            comments: buildCommentTree(existingProject.comments)
          };
          set((state) => ({
            projects: state.projects.map(p => p.id === id ? transformedProject : p)
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
