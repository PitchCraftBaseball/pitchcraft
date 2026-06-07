import { test, expect } from "@playwright/test";

import { Page } from '@playwright/test';


const NYY_ID = 147; // New York Yankees
const BOS_ID = 111; // Boston Red Sox
const PHI_ID = 143; // Philadelphia Phillies
const LAD_ID = 119; // Los Angeles Dodgers

// Computed using local time to match how GameScheduleTable formats the date
// for its initial API request (dayjs().format("YYYY-MM-DD") uses local time).
const _d = new Date();
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

const MOCK_GAMES: Record<string, object[]> = {
  [TODAY]: [
    {
      game_id: "747001",
      game_datetime: `${TODAY}T17:05:00Z`,
      away_team: "New York Yankees",
      away_team_id: NYY_ID,
      home_team: "Boston Red Sox",
      home_team_id: BOS_ID,
      venue_id: 3,
      venue_name: "Fenway Park",
    },
    {
      game_id: "777001",
      game_datetime: `${TODAY}T20:05:00Z`,
      away_team: "Los Angeles Dodgers",
      away_team_id: LAD_ID,
      home_team: "Philadelphia Phillies",
      home_team_id: PHI_ID,
      venue_id: 2681,
      venue_name: "Citizens Bank Park",
    },
  ],
  "2026-06-10": [
    {
      game_id: "747002",
      game_datetime: "2026-06-10T17:10:00Z",
      away_team: "New York Yankees",
      away_team_id: NYY_ID,
      home_team: "Boston Red Sox",
      home_team_id: BOS_ID,
      venue_id: 3,
      venue_name: "Fenway Park",
    },
    {
      game_id: "747005",
      game_datetime: "2026-06-10T20:05:00Z",
      away_team: "Los Angeles Dodgers",
      away_team_id: LAD_ID,
      home_team: "Philadelphia Phillies",
      home_team_id: PHI_ID,
      venue_id: 2681,
      venue_name: "Citizens Bank Park",
    },
    {
      game_id: "747006",
      game_datetime: "2026-06-10T22:10:00Z",
      away_team: "Chicago Cubs",
      away_team_id: 112,
      home_team: "St. Louis Cardinals",
      home_team_id: 138,
      venue_id: 2889,
      venue_name: "Busch Stadium",
    },
  ],
  "2026-07-10": [
    {
      game_id: "747003",
      game_datetime: "2026-07-10T22:45:00Z",
      away_team: "New York Yankees",
      away_team_id: NYY_ID,
      home_team: "Boston Red Sox",
      home_team_id: BOS_ID,
      venue_id: 3,
      venue_name: "Fenway Park",
    },
  ],
};

async function selectDate(page: Page, month: string, day: string, year: string) {
  await page.getByRole('spinbutton', { name: 'Month' }).click();
  await page.getByRole('spinbutton', { name: 'Month' }).pressSequentially(month);
  await page.getByRole('spinbutton', { name: 'Day' }).pressSequentially(day);
  await page.getByRole('spinbutton', { name: 'Year' }).pressSequentially(year);
  await page.keyboard.press('Enter');

  const expectedDate = `${year}-${month}-${day}`;
  await expect(
    page.getByRole('row').filter({ hasText: /PM/ }).first()
  ).toBeVisible();
}

