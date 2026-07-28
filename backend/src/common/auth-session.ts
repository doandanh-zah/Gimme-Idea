export const AUTH_COOKIE_NAME = "gimme_auth_token";

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) return cookies;

    cookies[rawName] = decodeURIComponent(rawValue.join("=") || "");
    return cookies;
  }, {});
}

export function extractBearerToken(request: any): string | undefined {
  const authHeader = request.headers?.authorization;
  if (!authHeader) return undefined;

  const [type, token] = authHeader.split(" ");
  return type === "Bearer" ? token : undefined;
}

export function extractSessionToken(request: any): string | undefined {
  const cookies = parseCookieHeader(request.headers?.cookie);
  return cookies[AUTH_COOKIE_NAME] || extractBearerToken(request);
}

export function durationToMs(value: string): number {
  const match = value.trim().match(/^(\d+)\s*(ms|s|m|h|d)?$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = (match[2] || "ms").toLowerCase();

  switch (unit) {
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "m":
      return amount * 60 * 1000;
    case "s":
      return amount * 1000;
    default:
      return amount;
  }
}
