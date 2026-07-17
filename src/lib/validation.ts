import { z } from "zod";
import { RESERVED_USERNAMES } from "@/lib/constants";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(254);
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Password is too long")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters")
  .max(30, "Use at most 30 characters")
  .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only")
  .refine(
    (value) => !RESERVED_USERNAMES.has(value),
    "That username is reserved",
  );

export const richTextSchema = z.record(z.string(), z.unknown()).or(
  z.object({
    type: z.literal("doc"),
    content: z.array(z.unknown()).optional(),
  }),
);

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again";
}
