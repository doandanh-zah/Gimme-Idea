import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { sanitizeUser } from "@/lib/serializers"

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)

    if (!user.walletAddress) {
      throw new ApiError(400, "NO_WALLET", "No wallet connected")
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        walletAddress: null,
        walletType: null,
        walletConnectedAt: null,
      },
    })

    return NextResponse.json({
      user: sanitizeUser(updatedUser),
      message: "Wallet disconnected",
    })
  } catch (error) {
    return handleError(error)
  }
}
