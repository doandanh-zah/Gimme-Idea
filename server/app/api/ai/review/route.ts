import { NextResponse } from "next/server"

import { aiReviewSchema } from "@/lib/validation"
import { getOpenAIClient } from "@/lib/openai"
import { ApiError, handleError } from "@/lib/errors"
import { projectReviewPrompt } from "@/lib/ai-prompts"

const SYSTEM_PROMPT =
  "You are an expert reviewer. Respond strictly with JSON matching the requested schema."

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { project } = aiReviewSchema.parse(body)

    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: projectReviewPrompt(project) },
      ],
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new ApiError(500, "AI_ERROR", "No review generated")
    }

    let review: unknown
    try {
      review = JSON.parse(content.trim())
    } catch (error) {
      throw new ApiError(500, "AI_PARSE_ERROR", "Failed to parse AI response", {
        response: content,
        cause: error instanceof Error ? error.message : "unknown",
      })
    }

    return NextResponse.json({ review })
  } catch (error) {
    return handleError(error)
  }
}
