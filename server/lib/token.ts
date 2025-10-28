import crypto from "crypto"

import { EMAIL_TOKEN_TTL_HOURS } from "./constants"

export type EmailTokenPayload = {
  token: string
  hashedToken: string
  expiresAt: Date
}

export const generateEmailVerificationToken = (): EmailTokenPayload => {
  const token = crypto.randomBytes(32).toString("hex")
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000)
  return { token, hashedToken, expiresAt }
}

export const serializeEmailToken = (hashedToken: string, expiresAt: Date) =>
  `${hashedToken}:${expiresAt.toISOString()}`

export const parseStoredEmailToken = (stored?: string | null) => {
  if (!stored) {
    return null
  }

  const [token, isoDate] = stored.split(":")
  if (!token || !isoDate) {
    return null
  }

  const expiresAt = new Date(isoDate)
  if (Number.isNaN(expiresAt.getTime())) {
    return null
  }

  return { hashedToken: token, expiresAt }
}

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex")
