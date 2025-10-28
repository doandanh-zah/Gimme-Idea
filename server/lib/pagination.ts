export const parsePaginationParams = (searchParams: URLSearchParams) => {
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "12", 10), 1), 50)
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
