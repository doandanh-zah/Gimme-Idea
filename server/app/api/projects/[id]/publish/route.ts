import { NextRequest, NextResponse } from "next/server"
import { NotificationType, ProjectStatus } from "@prisma/client"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { getOpenAIClient } from "@/lib/openai"
import { projectReviewPrompt } from "@/lib/ai-prompts"
import { emitRealtimeEvent } from "@/lib/realtime"

const SYSTEM_PROMPT =
  "You are an expert product reviewer for startups. Respond strictly with valid JSON."

const normalizeScore = (score: unknown) => {
  if (typeof score === "number" && Number.isFinite(score)) {
    return Math.min(Math.max(Math.round(score), 0), 100)
  }
  return null
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)

    if (!user.emailVerified) {
      throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify email before publishing projects")
    }

    if (user.aiCredits <= 0) {
      throw new ApiError(402, "AI_CREDITS_EXHAUSTED", "Not enough AI credits")
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found")
    }

    if (project.userId !== user.id) {
      throw new ApiError(403, "NOT_OWNER", "Only project owner can publish")
    }

    if (project.status === ProjectStatus.PUBLISHED) {
      throw new ApiError(400, "ALREADY_PUBLISHED", "Project already published")
    }

    const openai = getOpenAIClient()
    const prompt = projectReviewPrompt(project)

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new ApiError(500, "AI_ERROR", "No AI response generated")
    }

    let aiReview: Record<string, unknown>
    try {
      aiReview = JSON.parse(content.trim())
    } catch (error) {
      throw new ApiError(500, "AI_PARSE_ERROR", "Failed to parse AI response", {
        response: content,
        cause: error instanceof Error ? error.message : "unknown",
      })
    }

    const aiScore = normalizeScore(aiReview.score)
    const now = new Date()

    const [updatedProject] = await prisma.$transaction([
      prisma.project.update({
        where: { id: project.id },
        data: {
          aiReview,
          aiScore,
          aiReviewedAt: now,
          status: ProjectStatus.PUBLISHED,
          publishedAt: now,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          aiCredits: { decrement: 1 },
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.PROJECT_REVIEWED,
          title: "Project published",
          message: `Your project "${project.title}" has been reviewed and published.`,
        },
      }),
    ])

    await emitRealtimeEvent({
      channel: "project:view",
      data: {
        projectId: project.id,
        status: ProjectStatus.PUBLISHED,
      },
    })

    return NextResponse.json({ project: updatedProject, aiReview })
  } catch (error) {
    return handleError(error)
  }
}
