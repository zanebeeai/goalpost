import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { adminClient, requireSupabase } from "./support";

// Mailpit, the local mail catcher that `supabase start` runs.
const MAIL_API = "http://127.0.0.1:54324/api/v1";

type MailSearch = { messages: { ID: string }[] };

/** The /auth/confirm link from the newest email sent to `to`. */
async function confirmationLink(to: string): Promise<string> {
  let id: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await fetch(
          `${MAIL_API}/search?query=${encodeURIComponent(`to:${to}`)}`,
        );
        const search = (await response.json()) as MailSearch;
        id = search.messages[0]?.ID;
        return id;
      },
      { message: `no email for ${to}`, timeout: 15_000 },
    )
    .toBeTruthy();
  const message = (await (await fetch(`${MAIL_API}/message/${id}`)).json()) as {
    HTML: string;
  };
  const href = message.HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1];
  if (!href) throw new Error("No /auth/confirm link in the email");
  return href.replaceAll("&amp;", "&");
}

test.describe("email sign-up", () => {
  test.beforeEach(() => requireSupabase());

  test("the form, the emailed link, then onboarding; the link works once", async ({
    page,
    browser,
  }) => {
    const email = `e2e-signup-${randomUUID().slice(0, 8)}@example.com`;
    const admin = adminClient();

    try {
      await page.goto("/auth/signup");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(`pw-${randomUUID()}`);
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(
        page.getByRole("heading", { name: "Check your email" }),
      ).toBeVisible();
      await expect(page.getByText(email)).toBeVisible();

      const link = await confirmationLink(email);
      expect(new URL(link).pathname).toBe("/auth/confirm");

      await page.goto(link);
      await expect(page).toHaveURL(/\/onboarding$/);

      // Someone opening the used link again, on another device.
      const other = await browser.newContext();
      try {
        const again = await other.newPage();
        await again.goto(link);
        await expect(again).toHaveURL(/\/auth\/login\?.*error=confirm/);
        await expect(
          again
            .getByRole("alert")
            .filter({ hasText: "That link expired or was already used" }),
        ).toBeVisible();
        await expect(again.getByLabel("Email")).toBeVisible();
      } finally {
        await other.close();
      }
    } finally {
      const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const user = data.users.find((candidate) => candidate.email === email);
      if (user) await admin.auth.admin.deleteUser(user.id);
    }
  });
});
