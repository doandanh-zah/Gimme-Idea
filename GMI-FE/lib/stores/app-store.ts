import { create } from "zustand"

interface Wallet {
  address: string | null
  type: "phantom" | "solflare" | "lazorkit" | null
  connected: boolean
}

interface UserProfile {
  wallet_address: string
  name: string
  bio: string
  avatar_url?: string
  created_at: string
}

interface Post {
  id: string
  wallet_address: string
  title: string
  description: string
  short_description: string
  image_url?: string
  project_link: string
  category: string
  prize_pool_amount: number
  prize_pool_count: number
  ends_at?: string
  escrow_locked: boolean
  created_at: string
}

// Transform backend camelCase response to app store snake_case format
export function transformBackendPost(backendPost: any): Post {
  return {
    id: backendPost.id,
    wallet_address: backendPost.wallet?.address || backendPost.walletAddress || '',
    title: backendPost.title,
    description: backendPost.description,
    short_description: backendPost.description?.substring(0, 100) + (backendPost.description?.length > 100 ? '...' : ''),
    image_url: backendPost.imageUrl,
    project_link: backendPost.projectLink,
    category: backendPost.category,
    prize_pool_amount: backendPost.prizePool?.totalAmount || 0,
    prize_pool_count: backendPost.prizePool?.winnersCount || 0,
    ends_at: backendPost.prizePool?.endsAt,
    escrow_locked: !!backendPost.prizePool?.escrowTx,
    created_at: backendPost.createdAt
  }
}

interface AppState {
  // Access
  hasAccess: boolean
  setHasAccess: (value: boolean) => void

  // Wallet
  wallet: Wallet
  setWallet: (wallet: Wallet) => void
  disconnectWallet: () => void

  // User Profile
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile | null) => void

  // Posts
  posts: Post[]
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  currentPost: Post | null
  setCurrentPost: (post: Post | null) => void

  // UI
  loading: boolean
  setLoading: (value: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Access
  hasAccess: typeof window !== 'undefined' ? localStorage.getItem('gmi-access') === 'true' : false,
  setHasAccess: (value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gmi-access', value.toString())
    }
    set({ hasAccess: value })
  },

  // Wallet
  wallet: { address: null, type: null, connected: false },
  setWallet: (wallet) => set({ wallet }),
  disconnectWallet: () => set({ wallet: { address: null, type: null, connected: false } }),

  // User Profile
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),

  // Posts
  posts: [],
  setPosts: (posts) => set({ posts: posts.map(transformBackendPost) }),
  addPost: (post) => set((state) => ({ posts: [transformBackendPost(post), ...state.posts] })),
  currentPost: null,
  setCurrentPost: (post) => set({ currentPost: post ? transformBackendPost(post) : null }),

  // UI
  loading: false,
  setLoading: (value) => set({ loading: value }),
}))
