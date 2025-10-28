import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { emitRealtimeEvent } from "@/lib/realtime"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request)

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        uniqueViewers: true,
        viewCount: true,
      },
    })

    if (!project) {
      throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found")
    }

    const hasViewed = project.uniqueViewers.includes(user.id)

    if (hasViewed) {
      return NextResponse.json({ viewCount: project.viewCount })
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        viewCount: { increment: 1 },
        uniqueViewers: { set: [...project.uniqueViewers, user.id] },
      },
      select: {
        viewCount: true,
      },
    })

    await emitRealtimeEvent({
      channel: "project:view",
      data: {
        projectId: project.id,
        viewCount: updatedProject.viewCount,
      },
    })

    return NextResponse.json({ viewCount: updatedProject.viewCount })
  } catch (error) {
    return handleError(error)
  }
}
