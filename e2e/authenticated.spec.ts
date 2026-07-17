import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const enabled = process.env.E2E_AUTHENTICATED === "1";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const runId = Date.now().toString(36);
const email = `goalpost-e2e+${runId}@example.com`;
const username = `goalpost_e2e_${runId}`;
const password = "Goalpost-Test-1234";

test.describe("authenticated idea-to-goal journey", () => {
  test.skip(
    !enabled || !url || !secret || !publishableKey,
    "Requires a disposable local Supabase stack",
  );
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    const admin = createClient(url!, secret!, {
      auth: { persistSession: false },
    });
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
  });

  test.afterAll(async () => {
    const admin = createClient(url!, secret!, {
      auth: { persistSession: false },
    });
    const member = createClient(url!, publishableKey!, {
      auth: { persistSession: false },
    });
    const { data: session } = await member.auth.signInWithPassword({
      email,
      password,
    });
    if (session.user) await member.rpc("prepare_account_deletion");
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const user = data.users.find((item) => item.email === email);
    if (user) await admin.auth.admin.deleteUser(user.id);
  });

  test("captures an idea and promotes it into a public goal", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByLabel("Display name").fill("Goalpost Test Builder");
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.fill(username);
    await expect(usernameInput).toHaveValue(username);
    const acknowledgement = page.getByRole("checkbox", {
      name: /I understand that goalposts/,
    });
    await acknowledgement.check();
    await expect(acknowledgement).toBeChecked();
    await page.getByRole("button", { name: "Create my Goalpost" }).click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 20_000 });

    await page
      .getByPlaceholder(/Capture a loose idea/)
      .fill("Build a tiny weather station");
    await page.getByRole("button", { name: "Capture" }).click();
    await expect(page.getByText("Idea captured")).toBeVisible();

    await page.getByRole("link", { name: "Ideas" }).first().click();
    await page
      .locator('a[href^="/app/ideas/"]')
      .filter({ hasText: "Inbox" })
      .click();
    await page
      .getByRole("link", { name: /Build a tiny weather station/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Build a tiny weather station" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Promote to goal/ }).click();

    await expect(page).toHaveURL(/\/g\/[0-9a-f-]+/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Build a tiny weather station",
      }),
    ).toBeVisible();
    await expect(page.getByText("Public", { exact: true })).toBeVisible();
    await expect(page.getByText("Collaborator tools")).toBeVisible();
  });
});
