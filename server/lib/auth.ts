import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

import { prisma } from "./prisma"
import { ApiError } from "./errors"

const TOKEN_AUDIENCE = "gimmeidea_api"
const TOKEN_EXPIRY = "7d"

type JwtPayload = {
  sub: string
  aud: string
  iat: number
  exp: number
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not configured")
  }
  return secret
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12)

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash)

export const generateToken = (userId: string, expiresIn: string = TOKEN_EXPIRY) =>
  jwt.sign({ sub: userId, aud: TOKEN_AUDIENCE }, getJwtSecret(), { expiresIn })

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, getJwtSecret(), { audience: TOKEN_AUDIENCE }) as JwtPayload

export const getAuthToken = (request: NextRequest | Request) => {
  const authorization = request.headers.get("Authorization")

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length)
  }

  try {
    const cookieStore = cookies()
    const cookieToken = cookieStore.get("gimmeidea_token")?.value
    if (cookieToken) {
      return cookieToken
    }
  } catch {
    // cookies() throws outside of request lifecycle; ignore.
  }

  return null
}

export const getUserIdFromRequest = (request: NextRequest | Request) => {
  const token = getAuthToken(request)

  if (!token) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required")
  }

  try {
    const payload = verifyToken(token)
    return payload.sub
  } catch (error) {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid or expired authentication token", {
      cause: error instanceof Error ? error.message : "Unknown",
    })
  }
}

export const requireUser = async (request: NextRequest | Request) => {
  const userId = getUserIdFromRequest(request)
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found")
  }

  return user
}
