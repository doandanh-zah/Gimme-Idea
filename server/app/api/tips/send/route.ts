import { NextResponse } from "next/server"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { NotificationType, TipStatus } from "@prisma/client"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { tipSchema } from "@/lib/validation"
import { verifySolanaTransaction } from "@/lib/solana"
import { emitRealtimeEvent } from "@/lib/realtime"

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)

    if (!user.emailVerified) {
      throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify email before sending tips")
    }

    if (!user.walletAddress) {
      throw new ApiError(403, "NO_WALLET", "Wallet connection required to send tips")
    }

    const body = await request.json()
    const { feedbackId, amount, signature } = tipSchema.parse(body)

    if (amount <= 0) {
      throw new ApiError(400, "INVALID_AMOUNT", "Tip amount must be positive")
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        user: true,
        project: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!feedback) {
      throw new ApiError(404, "FEEDBACK_NOT_FOUND", "Feedback not found")
    }

    if (feedback.userId === user.id) {
      throw new ApiError(400, "SELF_TIP", "You cannot tip your own feedback")
    }

    const transaction = await verifySolanaTransaction(signature)

    if (!transaction) {
      throw new ApiError(400, "INVALID_SIGNATURE", "Solana transaction verification failed")
    }

    const lamportsTransferred =
      (transaction.meta?.postBalances?.[0] ?? 0) - (transaction.meta?.preBalances?.[0] ?? 0)
    const solTransferred = lamportsTransferred / LAMPORTS_PER_SOL

    const status =
      Math.abs(solTransferred - amount) < 0.0001 ? TipStatus.COMPLETED : TipStatus.PENDING

    const tip = await prisma.tip.create({
      data: {
        amount,
        signature,
        feedbackId,
        fromUserId: user.id,
        toUserId: feedback.userId,
        status,
      },
    })

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          totalTipsGiven: { increment: amount },
        },
      }),
      prisma.user.update({
        where: { id: feedback.userId },
        data: {
          totalTipsReceived: { increment: amount },
        },
      }),
    ])

    await prisma.notification.create({
      data: {
        userId: feedback.userId,
        type: NotificationType.TIP_RECEIVED,
        title: "New tip received",
        message: `${user.username} tipped you ${amount} SOL for feedback on "${feedback.project.title}"`,
        data: {
          tipId: tip.id,
          feedbackId: feedback.id,
          projectId: feedback.projectId,
        },
      },
    })

    await emitRealtimeEvent({
      channel: "tip:received",
      data: {
        tipId: tip.id,
        toUserId: feedback.userId,
        amount,
        status,
      },
    })

    return NextResponse.json({ tip })
  } catch (error) {
    return handleError(error)
  }
}
