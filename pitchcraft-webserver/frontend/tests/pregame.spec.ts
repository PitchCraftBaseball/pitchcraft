// Pre-Game Report Screen Test Suite
// Test IDs 45 -> 51
// We are mocking the backend via page.route() for player/model endpoints,
// and injecting React Router navigation state via page.addInitScript() before
// the page loads (React Router v6 reads state from window.history.state.usr).

import { test, expect, type Page } from "@playwright/test";

// ---------
// Mock data
// ---------

const PHILLIES_PITCHERS_PGR = [
  {
    id: 554430,
    use_first_name: "Zack",
    use_last_name: "Wheeler",
    position: "P",
    team_id: 143,
  },
  {
    id: 605400,
    use_first_name: "Aaron",
    use_last_name: "Nola",
    position: "P",
    team_id: 143,
  },
];

// Nine batters for the initial lineup
const PHILLIES_BATTERS_9 = [
  { id: 547989, use_first_name: "Bryce",   use_last_name: "Harper",     position: "1B", team_id: 143 },
  { id: 656775, use_first_name: "Trea",    use_last_name: "Turner",     position: "SS", team_id: 143 },
  { id: 669272, use_first_name: "Kyle",    use_last_name: "Schwarber",  position: "LF", team_id: 143 },
  { id: 605141, use_first_name: "Nick",    use_last_name: "Castellanos",position: "RF", team_id: 143 },
  { id: 596142, use_first_name: "J.T.",    use_last_name: "Realmuto",   position: "C",  team_id: 143 },
  { id: 606466, use_first_name: "Alec",    use_last_name: "Bohm",       position: "3B", team_id: 143 },
  { id: 677800, use_first_name: "Brandon", use_last_name: "Marsh",      position: "CF", team_id: 143 },
  { id: 681584, use_first_name: "Johan",   use_last_name: "Rojas",      position: "CF", team_id: 143 },
  { id: 691176, use_first_name: "Bryson",  use_last_name: "Stott",      position: "2B", team_id: 143 },
];

// Extra batter not in the initial lineup, used by PGR_EDIT_BATTER
const EXTRA_BATTER = {
  id: 677651,
  use_first_name: "Edmundo",
  use_last_name: "Sosa",
  position: "IF",
  team_id: 143,
};

const ALL_BATTERS = [...PHILLIES_BATTERS_9, EXTRA_BATTER];

// Initial player array: players[0] = pitcher, players[1..9] = batters
const INITIAL_PLAYERS = [PHILLIES_PITCHERS_PGR[0], ...PHILLIES_BATTERS_9];

// Mocked model response
const MOCK_PREDICT_RESPONSE = {
  outcome: "strikeout",
  pitch_count: 3,
  sequence: [
    {
      pitch_index: 0,
      pitch_type: "FF",
      rnn_pitch_probs: { FF: 0.6, SI: 0.2, ST: 0.1, CU: 0.05, FS: 0.03, FC: 0.02 },
      p_strike: 0.65,
      p_ball: 0.35,
      out_type_probs: { p_none: 0.3, p_so: 0.4, p_go: 0.1, p_fo: 0.1, p_hhfb: 0.1 },
      transition_event: "strike",
      out_type_event: "strikeout",
      balls_after: 0,
      strikes_after: 1,
      terminal: false,
      outcome: null,
    },
    {
      pitch_index: 1,
      pitch_type: "ST",
      rnn_pitch_probs: { FF: 0.2, SI: 0.1, ST: 0.5, CU: 0.1, FS: 0.05, FC: 0.05 },
      p_strike: 0.7,
      p_ball: 0.3,
      out_type_probs: { p_none: 0.2, p_so: 0.5, p_go: 0.1, p_fo: 0.1, p_hhfb: 0.1 },
      transition_event: "strike",
      out_type_event: "strikeout",
      balls_after: 0,
      strikes_after: 2,
      terminal: false,
      outcome: null,
    },
    {
      pitch_index: 2,
      pitch_type: "CU",
      rnn_pitch_probs: { FF: 0.1, SI: 0.1, ST: 0.2, CU: 0.5, FS: 0.05, FC: 0.05 },
      p_strike: 0.6,
      p_ball: 0.4,
      out_type_probs: { p_none: 0.1, p_so: 0.6, p_go: 0.1, p_fo: 0.1, p_hhfb: 0.1 },
      transition_event: "strike",
      out_type_event: "strikeout",
      balls_after: 0,
      strikes_after: 3,
      terminal: true,
      outcome: "strikeout",
    },
  ],
};

