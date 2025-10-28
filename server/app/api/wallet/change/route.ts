import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { walletConnectSchema } from "@/lib/validation"
import { sanitizeUser } from "@/lib/serializers"
import { validateWalletAddress, verifySolanaTransaction } from "@/lib/solana"

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)

    if (!user.emailVerified) {
      throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify email before managing wallet")
    }

    if (!user.walletAddress) {
      throw new ApiError(400, "NO_WALLET", "No wallet to change. Connect one first.")
    }

    const body = await request.json()
    const { walletAddress, walletType, signature } = walletConnectSchema.parse(body)

    if (!validateWalletAddress(walletAddress)) {
      throw new ApiError(400, "INVALID_WALLET", "Invalid wallet address")
    }

    if (walletAddress === user.walletAddress) {
      throw new ApiError(400, "SAME_WALLET", "New wallet matches the current wallet")
    }

    const existingWallet = await prisma.user.findFirst({
      where: {
        walletAddress,
      },
    })

    if (existingWallet) {
      throw new ApiError(400, "WALLET_IN_USE", "Wallet already connected to another account")
    }

    const transaction = await verifySolanaTransaction(signature)

    if (!transaction) {
      throw new ApiError(400, "INVALID_SIGNATURE", "Unable to verify wallet ownership")
    }

    const accountKeys = transaction.transaction.message.getAccountKeys().staticAccountKeys
    const normalizedWallet = walletAddress.toLowerCase()
    const hasAddress = accountKeys.some((key) => key.toBase58().toLowerCase() === normalizedWallet)

    if (!hasAddress) {
      throw new ApiError(
        400,
        "INVALID_SIGNATURE",
        "Transaction signature does not reference provided wallet",
      )
    }

    const [, updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          walletAddress: null,
          walletType: null,
          walletConnectedAt: null,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          walletAddress,
          walletType,
          walletConnectedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      user: sanitizeUser(updatedUser),
      message: "Wallet changed successfully",
    })
  } catch (error) {
    return handleError(error)
  }
}
