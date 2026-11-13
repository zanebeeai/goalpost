import { expect, test, type Page } from "@playwright/test";
import {
  adminClient,
  createUser,
  deleteUsers,
  expectNoSideScroll,
  formWith,
  logIn,
  pickTimezone,
  requireSupabase,
  type TestUser,
} from "./support";

const clock = pickTimezone();
test.use({ timezoneId: clock.zone });

const users: TestUser[] = [];
test.beforeAll(() => requireSupabase());
test.afterAll(async () => {
  if (users.length) await deleteUsers(adminClient(), users);
});

/** Today as YYYY-MM-DD in the space timezone (onboarding uses the browser's). */
function todayInZone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: clock.zone }).format(
    new Date(),
  );
}

function shift(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function goalCard(page: Page, title: string) {
  return page.getByRole("group", { name: title, exact: true });
}

async function addGoal(page: Page, title: string, preset?: string) {
  await page.getByRole("button", { name: "Add a goal" }).click();
  const form = formWith(page, "What do you want to get done?");
  await form.getByLabel("What do you want to get done?").fill(title);
  if (preset) await form.getByRole("button", { name: preset }).click();
  await form.getByRole("button", { name: "Add goal" }).click();
  await expect(goalCard(page, title)).toBeVisible();
}

test("goals have dates, a cap of three and an overdue decision", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const admin = adminClient();
  const user = await createUser(admin, "goals");
  users.push(user);
  const run = user.email.slice(-20, -12);
  const [first, second, third] = [
    `Run 5k without stopping ${run}`,
    `Ship the portfolio site ${run}`,
    `Read two chapters ${run}`,
  ];

  await page.goto("/auth/login");
  await logIn(page, user);
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Your name").fill(`Gia${run}`);
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("Up to three at a time")).toBeVisible();
  // With no goals yet there is nothing to check in on, even on a Friday.
  await expect(
    page.getByRole("heading", { name: "Goals", exact: true }),
  ).toBeVisible();

  await test.step("add a goal with the default date", async () => {
    await page.getByRole("button", { name: "Add a goal" }).click();
    const form = formWith(page, "What do you want to get done?");
    await expect(form.getByLabel("By when?")).toHaveValue(
      shift(todayInZone(), 28),
    );
    await expect(form.getByLabel("By when?")).toHaveAttribute(
      "min",
      todayInZone(),
    );
    await form.getByLabel("What do you want to get done?").fill(first);
    await form.getByRole("button", { name: "Add goal" }).click();
    await expect(goalCard(page, first)).toContainText("4 weeks left");
    await expect(
      page.getByRole("button", { name: "Add a goal" }),
    ).toBeFocused();
  });

  await test.step("presets set the date; three is the cap", async () => {
    await addGoal(page, second, "2 weeks");
    await expect(goalCard(page, second)).toContainText("2 weeks left");
    await expect(
      page.getByRole("button", { name: "Add a goal" }),
    ).toBeFocused();
    await addGoal(page, third, "3 months");
    await expect(goalCard(page, third)).toContainText("3 months left");
    await expect(page.getByRole("button", { name: "Add a goal" })).toHaveCount(
      0,
    );
    // The cap hides the button, so focus goes to the new goal.
    await expect(
      goalCard(page, third).getByText(third, { exact: true }),
    ).toBeFocused();
    await expectNoSideScroll(page);
  });

  await test.step("change a date from the menu", async () => {
    const card = goalCard(page, first);
    await card.getByRole("button", { name: `Options for ${first}` }).click();
    await card.getByRole("button", { name: "Change date" }).click();
    const date = card.getByLabel("Change the date", { exact: true });
    await expect(date).toBeFocused();

    // The app's sentence, not the browser's bubble.
    await date.fill(shift(todayInZone(), -3));
    await card.getByRole("button", { name: "Save date" }).click();
    await expect(
      card
        .getByRole("alert")
        .filter({ hasText: "Pick today or a later date." }),
    ).toBeVisible();
    await expect(date).toHaveAttribute("aria-invalid", "true");

    await date.fill(shift(todayInZone(), 21));
    await card.getByRole("button", { name: "Save date" }).click();
    await expect(card).toContainText("3 weeks left");
    await expect(
      card.getByRole("button", { name: `Options for ${first}` }),
    ).toBeFocused();
    await expect(
      card.getByLabel("Change the date", { exact: true }),
    ).toHaveCount(0);
  });

  await test.step("an overdue goal asks for a decision; Extend clears it", async () => {
    const { error } = await admin
      .from("goals")
      .update({ target_date: shift(todayInZone(), -2) })
      .eq("user_id", user.id)
      .eq("title", second);
    expect(error).toBeNull();
    await page.reload();

    const card = goalCard(page, second);
    const checkin = card.getByLabel("One line: how did it go this week?");
    await expect(card).toContainText("2 days over");
    // Only the decision: no check-in box until it's extended.
    await expect(checkin).toHaveCount(0);
    await expect(card).not.toContainText("To do");
    for (const name of ["Mark done", "Extend", "Drop"]) {
      await expect(
        card.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    }
    await card.getByRole("button", { name: "Extend" }).click();
    const newDate = card.getByLabel("New date", { exact: true });
    await expect(newDate).toHaveValue(shift(todayInZone(), 28));
    await expect(newDate).toBeFocused();
    await card.getByRole("button", { name: "Save date" }).click();
    await expect(card).toContainText("4 weeks left");
    await expect(checkin).toBeVisible();
    await expect(card.locator(":focus")).toHaveCount(1);
    await expect(card).not.toContainText("over");
    await expect(card.getByRole("button", { name: "Extend" })).toHaveCount(0);
    await expectNoSideScroll(page);
  });

  await test.step("the Friday checklist tracks check-ins", async () => {
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: clock.zone,
      weekday: "short",
    }).format(new Date());
    const tonight = page.getByRole("navigation", {
      name: /Tonight|Before the week ends/,
    });
    if (weekday !== "Fri" && weekday !== "Sat") {
      await expect(tonight).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Goals", exact: true }),
      ).toBeVisible();
      return;
    }
    await expect(
      page.getByRole("heading", { name: "Goal check-in" }),
    ).toBeVisible();
    const goals = tonight.getByRole("link", { name: /Check in on your goals/ });
    await expect(goals).toContainText("0 of 3");
    const card = goalCard(page, first);
    await expect(card).toContainText("To do");
    await card
      .getByLabel("One line: how did it go this week?")
      .fill(`Ran 3k twice ${run}`);
    await card.getByRole("button", { name: "Save" }).click();
    await expect(goals).toContainText("1 of 3");
    await expect(card).not.toContainText("To do");
    await expect(
      page.getByText(/^Add a line on each goal before/),
    ).toBeVisible();

    // One overdue goal keeps the check-in line; all overdue asks to decide.
    const { error } = await admin
      .from("goals")
      .update({ target_date: shift(todayInZone(), -1) })
      .eq("user_id", user.id)
      .eq("title", first);
    expect(error).toBeNull();
    await page.reload();
    await expect(
      page.getByText(/^Add a line on each goal before/),
    ).toBeVisible();
    await expect(goals).toContainText("1 of 3");

    const all = await admin
      .from("goals")
      .update({ target_date: shift(todayInZone(), -1) })
      .eq("user_id", user.id)
      .is("finished_at", null);
    expect(all.error).toBeNull();
    await page.reload();
    await expect(
      page.getByText("Decide on your overdue goals first."),
    ).toBeVisible();
    await expect(
      tonight.getByRole("link", { name: /Decide on your overdue goals/ }),
    ).toBeVisible();
    await expect(goals).toHaveCount(0);
    await expect(
      page.getByLabel("One line: how did it go this week?"),
    ).toHaveCount(0);
  });
});
