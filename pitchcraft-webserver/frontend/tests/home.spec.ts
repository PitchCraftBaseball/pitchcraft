import { test, expect } from "@playwright/test";

import { Page } from '@playwright/test';

async function selectDate(page: Page, month: string, day: string, year: string) {
  await page.getByRole('spinbutton', { name: 'Month' }).click();
  await page.getByRole('spinbutton', { name: 'Month' }).pressSequentially(month);
  await page.getByRole('spinbutton', { name: 'Day' }).pressSequentially(day);
  await page.getByRole('spinbutton', { name: 'Year' }).pressSequentially(year);
  await page.keyboard.press('Enter');

  const expectedDate = `${year}-${month}-${day}`;
  await expect(
    page.getByRole('row').filter({ hasText: expectedDate }).first()
  ).toBeVisible();
}

test.describe("Home screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Home Screen has default components loaded", async ({ page }) => {
    await expect(page.getByRole("link", { name: "PitchCraft" })).toBeVisible();
    await expect(page.getByRole("button", { name: "USER GUIDE" })).toBeVisible();
    await expect(page.getByRole("button", { name: "SIMULATION" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
    await expect(page.getByRole("group", { name: "datepicker" })).toBeVisible();
    await expect(page.getByRole("table", { name: "schedule table" })).toBeVisible();
  });

  test("Navigate to User Guide", async ({ page }) => {
    await page.getByRole("button", { name: "User Guide" }).click();
    await expect(page).toHaveURL(/\/guide/);
    await page.goto("/");
  });

  test("Navigate to Simulation Screen", async ({ page }) => {
    await page.getByRole("button", { name: "Simulation" }).click();
    await expect(page).toHaveURL(/\/simulation/);
    await page.goto("/");
  });

  test("Exit User Guide", async ({ page }) => {
    await page.goto("/guide");
    await page.getByRole("link", { name: "PitchCraft" }).click();
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
  });

  test("Exit Simulation Screen", async ({ page }) => {
    await page.goto("/simulation");
    await page.getByRole("link", { name: "PitchCraft" }).click();
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
  });

  test("Select a Date from Calendar", async ({ page }) => {
    await page.getByRole("button", { name: /Choose date/i }).click();
    await expect(page.getByRole("button", { name: "Next Month" })).toBeVisible();
    await page.getByRole("button", { name: "Next Month" }).click();
    await expect(page.getByRole('grid').getByRole('gridcell', { name: '10' }).first()).toBeVisible();
    await page.getByRole('grid').getByRole('gridcell', { name: '10' }).first().click();  
    await expect(
      page.getByRole('row').filter({ hasText: '2026-06-10' })
          .getByRole('cell', { name: 'Boston Red Sox', exact: true})
    ).toBeVisible();
  });

  test("Type a Date into the DatePicker", async ({ page }) => {
    await page.getByRole('spinbutton', { name: 'Month' }).click();
    await page.getByRole('spinbutton', { name: 'Month' }).fill('06');

    await page.getByRole('spinbutton', { name: 'Day' }).click();
    await page.getByRole('spinbutton', { name: 'Day' }).fill('10');

    await page.getByRole('spinbutton', { name: 'Year' }).click();
    await page.getByRole('spinbutton', { name: 'Year' }).fill('2026');

    await page.keyboard.press('Enter');

    await expect(
      page.getByRole('row').filter({ hasText: '2026-06-10' })
          .getByRole('cell', { name: 'Boston Red Sox', exact: true })
          .first()
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

    await expect(page.getByRole('spinbutton', { name: 'Month' })).toHaveText(month);
    await expect(page.getByRole('spinbutton', { name: 'Day' })).toHaveText(day);
    await expect(page.getByRole('spinbutton', { name: 'Year' })).toHaveText(year);
  });

  test("Games in Table matched the Selected Date", async ({ page }) => {
    await expect(page.getByRole('table', { name: 'schedule table' })).toBeVisible();

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = String(today.getFullYear());
    const expectedDate = `${year}-${month}-${day}`;

    const rows = page.getByRole('row').filter({ hasText: expectedDate });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      await expect(
        rows.nth(i).getByRole('cell').first()
      ).toContainText(expectedDate);
    }

    await page.getByRole("button", { name: /Choose date/i }).click();
    await expect(page.getByRole("button", { name: "Next Month" })).toBeVisible();
    await page.getByRole("button", { name: "Next Month" }).click();
    await page.getByRole('grid').getByRole('gridcell', { name: '10' }).first().click();

    const newMonth = await page.getByRole('spinbutton', { name: 'Month' }).textContent();
    const newDay = await page.getByRole('spinbutton', { name: 'Day' }).textContent();
    const newYear = await page.getByRole('spinbutton', { name: 'Year' }).textContent();
    const newExpectedDate = `${newYear}-${newMonth?.padStart(2, '0')}-${newDay?.padStart(2, '0')}`;

    await expect(page.getByRole('row').filter({ hasText: newExpectedDate }).first()).toBeVisible();

    const newRows = page.getByRole('row').filter({ hasText: newExpectedDate });
    const newRowCount = await newRows.count();
    expect(newRowCount).toBeGreaterThan(0);

    for (let i = 0; i < newRowCount; i++) {
      await expect(
        newRows.nth(i).getByRole('cell').first()
      ).toContainText(newExpectedDate);
    }
  });

  test("Each row in the Table is unique", async ({ page }) => {
    // Wait for table to load
    await selectDate(page, '06', '10', '2026');
    await expect(
      page.getByRole('row').filter({ hasText: /\d{4}-\d{2}-\d{2}/ }).first()
    ).toBeVisible();

    // Get all data rows (excluding header)
    const rows = page.getByRole('row').filter({ hasText: /\d{4}-\d{2}-\d{2}/ });
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
    const rows = page.getByRole('row').filter({ hasText: /\d{4}-\d{2}-\d{2}/ });
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
