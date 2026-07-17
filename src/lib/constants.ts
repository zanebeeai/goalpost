export const APP_NAME = "Goalpost";
export const APP_DESCRIPTION =
  "A public history of the things you decide to make real.";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export const RESERVED_USERNAMES = new Set([
  "app",
  "admin",
  "api",
  "auth",
  "g",
  "goal",
  "goals",
  "help",
  "legal",
  "login",
  "settings",
  "signup",
  "support",
  "u",
]);

export const GOAL_EVENT_LABELS = {
  delivery: "Delivery",
  deadline: "Deadline",
  milestone: "Milestone",
  resume: "Resume work",
  custom: "Event",
} as const;
