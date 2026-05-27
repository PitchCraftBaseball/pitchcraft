import { test, expect } from "@playwright/test";

import { Page } from '@playwright/test';

test.describe("Pre Game Report Pop Up", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

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

    test("Correct Default Pitching and Batting teams in the Pop Up", async ({ page }) => {
        await expect(page.getByRole('table', { name: 'schedule table' })).toBeVisible();
        const rows = page.getByRole('row').filter({ hasText: /\d{4}-\d{2}-\d{2}/ });
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const cells = row.getByRole('cell');
            const cellCount = await cells.count();

            expect(cellCount).toBe(6);

            const awayText = await cells.nth(1).textContent();
            const homeText = await cells.nth(2).textContent();

            await expect(
                row.getByRole('button', { name: /open pre-game report/i })
            ).toBeVisible();

            await row.getByRole('button', { name: /open pre-game report/i }).click();

            await expect(
                page.getByRole('heading', { name: `Pitching: ${homeText}` })
            ).toBeVisible();

            await expect(
                page.getByRole('heading', { name: `Batting: ${awayText}` })
            ).toBeVisible();

            // TODO: Change this to have an aria label for closing the screen
            await page.locator('[role="presentation"] button').first().click();
        }
    });

});