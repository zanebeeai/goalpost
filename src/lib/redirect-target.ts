import { safeRedirectPath } from "@/lib/utils";

/**
 * Email templates pass `{{ .RedirectTo }}`, a full URL, as `next`. Accept it
 * only when it points at one of our own origins, and keep just the path.
 */
export function redirectTargetPath(
  next: string | null | undefined,
  allowedOrigins: string[],
  fallback: string,
): string {
  if (!next) return fallback;
  if (next.startsWith("/")) return safeRedirectPath(next, fallback);
  try {
    const url = new URL(next);
    if (!allowedOrigins.includes(url.origin)) return fallback;
    const path = `${url.pathname}${url.search}`;
    return path === "/" ? fallback : safeRedirectPath(path, fallback);
  } catch {
    return fallback;
  }
}
