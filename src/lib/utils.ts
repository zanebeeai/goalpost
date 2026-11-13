import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toUpperCase() ?? "")
    .join("");
}

/** Only same-origin absolute paths survive; anything else becomes `fallback`. */
export function safeRedirectPath(
  path: string | null | undefined,
  fallback = "/app",
): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path)) {
    return fallback;
  }
  return path;
}
