export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  walletAddress?: string
  aiCredits: number
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  title: string
  description: string
  coverImage?: string
  category: string
  tags: string[]
  projectUrl?: string
  githubUrl?: string
  techStack: string[]
  feedbackNeeded: string
  creatorId: string
  creator?: User
  aiScore?: number
  aiReview?: AIReview
  views: number
  feedbackCount: number
  status: "draft" | "published"
  createdAt: Date
  updatedAt: Date
}

export interface AIReview {
  id: string
  projectId: string
  score: number
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  summary: string
  createdAt: Date
}

export interface Feedback {
  id: string
  projectId: string
  userId: string
  user?: User
  content: string
  parentId?: string
  replies?: Feedback[]
  reactions: Record<string, number>
  tipAmount?: number
  createdAt: Date
  updatedAt: Date
}

export interface WalletType {
  name: "Phantom" | "Solflare" | "MetaMask" | "Passkey"
  icon: string
}

export interface FilterState {
  category?: string
  tags?: string[]
  sort?: "recent" | "popular" | "top-rated"
  search?: string
}
