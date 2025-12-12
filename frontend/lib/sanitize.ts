/**
 * Utility functions for sanitizing user input
 * Prevents XSS attacks and cleans malicious content
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str) return "";

  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize string for safe display
 * - Removes HTML tags
 * - Trims whitespace
 * - Limits length
 */
export function sanitizeText(str: string, maxLength?: number): string {
  if (!str) return "";

  let sanitized = stripHtml(str).trim();

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  const trimmedUrl = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmedUrl.startsWith("javascript:") ||
    trimmedUrl.startsWith("data:") ||
    trimmedUrl.startsWith("vbscript:")
  ) {
    return "";
  }

  return url.trim();
}

/**
 * Sanitize username
 * - Only allow alphanumeric, underscore, dash
 * - Limit length
 */
export function sanitizeUsername(
  username: string,
  maxLength: number = 30
): string {
  if (!username) return "";

  return username
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .substring(0, maxLength);
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeText(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Check if string contains potentially dangerous content
 */
export function hasDangerousContent(str: string): boolean {
  if (!str) return false;

  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick=, onerror=, etc.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(str));
}
