import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth"
import { handleError } from "@/lib/errors"
import { sanitizeUser } from "@/lib/serializers"

export async function GET(request: Request) {
  try {
    const user = await requireUser(request)
    return NextResponse.json({ user: sanitizeUser(user) })
  } catch (error) {
    return handleError(error)
  }
}
