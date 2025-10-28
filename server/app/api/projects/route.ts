import { NextRequest, NextResponse } from "next/server"

import { ProjectStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ApiError, handleError } from "@/lib/errors"
import { requireUser } from "@/lib/auth"
import { projectSchema } from "@/lib/validation"
import { parsePaginationParams } from "@/lib/pagination"

const PROJECT_SORTS: Record<string, { [key: string]: "asc" | "desc" }> = {
  recent: { createdAt: "desc" },
  popular: { viewCount: "desc" },
  top: { aiScore: "desc" },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const { page, limit, skip } = parsePaginationParams(searchParams)
    const category = searchParams.get("category")
    const sort = searchParams.get("sort") ?? "recent"

    const where = {
      status: "PUBLISHED" as const,
      ...(category ? { category } : {}),
    }

    const orderBy = PROJECT_SORTS[sort] ?? PROJECT_SORTS.recent

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              reputation: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      data: projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)

    if (!user.emailVerified) {
      throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify email before creating projects")
    }

    const body = await request.json()
    const projectInput = projectSchema.parse(body)

    const { status: _status, ...projectData } = projectInput

    const project = await prisma.project.create({
      data: {
        ...projectData,
        userId: user.id,
        status: ProjectStatus.DRAFT,
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    return handleError(error)
  }
}
