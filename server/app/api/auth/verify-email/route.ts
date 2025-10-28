import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { verifyEmailSchema } from "@/lib/validation"
import { hashToken, parseStoredEmailToken } from "@/lib/token"
import { sanitizeUser } from "@/lib/serializers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = verifyEmailSchema.parse(body)

    const hashedToken = hashToken(token)

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: {
          startsWith: hashedToken,
        },
      },
    })

    if (!user) {
      throw new ApiError(400, "INVALID_TOKEN", "Verification token is invalid")
    }

    const stored = parseStoredEmailToken(user.emailVerifyToken)
    if (!stored) {
      throw new ApiError(400, "INVALID_TOKEN", "Verification token is invalid")
    }

    if (stored.hashedToken !== hashedToken) {
      throw new ApiError(400, "INVALID_TOKEN", "Verification token mismatch")
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new ApiError(400, "TOKEN_EXPIRED", "Verification token expired")
    }

    if (user.emailVerified) {
      return NextResponse.json({
        user: sanitizeUser(user),
        message: "Email already verified",
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    })

    return NextResponse.json({
      user: sanitizeUser(updatedUser),
      message: "Email verified successfully",
    })
  } catch (error) {
    return handleError(error)
  }
}