test.describe("Home screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/schedule/date*", async (route) => {
      const url = new URL(route.request().url());
      const date = url.searchParams.get("date") ?? "";
      await route.fulfill({ json: MOCK_GAMES[date] ?? [] });
    });
    await page.goto("/");
    await expect(page.getByRole("table", { name: "schedule table" })).toBeVisible();
  });

  test("Home Screen has default components loaded", async ({ page }) => {
    await expect(page.getByRole("link", { name: "PitchCraft" })).toBeVisible();
    await expect(page.getByRole("button", { name: "USER GUIDE" })).toBeVisible();
    await expect(page.getByRole("button", { name: "SIMULATE MATCHUP" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Choose date/i })).toBeVisible();
    await expect(page.getByRole("table", { name: "schedule table" })).toBeVisible();
  });

  test("navigation buttons route to the correct pages", async ({ page }) => {
    await page.getByRole("button", { name: "SIMULATE MATCHUP" }).click();
    await expect(page).toHaveURL(/\/simulation/);

    await page.goto("/");
    await expect(page.getByRole("table", { name: "schedule table" })).toBeVisible();

    await page.getByRole("button", { name: "User Guide" }).click();
    await expect(page.getByTestId("user-guide")).toBeVisible();
  });

  test("Navigate to Simulation Screen", async ({ page }) => {
    await page.getByRole("button", { name: "SIMULATE MATCHUP" }).click();
    await expect(page).toHaveURL(/\/simulation/);
    await page.goto("/");
    await expect(page.getByRole("table", { name: "schedule table" })).toBeVisible();
  });

  test("Show User Guide", async ({ page }) => {
    await page.getByRole("button", { name: "User Guide" }).click();
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

    await page.getByTestId('close-user-guide').click();    
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
  });

  test("Exit Simulation Screen", async ({ page }) => {
    await page.goto("/simulation");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "PitchCraft" })).toBeVisible();
    await page.getByRole("link", { name: "PitchCraft" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
    await expect(page.getByRole("table", { name: "schedule table" })).toBeVisible();
  });

  test("Select a Date from Calendar", async ({ page }) => {
    await page.getByRole("button", { name: /Choose date/i }).click();
    await expect(page.getByRole("button", { name: "Next Month" })).toBeVisible();
    await page.getByRole("button", { name: "Next Month" }).click();

    // Wait for the calendar grid to be stable after month navigation
    const grid = page.getByRole("grid");
    await expect(grid).toBeVisible();

    const dayCell = grid.getByRole("gridcell", { name: "10" }).first();
    await expect(dayCell).toBeVisible();
    await dayCell.click();

    await expect(page.getByRole("spinbutton", { name: "Day" })).toHaveText("10");

    await expect(
      page.getByRole("row").filter({ hasText: /PM/ }).first()
    ).toBeVisible();
  });

  test("Type a Date into the DatePicker", async ({ page }) => {
    await page.getByRole('spinbutton', { name: 'Month' }).click();
    await page.getByRole('spinbutton', { name: 'Month' }).pressSequentially('06');
    await page.getByRole('spinbutton', { name: 'Day' }).pressSequentially('10');
    await page.getByRole('spinbutton', { name: 'Year' }).pressSequentially('2026');

    await page.keyboard.press('Enter');

    await expect(
      page.getByRole('cell', { name: 'Boston Red Sox', exact: true }).first()
    ).toBeVisible();
  });

  test("DatePicker shows error for invalid date", async ({ page }) => {
    await page.getByRole('spinbutton', { name: 'Month' }).click();
    await page.getByRole('spinbutton', { name: 'Month' }).pressSequentially('13'); // invalid month

    await page.getByRole('spinbutton', { name: 'Day' }).pressSequentially('45'); // invalid day

    await page.getByRole('spinbutton', { name: 'Year' }).pressSequentially('2222'); // invalid year

    await page.keyboard.press('Enter');

    await expect(page.locator('[role="group"][aria-invalid="true"]')).toBeVisible();
  });

  test("DatePicker default day is the current date", async ({ page }) => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = String(today.getFullYear());

    await expect(page.getByRole('spinbutton', { name: 'Month' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Month' })).toHaveText(month);
    await expect(page.getByRole('spinbutton', { name: 'Day' })).toHaveText(day);
    await expect(page.getByRole('spinbutton', { name: 'Year' })).toHaveText(year);
  });

  // test("Games in Table matched the Selected Date", async ({ page }) => {
  //   await expect(page.getByRole('table', { name: 'schedule table' })).toBeVisible();

  //   const today = new Date();
  //   const month = String(today.getMonth() + 1).padStart(2, '0');
  //   const day = String(today.getDate()).padStart(2, '0');
  //   const year = String(today.getFullYear());
  //   const expectedDate = `${year}-${month}-${day}`;

  //   const rows = page.getByRole('row').filter({ hasText: expectedDate });
  //   const rowCount = await rows.count();
  //   expect(rowCount).toBeGreaterThan(0);

  //   for (let i = 0; i < rowCount; i++) {
  //     await expect(
  //       rows.nth(i).getByRole('cell').first()
  //     ).toContainText(expectedDate);
  //   }

  //   await page.getByRole("button", { name: /Choose date/i }).click();
  //   await expect(page.getByRole("button", { name: "Next Month" })).toBeVisible();
  //   await page.getByRole("button", { name: "Next Month" }).click();
  //   await page.getByRole('grid').getByRole('gridcell', { name: '10' }).first().click();

  //   const newMonth = await page.getByRole('spinbutton', { name: 'Month' }).textContent();
  //   const newDay = await page.getByRole('spinbutton', { name: 'Day' }).textContent();
  //   const newYear = await page.getByRole('spinbutton', { name: 'Year' }).textContent();
  //   const newExpectedDate = `${newYear}-${newMonth?.padStart(2, '0')}-${newDay?.padStart(2, '0')}`;

  //   await expect(page.getByRole('row').filter({ hasText: newExpectedDate }).first()).toBeVisible();

  //   const newRows = page.getByRole('row').filter({ hasText: newExpectedDate });
  //   const newRowCount = await newRows.count();
  //   expect(newRowCount).toBeGreaterThan(0);

  //   for (let i = 0; i < newRowCount; i++) {
  //     await expect(
  //       newRows.nth(i).getByRole('cell').first()
  //     ).toContainText(newExpectedDate);
  //   }
  // });

  test("Each row in the Table is unique", async ({ page }) => {
    // Wait for table to load
    await selectDate(page, '06', '10', '2026');

    // Get all data rows (excluding header)
    const rows = page.getByRole('row').filter({ hasText: /PM/ });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Collect the text content of each row
    const rowTexts: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const rowText = await rows.nth(i).textContent();
      rowTexts.push(rowText ?? '');
    }

    // Assert all rows are unique by comparing array length to Set size
    const uniqueRows = new Set(rowTexts);
    expect(uniqueRows.size).toBe(rowTexts.length);
  });

  test("Check each row of Games Table has content", async ({ page }) => {
    await expect(page.getByRole('table', { name: 'schedule table' })).toBeVisible();
    const rows = page.getByRole('row').filter({ hasText: /PM/ });
    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.getByRole('cell');
      const cellCount = await cells.count();

      expect(cellCount).toBe(6);

      // Assert each cell has non-empty text
      for (let j = 0; j < cellCount; j++) {
        const cellText = await cells.nth(j).textContent();
        expect(cellText?.trim()).not.toBe('');
      }
      await expect(
        row.getByRole('button', { name: /open pre-game report/i })
      ).toBeVisible();
    }

  });
  



  

});
