import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { aiChatSchema } from "@/lib/validation"
import { getOpenAIClient } from "@/lib/openai"
import { MAX_AI_MESSAGES_PER_PROJECT } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    const user = await requireUser(request)

    if (!user.emailVerified) {
      throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify email before using AI chat")
    }

    const body = await request.json()
    const { projectId, message } = aiChatSchema.parse(body)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        techStack: true,
        userId: true,
      },
    })

    if (!project) {
      throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found")
    }

    const messageCount = await prisma.aIChat.count({
      where: {
        projectId,
        userId: user.id,
      },
    })

    if (messageCount >= MAX_AI_MESSAGES_PER_PROJECT) {
      throw new ApiError(
        403,
        "AI_CHAT_LIMIT",
        "AI chat limit reached (5 messages per project)",
      )
    }

    const pastMessages = await prisma.aIChat.findMany({
      where: {
        projectId,
        userId: user.id,
      },
      orderBy: { createdAt: "asc" },
      take: MAX_AI_MESSAGES_PER_PROJECT,
    })

    const openai = getOpenAIClient()
    const systemPrompt = `You are Idea Mentor, an AI coach helping builders improve their projects on Gimme Idea.
Project Title: ${project.title}
Category: ${project.category}
Tech Stack: ${project.techStack.join(", ") || "Not provided"}
Description: ${project.description}`

    const conversation = [
      { role: "system", content: systemPrompt },
      ...pastMessages.flatMap((chat) => [
        { role: "user" as const, content: chat.message },
        { role: "assistant" as const, content: chat.response },
      ]),
      { role: "user" as const, content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      messages: conversation,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new ApiError(500, "AI_ERROR", "No AI response generated")
    }

    const chatEntry = await prisma.aIChat.create({
      data: {
        projectId,
        userId: user.id,
        message,
        response,
        tokenUsed: completion.usage?.total_tokens ?? 0,
      },
    })

    return NextResponse.json({ chat: chatEntry })
  } catch (error) {
    return handleError(error)
  }
}
