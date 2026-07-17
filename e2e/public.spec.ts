import { expect, test } from "@playwright/test";

test("landing page explains the idea-to-goal loop", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "things you mean to make real",
  );
  await expect(
    page.getByRole("link", { name: /Plant your first idea/i }),
  ).toBeVisible();
  await expect(page.getByText("Catch the idea")).toBeVisible();
  await expect(page.getByText("Make it real")).toBeVisible();
});

test("signup carries a public-content warning", async ({ page }) => {
  await page.goto("/auth/signup");
  await expect(
    page.getByRole("heading", { name: "Start your Goalpost" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Anything promoted to your goal tree becomes public/i),
  ).toBeVisible();
});

test("legal pages are publicly reachable", async ({ page }) => {
  await page.goto("/legal/privacy");
  await expect(
    page.getByRole("heading", { name: "Privacy Notice" }),
  ).toBeVisible();
  await expect(page.getByText("What remains private")).toBeVisible();
});