// -------
// Helpers
// -------

// Register player API mocks
async function mockPlayerAPIs(page: Page) {
  await page.route("**/api/players/batters*", async (route) => {
    const url = new URL(route.request().url());
    const teamId = Number(url.searchParams.get("teamId"));
    const batters = teamId === 143 ? ALL_BATTERS : [];
    await route.fulfill({ json: batters });
  });
  await page.route("**/api/players/pitchers*", async (route) => {
    const url = new URL(route.request().url());
    const teamId = Number(url.searchParams.get("teamId"));
    const pitchers = teamId === 143 ? PHILLIES_PITCHERS_PGR : [];
    await route.fulfill({ json: pitchers });
  });
}

// Navigate to /pregame by injecting React Router state via history.replaceState
// intercept before the page loads (React Router v6 reads state from
// window.history.state.usr on initialization).
async function navigateToPGR(page: Page) {
  // Override window.print so clicking Print doesn't open a real dialog
  await page.addInitScript(() => {
    (window as any).__printCallCount = 0;
    window.print = () => { (window as any).__printCallCount++; };
  });
  // Inject players into the history state before React Router initializes
  await page.addInitScript(({ players }) => {
    const orig = window.history.replaceState.bind(window.history);
    window.history.replaceState = function (
      state: Record<string, unknown>,
      title: string,
      url?: string | URL
    ) {
      if (state && typeof state === "object" && !("usr" in state)) {
        state = { ...state, usr: { players } };
      }
      return orig.call(window.history, state, title, url);
    };
  }, { players: INITIAL_PLAYERS });
  await page.goto("/pregame");
}

// Wait for all 9 batter sections to finish their initial model call
async function waitForAllBattersLoaded(page: Page) {
  for (const batter of PHILLIES_BATTERS_9) {
    await expect(
      page.getByRole("heading", { name: `${batter.use_first_name} ${batter.use_last_name}` })
    ).toBeVisible({ timeout: 10_000 });
  }
  await expect(page.getByText("Loading...", { exact: true })).toHaveCount(0, { timeout: 15_000 });
}

// ----------
// Test Suite
// ----------

