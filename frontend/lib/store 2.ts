
import { create } from 'zustand';
import { Project, User, Comment, Notification } from './types';
import { PROJECTS } from '../constants';

type View = 'landing' | 'dashboard' | 'upload' | 'project-detail' | 'profile';

interface AppState {
  user: User | null;
  viewedUser: User | null; // State to track which profile we are looking at
  walletConnected: boolean;
  projects: Project[];
  isLoading: boolean;
  isNavigating: boolean;
  isWalletModalOpen: boolean;
  
  // Navigation & Search State
  currentView: View;
  selectedProjectId: string | null;
  searchQuery: string;
  notifications: Notification[];
  
  // Actions
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  updateUserProfile: (data: Partial<User>) => void;
  
  // Navigation Actions
  openUserProfile: (author: { username: string; wallet: string; avatar?: string }) => void;
  
  addProject: (project: Project) => void;
  updateProject: (data: Partial<Project> & { id: string }) => void;
  deleteProject: (id: string) => void;
  voteProject: (id: string) => void;
  
  // Comment Actions
  addComment: (projectId: string, content: string, author: string) => void;
  replyComment: (projectId: string, commentId: string, content: string, author: string) => void;
  likeComment: (projectId: string, commentId: string) => void;
  dislikeComment: (projectId: string, commentId: string) => void;
  tipComment: (projectId: string, commentId: string, amount: number) => void;
  
  // Navigation & UI Actions
  setView: (view: View) => void;
  navigateToProject: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  viewedUser: null,
  walletConnected: false,
  projects: PROJECTS,
  isLoading: false,
  isNavigating: false,
  isWalletModalOpen: false,
  currentView: 'landing',
  selectedProjectId: null,
  searchQuery: '',
  notifications: [
    { id: '1', message: 'Welcome to Gimme Idea! Start by exploring projects.', type: 'info', read: false, timestamp: '2m ago' },
    { id: '2', message: 'SolStream Protocol just launched on Mainnet.', type: 'success', read: false, timestamp: '1h ago' },
    { id: '3', message: 'New bounty available: 500 USDC for Rust audit.', type: 'warning', read: false, timestamp: '3h ago' }
  ],

  openWalletModal: () => set({ isWalletModalOpen: true }),
  closeWalletModal: () => set({ isWalletModalOpen: false }),

  connectWallet: async (walletType: string) => {
    set({ isLoading: true });
    // Simulate delay based on wallet provider
    await new Promise(resolve => setTimeout(resolve, 1500));
    set({
      isLoading: false,
      walletConnected: true,
      isWalletModalOpen: false, // Close modal on success
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

  updateUserProfile: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null
  })),

  openUserProfile: (author) => {
    // If clicking own profile, just set view. If another user, construct a mock user object for display
    set((state) => {
        const isOwnProfile = state.user?.username === author.username;
        const displayedUser: User = isOwnProfile && state.user ? state.user : {
            username: author.username,
            wallet: author.wallet,
            avatar: author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`,
            reputation: Math.floor(Math.random() * 1000),
            balance: 0,
            projects: [],
            bio: `Builder on Solana. Building cool stuff.`,
            socials: {
                twitter: `https://twitter.com/${author.username}`,
                github: `https://github.com/${author.username}`
            }
        };
        
        return {
            viewedUser: displayedUser,
            currentView: 'profile'
        };
    });
  },

  addProject: (project) => {
    set((state) => ({ 
      projects: [project, ...state.projects],
      currentView: 'dashboard'
    }));
  },

  updateProject: (data) => set((state) => ({
    projects: state.projects.map(p => 
        p.id === data.id ? { ...p, ...data } : p
    )
  })),

  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id)
  })),

  voteProject: (id) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === id ? { ...p, votes: p.votes + 1 } : p
    )
  })),

  addComment: (projectId, content, author) => set((state) => ({
    projects: state.projects.map(p => {
      if (p.id === projectId) {
        const newComment: Comment = {
          id: Math.random().toString(36).substr(2, 9),
          author,
          content,
          timestamp: 'Just now',
          likes: 0,
          dislikes: 0,
          tips: 0,
          replies: []
        };
        return { ...p, comments: [newComment, ...(p.comments || [])], feedbackCount: p.feedbackCount + 1 };
      }
      return p;
    })
  })),

  replyComment: (projectId, commentId, content, author) => set((state) => ({
    projects: state.projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          comments: p.comments?.map(c => {
            if (c.id === commentId) {
              const reply: Comment = {
                id: Math.random().toString(36).substr(2, 9),
                author,
                content,
                timestamp: 'Just now',
                likes: 0,
                dislikes: 0,
                tips: 0,
                replies: []
              };
              return { ...c, replies: [...(c.replies || []), reply] };
            }
            return c;
          })
        };
      }
      return p;
    })
  })),

  likeComment: (projectId, commentId) => set((state) => ({
    projects: state.projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          comments: p.comments?.map(c => {
            if (c.id === commentId) return { ...c, likes: c.likes + 1 };
            // Check nested replies (1 level deep for demo)
            if (c.replies) {
                const updatedReplies = c.replies.map(r => 
                    r.id === commentId ? { ...r, likes: r.likes + 1 } : r
                );
                return { ...c, replies: updatedReplies };
            }
            return c;
          })
        };
      }
      return p;
    })
  })),

  dislikeComment: (projectId, commentId) => set((state) => ({
    projects: state.projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            comments: p.comments?.map(c => {
              if (c.id === commentId) return { ...c, dislikes: c.dislikes + 1 };
              if (c.replies) {
                  const updatedReplies = c.replies.map(r => 
                      r.id === commentId ? { ...r, dislikes: r.dislikes + 1 } : r
                  );
                  return { ...c, replies: updatedReplies };
              }
              return c;
            })
          };
        }
        return p;
      })
  })),

  tipComment: (projectId, commentId, amount) => set((state) => ({
    projects: state.projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            comments: p.comments?.map(c => {
              if (c.id === commentId) return { ...c, tips: c.tips + amount };
              if (c.replies) {
                  const updatedReplies = c.replies.map(r => 
                      r.id === commentId ? { ...r, tips: r.tips + amount } : r
                  );
                  return { ...c, replies: updatedReplies };
              }
              return c;
            })
          };
        }
        return p;
    })
  })),

  setView: (view) => {
    set({ currentView: view });
    // If navigating away from profile, reset viewedUser unless we are going to profile specifically
    if (view !== 'profile') {
        set({ viewedUser: null });
    } else if (!get().viewedUser && get().user) {
        // If navigating to profile but viewedUser is null, assume my profile
        set({ viewedUser: get().user });
    }
  },
  
  navigateToProject: async (id) => {
    set({ isNavigating: true });
    // Artificial delay for loading effect
    await new Promise(resolve => setTimeout(resolve, 1200));
    set({ 
      currentView: 'project-detail', 
      selectedProjectId: id,
      isNavigating: false
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  clearNotifications: () => set({ notifications: [] })
}));
