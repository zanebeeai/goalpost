import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date, includeTime = false) {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "Unknown date";
  return format(date, includeTime ? "MMM d, yyyy 'at' h:mm a" : "MMM d, yyyy");
}

export function relativeDate(value: string | Date) {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "Unknown date";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function safeRedirectPath(
  path: string | null | undefined,
  fallback = "/app",
) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

export function slugifyTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function hostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
