import type { ApiResponse } from "./api-client";

export type ApiError = Error & { errorType?: string };

/**
 * Unwrap a standard ApiResponse envelope. Throws on failure or missing data.
 */
export function unwrapApi<T>(
  response: ApiResponse<T>,
  fallbackMsg = "Request failed"
): T {
  if (!response.success || response.data === undefined || response.data === null) {
    throw toApiError(response, fallbackMsg);
  }
  return response.data;
}

/**
 * Build an Error that preserves backend errorType (e.g. backend_unavailable).
 */
export function toApiError(
  response: Pick<ApiResponse<unknown>, "error" | "message" | "errorType">,
  fallback = "Request failed"
): ApiError {
  const err = new Error(
    response.error || response.message || fallback
  ) as ApiError;
  if (response.errorType) {
    err.errorType = response.errorType;
  }
  return err;
}
