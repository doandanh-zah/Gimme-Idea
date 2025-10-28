import { NextRequest, NextResponse } from "next/server"
import { NotificationType } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { feedbackSchema } from "@/lib/validation"
import { requireUser } from "@/lib/auth"
import { emitRealtimeEvent } from "@/lib/realtime"

const feedbackInclude = {
  user: {
    select: {
      id: true,
      username: true,
      avatar: true,
      reputation: true,
    },
  },
  tips: {
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  },
  replies: {
    orderBy: [
      { helpful: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          reputation: true,
        },
      },
      tips: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
  },
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!project) {
      throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found")
    }

    const feedbacks = await prisma.feedback.findMany({
      where: {
        projectId: project.id,
        parentId: null,
      },
      include: feedbackInclude,
      orderBy: [
        { helpful: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json({ feedbacks })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)

    if (!user.emailVerified) {
      throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify email before giving feedback")
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found")
    }

    const body = await request.json()
    const { content, parentId } = feedbackSchema.parse(body)

    if (parentId) {
      const parentFeedback = await prisma.feedback.findUnique({
        where: { id: parentId },
      })

      if (!parentFeedback || parentFeedback.projectId !== project.id) {
        throw new ApiError(400, "INVALID_PARENT", "Invalid parent feedback")
      }
    }

    const feedback = await prisma.feedback.create({
      data: {
        content,
        projectId: project.id,
        userId: user.id,
        parentId,
      },
      include: feedbackInclude,
    })

    await prisma.project.update({
      where: { id: project.id },
      data: { feedbackCount: { increment: 1 } },
    })

    if (project.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: project.userId,
          type: NotificationType.FEEDBACK_RECEIVED,
          title: "New feedback",
          message: `${user.username} shared feedback on "${project.title}"`,
          data: {
            projectId: project.id,
            feedbackId: feedback.id,
          },
        },
      })
    }

    await emitRealtimeEvent({
      channel: "feedback:new",
      data: {
        projectId: project.id,
        feedbackId: feedback.id,
      },
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    return handleError(error)
  }
}
