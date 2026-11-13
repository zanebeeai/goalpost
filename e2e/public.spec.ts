import { expect, test, type Page } from "@playwright/test";
import { googleEnabledOnStack, requireSupabase } from "./support";

async function robotsMeta(page: Page) {
  return page.locator('meta[name="robots"]').getAttribute("content");
}

test("landing shows the week and the way in", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Goalpost");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Pick something to learn every Sunday/,
    }),
  ).toBeVisible();

  const steps = page.getByRole("listitem");
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText("Sunday");
  await expect(steps.nth(0)).toContainText("Pick");
  await expect(steps.nth(1)).toContainText("Learn");
  await expect(steps.nth(2)).toContainText("Friday");
  await expect(steps.nth(2)).toContainText("Interview");

  for (const name of ["Log in", "Sign up"]) {
    await expect(
      page.getByRole("link", { name, exact: true }).filter({ visible: true }),
    ).not.toHaveCount(0);
  }
  expect(await robotsMeta(page)).toBe("index, follow");
});

test("privacy page renders and is indexable", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy");
  await expect(
    page.getByRole("heading", { name: "Who can see it" }),
  ).toBeVisible();
  expect(await robotsMeta(page)).toBe("index, follow");
});

test("login page is generic and not indexed", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page).toHaveTitle("Log in · Goalpost");
  await expect(page.getByLabel("Email")).toBeVisible();
  expect(await robotsMeta(page)).toBe("noindex, nofollow");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Goalpost",
  );
});

// The local stack (supabase/config.toml) and CI have Google turned off, so
// the button must not lead to Supabase's raw "provider is not enabled" page.
for (const path of ["/auth/login", "/auth/signup"]) {
  test(`${path} offers Google only when the provider is on`, async ({
    page,
  }) => {
    const enabled = await googleEnabledOnStack();
    await page.goto(path);
    await expect(page.getByLabel("Email")).toBeVisible();
    const google = page.getByRole("button", { name: "Continue with Google" });
    if (enabled) {
      await expect(google).toBeVisible();
    } else {
      await expect(google).toHaveCount(0);
      await expect(page.getByText("or", { exact: true })).toHaveCount(0);
    }
  });
}

test("robots.txt keeps private routes out", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  for (const path of ["/app", "/auth", "/join", "/onboarding", "/api"]) {
    expect(body).toContain(`Disallow: ${path}`);
  }
});

test.describe("signed out", () => {
  test.beforeEach(() => requireSupabase());

  const cases = [
    ["/app", "/auth/login"],
    ["/app/settings", "/auth/login"],
    ["/onboarding", "/auth/login"],
    // A friend opening an invite most likely has no account yet.
    ["/join/abc", "/auth/signup"],
  ] as const;

  for (const [path, target] of cases) {
    test(`${path} redirects to ${target} and keeps next`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${target}\\?`));
      expect(new URL(page.url()).searchParams.get("next")).toBe(path);
    });
  }
});
