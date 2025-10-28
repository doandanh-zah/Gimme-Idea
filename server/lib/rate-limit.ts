import { headers } from "next/headers"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import type { NextRequest } from "next/server"

const redis = Redis.fromEnv()

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "rl:gimmeidea",
})

export type RateLimitResult = Awaited<ReturnType<typeof ratelimit.limit>>

export const getRateLimitKey = (request: NextRequest | Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? headers().get("x-forwarded-for")

  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim()
  }

  const ip = request.headers.get("x-real-ip") ?? headers().get("x-real-ip")
  if (ip) {
    return ip
  }

  return "anonymous"
}

export const enforceRateLimit = async (key: string) => ratelimit.limit(key)
