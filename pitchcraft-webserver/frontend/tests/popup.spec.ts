// Pre-Game Report Pop-Up Test Suite
// Test IDs 15 -> 31
// Section 3.2 of the system test plan.
//
// Strategy: mock /api/schedule/date to show one Phillies (home, 143) vs
// Dodgers (away, 119) game, mock /api/players/projected-lineup to return a
// full lineup, then interact with the popup dialog.

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function p(
  id: number, first: string, last: string, pos: string, team: number
) {
  return {
    id, use_first_name: first, use_last_name: last,
    first_name: first, last_name: last, position: pos, team_id: team,
    birthdate: "1990-01-01", batting_side: "R", throwing_arm: "R",
    height: 72, weight: 200, jersey_number: 0,
  };
}

const HOME_ID = 143; // Philadelphia Phillies
const AWAY_ID = 119; // Los Angeles Dodgers
const GAME_PK  = "777001";

const PHI_PITCHERS = [
  p(554430, "Zack",   "Wheeler", "P", HOME_ID),
  p(605400, "Aaron",  "Nola",    "P", HOME_ID),
];

const PHI_BATTERS = [
  p(547989, "Bryce",   "Harper",      "1B", HOME_ID),
  p(656775, "Trea",    "Turner",      "SS", HOME_ID),
  p(669272, "Kyle",    "Schwarber",   "LF", HOME_ID),
  p(605141, "Nick",    "Castellanos", "RF", HOME_ID),
  p(596142, "J.T.",    "Realmuto",    "C",  HOME_ID),
  p(606466, "Alec",    "Bohm",        "3B", HOME_ID),
  p(677800, "Brandon", "Marsh",       "CF", HOME_ID),
  p(681584, "Johan",   "Rojas",       "CF", HOME_ID),
  p(691176, "Bryson",  "Stott",       "2B", HOME_ID),
];

const LAD_PITCHERS = [
  p(607192, "Tyler",     "Glasnow",  "P", AWAY_ID),
  p(808982, "Yoshinobu", "Yamamoto", "P", AWAY_ID),
];

const LAD_BATTERS = [
  p(660271, "Shohei",   "Ohtani",    "DH", AWAY_ID),
  p(658264, "Freddie",  "Freeman",   "1B", AWAY_ID),
  p(592518, "Mookie",   "Betts",     "RF", AWAY_ID),
  p(621439, "Teoscar",  "Hernandez", "LF", AWAY_ID),
  p(571771, "Max",      "Muncy",     "3B", AWAY_ID),
  p(645302, "Tommy",    "Edman",     "2B", AWAY_ID),
  p(669242, "Will",     "Smith",     "C",  AWAY_ID),
  p(593934, "Gavin",    "Lux",       "SS", AWAY_ID),
  p(680776, "Dalton",   "Rushing",   "C",  AWAY_ID),
];

const MOCK_SCHEDULE = [
  {
    game_id: GAME_PK,
    game_datetime: "2026-05-28T17:05:00Z",
    away_team: "Los Angeles Dodgers",
    away_team_id: AWAY_ID,
    home_team: "Philadelphia Phillies",
    home_team_id: HOME_ID,
    venue_id: 2681,
    venue_name: "Citizens Bank Park",
  },
];

