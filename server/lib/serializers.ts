import type { User, Project, Feedback, Tip, Notification, AIChat } from "@prisma/client"

export const sanitizeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  emailVerified: user.emailVerified,
  avatar: user.avatar,
  bio: user.bio,
  walletAddress: user.walletAddress,
  walletType: user.walletType,
  walletConnectedAt: user.walletConnectedAt,
  aiCredits: user.aiCredits,
  reputation: user.reputation,
  totalTipsReceived: user.totalTipsReceived,
  totalTipsGiven: user.totalTipsGiven,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt,
})

export const sanitizeProject = (project: Project) => project

export const sanitizeFeedback = (feedback: Feedback) => feedback

export const sanitizeTip = (tip: Tip) => tip

export const sanitizeNotification = (notification: Notification) => notification

export const sanitizeAiChat = (chat: AIChat) => chat
