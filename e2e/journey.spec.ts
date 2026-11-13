import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import {
  adminClient,
  createUser,
  deleteUsers,
  expectNoSideScroll,
  expectSaved,
  formWith,
  logIn,
  openTab,
  pickTimezone,
  requireSupabase,
  type TestUser,
} from "./support";

// Both browsers report this zone, so onboarding sets it as the space timezone.
const clock = pickTimezone();
test.use({ timezoneId: clock.zone });

const users: TestUser[] = [];

test.beforeAll(() => requireSupabase());

test.afterAll(async () => {
  if (users.length) await deleteUsers(adminClient(), users);
});

/** From Friday on, my notes sit in a collapsed "Your notes" section. */
async function showMyNotes(page: Page) {
  if (!clock.revealed) return;
  const details = page.locator("details").filter({ hasText: "Your notes" });
  if (!(await details.getAttribute("open").then((v) => v !== null))) {
    await details.getByText("Your notes", { exact: true }).click();
  }
}

test("two friends share a week", async ({ page, browser }, testInfo) => {
  test.setTimeout(180_000);
  testInfo.annotations.push({
    type: "timezone",
    description: `${clock.zone} (questions ${clock.revealed ? "revealed" : "hidden"})`,
  });
  const mobile = testInfo.project.name === "mobile";

  const admin = adminClient();
  const run = randomUUID().slice(0, 6);
  const a = await createUser(admin, `a-${run}`);
  const b = await createUser(admin, `b-${run}`);
  users.push(a, b);

  const nameA = `Ada${run}`;
  const nameB = `Ben${run}`;
  const renamedA = `Adele${run}`;
  const topicA = `Sourdough starters ${run}`;
  const longUrl = `https://example.com/fermentation/notes/${"wild-yeast-".repeat(8)}${run}`;
  const notesA = [
    `Feed it twice a day ${run}. https://example.com/starter`,
    "Rye flour makes it livelier than white flour, and warmer kitchens speed everything up.",
    `Long read: ${longUrl}`,
    "Hooch on top means it is hungry, not dead. Pour it off and feed it.",
    "Discard can go into pancakes, crackers, or flatbread instead of the bin.",
    "Questions to look into: why does it smell like nail polish remover sometimes?",
  ].join("\n");
  const goalA = `Run a half marathon ${run}`;
  const checkinA = `Ran 10k on Tuesday ${run}`;
  const question = `What kills a starter ${run}?`;
  // Exactly 110 characters, picked by B for the week.
  const upNext =
    `Tides ${run}: how the moon and sun pull the oceans, and why some estuaries get a tidal bore twice a day`
      .padEnd(110, "!")
      .slice(0, 110);
  const upNextLater =
    `Later ${run}: the history of timekeeping at sea, from dead reckoning to marine chronometers and GPS satellites`
      .padEnd(110, "!")
      .slice(0, 110);
  expect(upNext).toHaveLength(110);

  let inviteCode = "";

  await test.step("A logs in, onboards and sees the invite card", async () => {
    await page.goto("/auth/login");
    await logIn(page, a);
    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByLabel("Your name").fill(nameA);
    await page.getByRole("button", { name: "Start" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(
      page.getByRole("heading", { name: "Goalpost works best with a partner" }),
    ).toBeVisible();
    const link = await page
      .getByText(/\/join\//)
      .first()
      .textContent();
    inviteCode = link?.match(/\/join\/([^/\s]+)/)?.[1] ?? "";
    expect(inviteCode).not.toBe("");
  });

  await test.step("A picks a topic and saves notes", async () => {
    await page.getByLabel("What are you learning this week?").fill(topicA);
    await page.getByRole("button", { name: "Pick", exact: true }).click();
    await expect(
      page.getByRole("heading", { level: 2, name: topicA }),
    ).toBeVisible();

    await showMyNotes(page);
    await page.getByLabel("Notes", { exact: true }).fill(notesA);
    await page.getByRole("button", { name: "Save notes" }).click();
    await expect(
      page.getByRole("button", { name: "Edit notes" }),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Saved" }),
    ).toBeVisible();
  });

  await test.step("A adds a goal and checks in", async () => {
    await page.getByRole("button", { name: "Add a goal" }).click();
    const add = formWith(page, "What do you want to get done?");
    await add.getByLabel("What do you want to get done?").fill(goalA);
    await add.getByRole("button", { name: "Add goal" }).click();
    await expect(page.getByText(goalA, { exact: true })).toBeVisible();

    const checkin = formWith(page, "One line: how did it go this week?");
    await checkin
      .getByLabel("One line: how did it go this week?")
      .fill(checkinA);
    await checkin.getByRole("button", { name: "Save" }).click();
    await expectSaved(checkin);

    await page.reload();
    await expect(
      page.getByLabel("One line: how did it go this week?"),
    ).toHaveValue(checkinA);
    await showMyNotes(page);
    await expect(page.getByText(`Feed it twice a day ${run}.`)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "https://example.com/starter" }),
    ).toHaveAttribute("href", "https://example.com/starter");
  });

  const contextB = await browser.newContext({ timezoneId: clock.zone });
  const pageB = await contextB.newPage();

  await test.step("B opens the invite, logs in and joins A's space", async () => {
    await pageB.goto(`/join/${inviteCode}`);
    await expect(pageB).toHaveURL(/\/auth\/signup\?/);
    expect(new URL(pageB.url()).searchParams.get("next")).toBe(
      `/join/${inviteCode}`,
    );
    await pageB.getByRole("link", { name: "Log in", exact: true }).click();
    await expect(pageB).toHaveURL(/\/auth\/login\?/);
    expect(new URL(pageB.url()).searchParams.get("next")).toBe(
      `/join/${inviteCode}`,
    );
    await logIn(pageB, b);
    await expect(pageB).toHaveURL(/\/onboarding\?invite=/);
    await expect(pageB.getByText(`You're joining ${nameA}`)).toBeVisible();
    await pageB.getByLabel("Your name").fill(nameB);
    await pageB.getByRole("button", { name: "Join" }).click();
    await expect(pageB).toHaveURL(/\/app$/);
  });

  await test.step("B sees A's week and asks a question", async () => {
    await expect(pageB.getByText(`${nameA} is learning`)).toBeVisible();
    await expect(
      pageB.getByRole("heading", { level: 2, name: topicA }),
    ).toBeVisible();
    await expect(pageB.getByText(`Feed it twice a day ${run}`)).toBeVisible();
    await expect(
      pageB.getByRole("link", { name: "https://example.com/starter" }),
    ).toHaveAttribute("rel", "noopener noreferrer");
    await expect(pageB.getByText(checkinA)).toBeVisible();

    const ask = formWith(pageB, `Ask ${nameA} a question`);
    await ask.getByLabel(`Ask ${nameA} a question`).fill(question);
    await ask.getByRole("button", { name: "Add" }).click();
    await expect(pageB.getByText(question)).toBeVisible();

    const remove = pageB.getByRole("button", {
      name: `Delete question: ${question}`,
    });
    if (clock.revealed) {
      // Once the interview has started, questions can't be pulled back.
      await expect(remove).toHaveCount(0);
      await expect(
        pageB.getByText(`${nameA} can see these now.`),
      ).toBeVisible();
    } else {
      await expect(remove).toBeVisible();
      await expect(
        pageB.getByText(new RegExp(`^${nameA} can't see these until `)),
      ).toBeVisible();
    }
  });

  await test.step("A cannot read the question before Friday", async () => {
    await page.reload();
    await expect(page.getByText(`${nameB} hasn't picked yet.`)).toBeVisible();
    if (clock.revealed) {
      await expect(
        page.getByRole("heading", { name: "Your questions" }),
      ).toBeVisible();
      await expect(page.getByText(question)).toBeVisible();
    } else {
      await expect(
        page.getByText(/^Questions are hidden until /),
      ).toBeVisible();
      await expect(page.getByText(question)).toHaveCount(0);
    }
  });

  await test.step("B adds to Up next and picks one for this week", async () => {
    await openTab(pageB, "Up next");
    await expect(pageB).toHaveURL(/\/app\/next$/);
    const add = formWith(pageB, "Add a topic");
    for (const title of [upNext, upNextLater]) {
      await add.getByLabel("Add a topic").fill(title);
      await add.getByRole("button", { name: "Add" }).click();
      await expect(
        pageB.getByRole("listitem").filter({ hasText: title }),
      ).toContainText(`Added by ${nameB}`);
    }

    await pageB
      .getByRole("listitem")
      .filter({ hasText: upNext })
      .getByRole("button", { name: "Pick for this week" })
      .click();
    await expect(pageB).toHaveURL(/\/app$/);
    await expect(
      pageB.getByRole("heading", { level: 2, name: upNext }),
    ).toBeVisible();

    await openTab(pageB, "Up next");
    await expect(pageB.getByText(upNextLater)).toBeVisible();
    await expect(pageB.getByText(upNext)).toHaveCount(0);
    await expect(
      pageB.getByRole("button", { name: "Pick for this week" }),
    ).toHaveCount(0);

    await page.reload();
    await expect(page.getByText(`${nameB} is learning`)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: upNext }),
    ).toBeVisible();
  });

  if (mobile) {
    await test.step("no screen scrolls sideways on a phone", async () => {
      for (const path of [
        "/app",
        "/app/next",
        "/app/history",
        "/app/settings",
      ]) {
        await pageB.goto(path);
        await expect(pageB.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoSideScroll(pageB);
      }
    });
  }

  await test.step("A renames themself in settings", async () => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/app\/settings$/);
    const form = formWith(page, "Name");
    await form.getByLabel("Name", { exact: true }).fill(renamedA);
    await form.getByRole("button", { name: "Save", exact: true }).click();
    await expectSaved(form);

    await pageB.goto("/app");
    await expect(pageB.getByText(`${renamedA} is learning`)).toBeVisible();
  });

  await test.step("A finishes the goal", async () => {
    await openTab(page, "This week");
    await page.getByRole("button", { name: `Options for ${goalA}` }).click();
    await page.getByRole("button", { name: "Mark done" }).click();
    const finished = page
      .getByRole("listitem")
      .filter({ hasText: "Finished this week" });
    await expect(finished).toContainText(goalA);
    await expect(
      page.getByLabel("One line: how did it go this week?"),
    ).toHaveCount(0);
  });

  await test.step("signed-out pages show none of it", async () => {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    const secrets = [
      nameA,
      nameB,
      renamedA,
      topicA,
      question,
      upNext,
      inviteCode,
      a.email,
      b.email,
    ];
    for (const path of ["/", "/auth/login", "/auth/signup", "/privacy"]) {
      await anonPage.goto(path);
      const html = await anonPage.content();
      for (const secret of secrets) expect(html).not.toContain(secret);
    }

    await test.step("signing up again with A's email is refused", async () => {
      await anonPage.goto("/auth/signup");
      await anonPage.getByLabel("Email").fill(a.email);
      await anonPage.getByLabel("Password").fill(`pw-${randomUUID()}`);
      await anonPage.getByRole("button", { name: "Create account" }).click();
      // Next's route announcer is also an alert, so match on the text.
      await expect(
        anonPage
          .getByRole("alert")
          .filter({ hasText: "That email already has an account" }),
      ).toBeVisible();
    });
    await anon.close();
  });

  await contextB.close();
});
