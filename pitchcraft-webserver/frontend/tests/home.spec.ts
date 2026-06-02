import { test, expect } from "@playwright/test";

test.describe("Home screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/schedule/date*", (r) => r.fulfill({ json: [] }));
    await page.goto("/");
  });

  test("shows the Pitchcraft heading and navbar brand", async ({ page }) => {
    await expect(page.getByRole("link", { name: "PitchCraft" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pitchcraft" })).toBeVisible();
  });

  test("navigation buttons route to the correct pages", async ({ page }) => {
    await page.getByRole("button", { name: "Simulate Matchup" }).click();
    await expect(page).toHaveURL(/\/simulation/);

    await page.goto("/");

    await page.getByRole("button", { name: "User Guide" }).click();
    await expect(page.getByTestId("user-guide")).toBeVisible();
  });
});
