import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"
import { ApiError, handleError } from "@/lib/errors"
import {
  generateEmailVerificationToken,
  serializeEmailToken,
} from "@/lib/token"
import { sendVerificationEmail } from "@/lib/email"
import { registerSchema } from "@/lib/validation"
import { sanitizeUser } from "@/lib/serializers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, username } = registerSchema.parse(body)

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username }],
      },
    })

    if (existingUser) {
      throw new ApiError(400, "USER_EXISTS", "Email or username already in use")
    }

    const passwordHash = await hashPassword(password)
    const verificationToken = generateEmailVerificationToken()

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: passwordHash,
        emailVerified: false,
        emailVerifyToken: serializeEmailToken(
          verificationToken.hashedToken,
          verificationToken.expiresAt,
        ),
      },
    })

    await sendVerificationEmail({
      email: user.email,
      token: verificationToken.token,
    })

    const token = generateToken(user.id)

    return NextResponse.json({
      user: sanitizeUser(user),
      token,
      message: "Registration successful. Please verify your email.",
    })
  } catch (error) {
    return handleError(error)
  }
}
