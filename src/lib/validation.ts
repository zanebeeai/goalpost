import { z } from "zod";

/** Trimmed text field; empty string when the field is missing. */
export function text(max: number, tooLong: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().max(max, tooLong),
  );
}

export function requiredText(max: number, empty: string, tooLong: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(1, empty).max(max, tooLong),
  );
}

export const idSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.uuid("That item was not found. Refresh and try again."),
);

export const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.email("Enter a valid email address."),
);

export const passwordSchema = z
  .string("Enter a password.")
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

/** Canonical IANA name ("pacific/pago_pago" -> "Pacific/Pago_Pago"), or null. */
export function canonicalTimezone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: trimmed,
    }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function isValidTimezone(value: string): boolean {
  return canonicalTimezone(value) !== null;
}

export const timezoneSchema = z.preprocess(
  (value) =>
    typeof value === "string" ? (canonicalTimezone(value) ?? value) : "",
  z.string().refine(isValidTimezone, "Pick a timezone from the list."),
);

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

/** Read named fields from FormData; missing fields become undefined. */
export function fields<K extends string>(
  formData: FormData,
  ...names: K[]
): Record<K, FormDataEntryValue | undefined> {
  return Object.fromEntries(
    names.map((name) => [name, formData.get(name) ?? undefined]),
  ) as Record<K, FormDataEntryValue | undefined>;
}