// openReportPopup sets: pitching=home(PHI), batting=away(LAD)
//   players[0]  = data.home.pitcher  → Wheeler
//   players[1..9] = data.away.batters → 9 LAD batters
function makeLineup(awayFromDate: string | null, homeFromDate: string | null) {
  return {
    home: { fromDate: homeFromDate, pitcher: PHI_PITCHERS[0], batters: PHI_BATTERS },
    away: { fromDate: awayFromDate, pitcher: LAD_PITCHERS[0], batters: LAD_BATTERS },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mockPlayerAPIs(page: Page) {
  await page.route("**/api/players/pitchers*", async (route) => {
    const url  = new URL(route.request().url());
    const tid  = Number(url.searchParams.get("teamId"));
    await route.fulfill({ json: tid === HOME_ID ? PHI_PITCHERS : tid === AWAY_ID ? LAD_PITCHERS : [] });
  });
  await page.route("**/api/players/batters*", async (route) => {
    const url  = new URL(route.request().url());
    const tid  = Number(url.searchParams.get("teamId"));
    await route.fulfill({ json: tid === HOME_ID ? PHI_BATTERS : tid === AWAY_ID ? LAD_BATTERS : [] });
  });
}

async function openPopup(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Pre-Game Report" }).click();
  await expect(page.getByRole("button", { name: "Swap Teams" })).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

test.describe("Pre-Game Report Pop-Up (official lineup)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/schedule/date*", (r) => r.fulfill({ json: MOCK_SCHEDULE }));
    await page.route("**/api/players/projected-lineup*", (r) =>
      r.fulfill({ json: makeLineup(null, null) })
    );
    await mockPlayerAPIs(page);
    await openPopup(page);
  });

  // Test 15: pitching = home team, batting = away team on open
  test("POP_UP_DEFAULT_TEAMS", async ({ page }) => {
    // Pitcher slot pre-filled with home-team (Phillies) pitcher
    await expect(page.getByLabel("Select Pitcher")).toHaveValue("Zack Wheeler");
    // Batter slot 1 pre-filled with away-team (Dodgers) batter
    await expect(page.getByLabel("Select Batter 1")).toHaveValue("Shohei Ohtani");
    // Team names visible in the modal header
    await expect(page.getByRole("heading", { name: "Philadelphia Phillies" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Los Angeles Dodgers" })).toBeVisible();
  });

  // Test 16: swap button switches pitching / batting teams
  test("POP_UP_SWAP_TEAMS_CHECK", async ({ page }) => {
    await page.getByRole("button", { name: "Swap Teams" }).click();
    // After swap: pitching = LAD (Glasnow), batting = PHI (Harper)
    await expect(page.getByLabel("Select Pitcher")).toHaveValue("Tyler Glasnow");
    await expect(page.getByLabel("Select Batter 1")).toHaveValue("Bryce Harper");
    await expect(page.getByRole("heading", { name: "Los Angeles Dodgers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Philadelphia Phillies" })).toBeVisible();
  });

  // Test 17: pitcher dropdown contains players from the pitching team
  test("POP_UP_VERIFY_PITCHER", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Select Pitcher" });
    await input.click();
    await input.fill("");
    await expect(page.getByRole("option", { name: "Zack Wheeler" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Aaron Nola" })).toBeVisible();
  });

  // Test 18: batter dropdown contains players from the batting team
  test("POP_UP_VERIFY_BATTER", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Select Batter 1" });
    await input.click();
    await input.fill("");
    await expect(page.getByRole("option", { name: "Shohei Ohtani" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Freddie Freeman" })).toBeVisible();
  });

  // Test 19: opposing-team pitcher absent from pitcher dropdown
  test("POP_UP_INVALID_PITCHER", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Select Pitcher" });
    await input.click();
    await input.fill("Glasnow");
    await expect(page.getByRole("option", { name: "Tyler Glasnow" })).toHaveCount(0);
  });

  // Test 20: opposing-team batter absent from batter dropdown
  test("POP_UP_INVALID_BATTER", async ({ page }) => {
    const input = page.getByRole("combobox", { name: "Select Batter 1" });
    await input.click();
    await input.fill("Harper");
    await expect(page.getByRole("option", { name: "Bryce Harper" })).toHaveCount(0);
  });

  // Test 21: after swap, pitcher dropdown shows new pitching team's pitchers
  test("POP_UP_PITCHER_AFTER_SWAP", async ({ page }) => {
    await page.getByRole("button", { name: "Swap Teams" }).click();
    // pitching is now LAD
    const input = page.getByRole("combobox", { name: "Select Pitcher" });
    await input.click();
    await input.fill("");
    await expect(page.getByRole("option", { name: "Tyler Glasnow" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Yoshinobu Yamamoto" })).toBeVisible();
  });

  // Test 22: after swap, batter dropdowns show new batting team's batters
  test("POP_UP_BATTER_AFTER_SWAP", async ({ page }) => {
    await page.getByRole("button", { name: "Swap Teams" }).click();
    // batting is now PHI
    const input = page.getByRole("combobox", { name: "Select Batter 1" });
    await input.click();
    await input.fill("");
    await expect(page.getByRole("option", { name: "Bryce Harper" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Trea Turner" })).toBeVisible();
  });

  // Test 23: double swap restores original player selections
  test("POP_UP_SWAP_BACK", async ({ page }) => {
    const swapBtn = page.getByRole("button", { name: "Swap Teams" });
    await swapBtn.click();
    await expect(page.getByLabel("Select Pitcher")).toHaveValue("Tyler Glasnow");
    await swapBtn.click();
    await expect(page.getByLabel("Select Pitcher")).toHaveValue("Zack Wheeler");
    await expect(page.getByLabel("Select Batter 1")).toHaveValue("Shohei Ohtani");
  });

  // Test 24: Continue is disabled until all 10 slots are filled
  test("POP_UP_MISSING_INPUT", async ({ page }) => {
    // Clear empties all slots
    await page.getByRole("button", { name: "Clear" }).click();
    const continueBtn = page.getByRole("button", { name: "Continue" });
    await expect(continueBtn).toBeDisabled();

    // Fill only the pitcher slot; Continue still disabled (1 of 10)
    const pitcherInput = page.getByRole("combobox", { name: "Select Pitcher" });
    await pitcherInput.click();
    await pitcherInput.fill("Wheeler");
    await page.getByRole("option", { name: "Zack Wheeler" }).click();
    await expect(continueBtn).toBeDisabled();
  });

  // Test 25: batter names absent from pitcher dropdown; pitcher absent from batter dropdown
  test("POP_UP_WRONG_POSITION", async ({ page }) => {
    // Batter absent from pitcher dropdown
    const pitInput = page.getByRole("combobox", { name: "Select Pitcher" });
    await pitInput.click();
    await pitInput.fill("Ohtani");
    await expect(page.getByRole("option", { name: "Shohei Ohtani" })).toHaveCount(0);

    // Dismiss pitcher dropdown before opening batter dropdown
    await page.keyboard.press("Escape");

    // Pitcher absent from batter dropdown
    const batInput = page.getByRole("combobox", { name: "Select Batter 1" });
    await batInput.click();
    await batInput.fill("Wheeler");
    await expect(page.getByRole("option", { name: "Zack Wheeler" })).toHaveCount(0);
  });

  // Test 26: same batter cannot be selected in two slots
  test("POP_UP_NO_DUPLICATE", async ({ page }) => {
    // Clear all slots first so selectedPlayers is empty
    await page.getByRole("button", { name: "Clear" }).click();

    // Select Ohtani in batter slot 1
    const batter1 = page.getByRole("combobox", { name: "Select Batter 1" });
    await batter1.click();
    await batter1.fill("Ohtani");
    await page.getByRole("option", { name: "Shohei Ohtani" }).click();

    // Open batter slot 2 — Ohtani should be disabled
    const batter2 = page.getByRole("combobox", { name: "Select Batter 2" });
    await batter2.click();
    await batter2.fill("Ohtani");
    const opt = page.getByRole("option", { name: "Shohei Ohtani" });
    await expect(opt).toBeVisible();
    await expect(opt).toHaveAttribute("aria-disabled", "true");
  });

  // Test 27: after swap, original pitching team pitcher absent from new pitcher dropdown
  test("POP_UP_WRONG_POSITION_SWAP", async ({ page }) => {
    await page.getByRole("button", { name: "Swap Teams" }).click();
    // pitching is now LAD — Phillies pitcher Wheeler should not appear
    const input = page.getByRole("combobox", { name: "Select Pitcher" });
    await input.click();
    await input.fill("Wheeler");
    await expect(page.getByRole("option", { name: "Zack Wheeler" })).toHaveCount(0);
  });

  // Test 28: official posted lineup shows success alert (fromDate === null)
  test("POP_UP_OFFICIAL_LINEUP_MSG", async ({ page }) => {
    await expect(
      page.getByText("This lineup is the official posted lineup for this game.")
    ).toBeVisible();
  });

  // Test 30: Clear removes all selections, hides alert, disables Continue
  test("POP_UP_CLEAR_BUTTON", async ({ page }) => {
    // Continue is enabled before clearing (all 10 filled)
    await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();

    await page.getByRole("button", { name: "Clear" }).click();

    // All batter inputs empty
    for (let i = 1; i <= 9; i++) {
      await expect(page.getByLabel(`Select Batter ${i}`)).toHaveValue("");
    }
    // Alert gone (batting lineup was edited)
    await expect(
      page.getByText("This lineup is the official posted lineup for this game.")
    ).toHaveCount(0);
    // Continue disabled
    await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  // Test 31: after clear → close → reopen, autofill message reappears
  test("POP_UP_REOPEN_AFTER_CLEAR", async ({ page }) => {
    await page.getByRole("button", { name: "Clear" }).click();
    // Alert gone after clear
    await expect(
      page.getByText("This lineup is the official posted lineup for this game.")
    ).toHaveCount(0);

    // Close popup
    await page.getByLabel("close pregame popup").click();
    await expect(page.getByRole("button", { name: "Swap Teams" })).toHaveCount(0);

    // Reopen
    await page.getByRole("button", { name: "Open Pre-Game Report" }).click();
    await expect(page.getByRole("button", { name: "Swap Teams" })).toBeVisible({ timeout: 10_000 });

    // Alert back
    await expect(
      page.getByText("This lineup is the official posted lineup for this game.")
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Dated-lineup variant (Test 29)
// ---------------------------------------------------------------------------

test.describe("Pre-Game Report Pop-Up (dated lineup)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/schedule/date*", (r) => r.fulfill({ json: MOCK_SCHEDULE }));
    await page.route("**/api/players/projected-lineup*", (r) =>
      // away (LAD batting) lineup sourced from a previous date
      r.fulfill({ json: makeLineup("2026-05-27", null) })
    );
    await mockPlayerAPIs(page);
    await openPopup(page);
  });

  // Test 29: autofill message shown when lineup was sourced from a past game
  test("POP_UP_OLD_LINEUP_MSG", async ({ page }) => {
    await expect(
      page.getByText(
        "Los Angeles Dodgers batting lineup autofilled from game on 2026-05-27."
      )
    ).toBeVisible();
  });
});
