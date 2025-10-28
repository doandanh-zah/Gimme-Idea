import { NextRequest, NextResponse } from "next/server"

import { APP_DOMAIN } from "@/lib/constants"
import { enforceRateLimit, getRateLimitKey } from "@/lib/rate-limit"

const allowedOrigins = new Set<string>([
  APP_DOMAIN,
  "https://www.gimmeidea.com",
  "https://gimmeidea.com",
  "http://localhost:3000",
])

const applyCors = (request: NextRequest, response: NextResponse) => {
  const origin = request.headers.get("origin")

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    )
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Credentials", "true")
  }

  return response
}

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return applyCors(
      request,
      new NextResponse(null, {
        status: 204,
      }),
    )
  }

  const key = getRateLimitKey(request)
  const rate = await enforceRateLimit(key)

  if (!rate.success) {
    return applyCors(
      request,
      NextResponse.json(
        { error: "Rate limit exceeded", code: "RATE_LIMIT" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rate.reset / 1000)),
          },
        },
      ),
    )
  }

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", rate.limit.toString())
  response.headers.set("X-RateLimit-Remaining", rate.remaining.toString())
  response.headers.set("X-RateLimit-Reset", rate.reset.toString())

  return applyCors(request, response)
}

export const config = {
  matcher: ["/api/:path*"],
}
