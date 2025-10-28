import { NextResponse } from "next/server"

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public metadata?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof Error) {
    return new ApiError(500, "INTERNAL_ERROR", error.message)
  }

  return new ApiError(500, "INTERNAL_ERROR", "Unknown error")
}

export function handleError(error: unknown) {
  const apiError = toApiError(error)

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(apiError)
  }

  return NextResponse.json(
    {
      error: apiError.message,
      code: apiError.code,
      ...(apiError.metadata ? { metadata: apiError.metadata } : {}),
    },
    { status: apiError.statusCode },
  )
}
