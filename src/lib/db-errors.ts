type DbError = { code?: string; message: string };

const GENERIC = "Something went wrong. Try again.";

// Messages raised by our own triggers and RPCs are written for people.
const USER_FACING_CODES = new Set(["P0001", "P0002", "22023", "28000"]);

/**
 * Turn a Postgres/PostgREST error into something safe to show. Our triggers
 * and RPCs raise readable messages; everything else gets `fallback`.
 */
export function friendlyDbError(
  error: DbError | null | undefined,
  fallback: string = GENERIC,
): string {
  if (!error) return fallback;
  if (error.code && USER_FACING_CODES.has(error.code)) return error.message;
  if (error.code === "23505" && error.message === "You are already set up.") {
    return error.message;
  }
  if (error.code === "23514") return "That's too long or empty. Try again.";
  if (error.code === "42501") return "You can't do that.";
  return fallback;
}
