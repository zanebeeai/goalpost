import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

/** True when the local Supabase stack is configured (see `pnpm env:local`). */
export function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
  );
}

/**
 * Skips tests that need Supabase when it isn't configured locally. In CI a
 * missing stack is a setup bug, so it fails instead of silently skipping.
 */
export function requireSupabase(): void {
  if (hasSupabase()) return;
  if (process.env.CI) {
    throw new Error(
      "Supabase env is missing in CI. Run `pnpm env:local` before the e2e step.",
    );
  }
  test.skip(true, "Supabase env missing: run `mise run setup` first.");
}

export function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type TestUser = { id: string; email: string; password: string };

/** A confirmed user with a unique email, created through the admin API. */
export async function createUser(
  admin: SupabaseClient,
  label: string,
): Promise<TestUser> {
  const email = `e2e-${label}-${randomUUID().slice(0, 8)}@example.com`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  return { id: data.user.id, email, password };
}

export async function deleteUsers(
  admin: SupabaseClient,
  users: TestUser[],
): Promise<void> {
  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) console.warn(`Could not delete ${user.email}: ${error.message}`);
  }
}

export async function logIn(page: Page, user: TestUser): Promise<void> {
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

/** Clicks a main nav tab (phones and desktop render separate navs) and waits for it. */
export async function openTab(page: Page, name: string): Promise<void> {
  const tab = page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name, exact: true })
    .filter({ visible: true });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-current", "page");
}

/** The form that contains the given field, for scoping its Save/Add button. */
export function formWith(page: Page, label: string) {
  return page
    .locator("form")
    .filter({ has: page.getByLabel(label, { exact: true }) });
}

export async function expectSaved(form: ReturnType<typeof formWith>) {
  await expect(
    form.getByRole("status").filter({ hasText: "Saved" }),
  ).toBeVisible();
}

/** Fails if the page scrolls sideways (phones must never need that). */
export async function expectNoSideScroll(page: Page): Promise<void> {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(
    scrollWidth,
    `${new URL(page.url()).pathname} scrolls sideways`,
  ).toBeLessThanOrEqual(innerWidth);
}

const ZONES = [
  "Pacific/Pago_Pago",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Atlantic/Azores",
  "UTC",
  "Europe/Berlin",
  "Europe/Athens",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Kiritimati",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localClock(zone: string, now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    weekday: WEEKDAYS.indexOf(parts.weekday ?? ""),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/**
 * A browser timezone for the journey, so the space's week is predictable.
 * Prefers a zone where it is Sunday to Thursday (questions still hidden), and
 * avoids zones near local midnight so the day can't change mid-test. When no
 * zone is before Friday, questions are legitimately revealed instead.
 */
export function pickTimezone(now = new Date()): {
  zone: string;
  revealed: boolean;
} {
  const safe = ZONES.map((zone) => ({ zone, ...localClock(zone, now) })).filter(
    ({ minutes }) => minutes >= 30 && minutes <= 23 * 60 + 30,
  );
  const hidden = safe.find(({ weekday }) => weekday <= 4);
  if (hidden) return { zone: hidden.zone, revealed: false };
  const shown = safe.find(({ weekday }) => weekday >= 5);
  if (!shown) throw new Error("No usable timezone found");
  return { zone: shown.zone, revealed: true };
}
