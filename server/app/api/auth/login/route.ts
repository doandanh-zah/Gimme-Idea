import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { verifyPassword, generateToken } from "@/lib/auth"
import { ApiError, handleError } from "@/lib/errors"
import { loginSchema } from "@/lib/validation"
import { sanitizeUser } from "@/lib/serializers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password")
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password")
    }

    if (!user.emailVerified) {
      throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Email verification required")
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    })

    const token = generateToken(user.id)

    return NextResponse.json({
      user: sanitizeUser(user),
      token,
    })
  } catch (error) {
    return handleError(error)
  }
}
