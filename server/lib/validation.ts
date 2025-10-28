import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(32),
})

export const walletConnectSchema = z.object({
  walletAddress: z.string().min(32),
  walletType: z.enum(["phantom", "solflare", "metamask", "passkey"]),
  signature: z.string(),
})

export const projectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(50).max(5000),
  category: z.enum(["web3", "ai", "saas", "mobile", "other"]),
  tags: z.array(z.string().min(1).max(20)).max(5),
  techStack: z.array(z.string().min(1).max(30)).max(10),
  feedbackNeeded: z.string().min(20).max(500),
  coverImage: z.string().url().optional(),
  projectUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
})

export const feedbackSchema = z.object({
  content: z.string().min(5).max(2000),
  parentId: z.string().optional(),
})

export const aiChatSchema = z.object({
  projectId: z.string().cuid(),
  message: z.string().min(5).max(1000),
})

export const aiReviewSchema = z.object({
  project: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    techStack: z.array(z.string()),
    repoUrl: z.string().optional(),
    projectUrl: z.string().optional(),
  }),
})

export const tipSchema = z.object({
  feedbackId: z.string().cuid(),
  amount: z.number().positive(),
  signature: z.string(),
})

export const tipVerifySchema = z.object({
  signature: z.string(),
})