test.describe("Pre-Game Report", () => {
  test.beforeEach(async ({ page }) => {
    await mockPlayerAPIs(page);
    await page.route("**/api/model/predict", async (route) => {
      await route.fulfill({ json: MOCK_PREDICT_RESPONSE });
    });
    await navigateToPGR(page);
    // Confirm the page rendered with the injected router state
    await expect(
      page.getByRole("heading", { name: "Zack Wheeler Profile" })
    ).toBeVisible({ timeout: 10_000 });
  });

  // Test 45: each sidebar batter dropdown matches the corresponding batter section heading
  test("PGR_VERIFY_REPORT_PLAYERS", async ({ page }) => {
    for (let i = 0; i < PHILLIES_BATTERS_9.length; i++) {
      const batter = PHILLIES_BATTERS_9[i];
      const name = `${batter.use_first_name} ${batter.use_last_name}`;
      await expect(page.getByRole("combobox", { name: `Batter ${i + 1}` })).toHaveValue(name);
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
  });

  // Test 46: pitcher name and arsenal are displayed with correct pitch-type usage rates
  test("PGR_VERIFY_PITCHER_PROFILE", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Zack Wheeler Profile" })
    ).toBeVisible();

    // Wheeler 2025 arsenal from pitch_arsenal.json (id 554430)
    const expectedArsenal = [
      "FF (Four-seam Fastball): 40.98%",
      "SI (Sinker): 17.00%",
      "ST (Sweeper): 14.79%",
      "CU (Curveball): 9.77%",
      "FS (Splitter): 8.86%",
      "FC (Cutter): 8.60%",
    ];
    for (const text of expectedArsenal) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
  });

  // Test 47: clicking the Print button triggers window.print()
  test("PGR_PRINT_SUCCESS", async ({ page }) => {
    await page.getByRole("button", { name: "Print Report" }).click();
    const printCallCount = await page.evaluate(() => (window as any).__printCallCount);
    expect(printCallCount).toBe(1);
  });

  // Test 48: changing one batter re-runs the model for only that batter
  test("PGR_EDIT_BATTER", async ({ page }) => {
    await waitForAllBattersLoaded(page);

    // Capture model requests made after the batter is changed
    const newRequests: Record<string, string>[] = [];
    await page.route("**/api/model/predict", async (route) => {
      newRequests.push(JSON.parse((await route.request().postData()) ?? "{}"));
      await route.fulfill({ json: MOCK_PREDICT_RESPONSE });
    });

    // Change Batter 1 (Harper) to Edmundo Sosa — Sosa is not in the lineup
    const batter1Input = page.getByRole("combobox", { name: "Batter 1" });
    await batter1Input.click();
    await batter1Input.fill("Sosa");
    await page.getByRole("option", { name: "Edmundo Sosa" }).click();

    // Sosa's section heading now shows and loading finishes
    await expect(page.getByRole("heading", { name: "Edmundo Sosa" })).toBeVisible();
    await expect(page.getByText("Loading...", { exact: true })).toHaveCount(0, { timeout: 10_000 });

    // Model was called for Sosa, and not for any of the unchanged batters
    const sosaCalls = newRequests.filter(
      (req) => req.batter === String(EXTRA_BATTER.id)
    );
    expect(sosaCalls.length).toBeGreaterThanOrEqual(1);
    const otherBatterCalls = newRequests.filter(
      (req) => req.batter !== String(EXTRA_BATTER.id)
    );
    expect(otherBatterCalls.length).toBe(0);
  });

  // Test 49: changing the pitcher re-runs the model for all 9 batters and
  // updates the pitcher profile heading
  test("PGR_EDIT_PITCHER", async ({ page }) => {
    await waitForAllBattersLoaded(page);

    // Capture model requests made after the pitcher is changed
    const newRequests: Record<string, string>[] = [];
    await page.route("**/api/model/predict", async (route) => {
      newRequests.push(JSON.parse((await route.request().postData()) ?? "{}"));
      await route.fulfill({ json: MOCK_PREDICT_RESPONSE });
    });

    // Change pitcher from Wheeler (554430) to Aaron Nola (605400)
    const pitcherInput = page.getByRole("combobox", { name: "Pitcher" });
    await pitcherInput.click();
    await pitcherInput.fill("Nola");
    await page.getByRole("option", { name: "Aaron Nola" }).click();

    // Profile heading updates to Nola
    await expect(
      page.getByRole("heading", { name: "Aaron Nola Profile" })
    ).toBeVisible({ timeout: 10_000 });

    // Wait for all 9 batter sections to finish reloading
    await expect(page.getByText("Loading...", { exact: true })).toHaveCount(0, { timeout: 15_000 });

    // All 9 batters had their model re-run with Nola as the pitcher
    const uniqueBattersWithNola = new Set(
      newRequests
        .filter((req) => req.pitcher === String(PHILLIES_PITCHERS_PGR[1].id))
        .map((req) => req.batter)
    );
    expect(uniqueBattersWithNola.size).toBe(9);
  });

  // Test 50: on initial load every out-type dropdown shows "Automatic Out Type"
  test("PGR_DEFAULT_OUT_TYPE", async ({ page }) => {
    for (let i = 0; i < 9; i++) {
      await expect(page.getByTestId(`pgr-out-type-${i}`)).toHaveValue("default");
    }
  });

  // Test 51: changing one batter's out type updates only that dropdown and
  // re-runs the model with the specified target strategy
  test("PGR_EDIT_OUT_TYPE", async ({ page }) => {
    await waitForAllBattersLoaded(page);

    // Capture model requests made after the out type is changed
    const newRequests: Record<string, string>[] = [];
    await page.route("**/api/model/predict", async (route) => {
      newRequests.push(JSON.parse((await route.request().postData()) ?? "{}"));
      await route.fulfill({ json: MOCK_PREDICT_RESPONSE });
    });

    // Change Batter 3's out type (pgr-out-type-2) to Groundout
    // Batter 3 = Schwarber (id 669272), outTypes index 2
    const outTypeCombobox = page
      .getByTestId("pgr-out-type-2")
      .locator("../..").getByRole("combobox");
    await outTypeCombobox.click();
    await page.getByRole("option", { name: "Groundout" }).click();

    // Batter 3's dropdown reflects the change
    await expect(page.getByTestId("pgr-out-type-2")).toHaveValue("ground");

    // All other dropdowns remain at default
    for (let i = 0; i < 9; i++) {
      if (i !== 2) {
        await expect(page.getByTestId(`pgr-out-type-${i}`)).toHaveValue("default");
      }
    }

    // Model was re-run for Schwarber after the out type change
    await expect(page.getByText("Loading...", { exact: true })).toHaveCount(0, { timeout: 10_000 });
    const groundCall = newRequests.find(
      (req) => req.batter === String(PHILLIES_BATTERS_9[2].id)
    );
    expect(groundCall).toBeDefined();
  });
});
