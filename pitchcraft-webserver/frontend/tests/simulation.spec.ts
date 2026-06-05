// Simulation Screen Test Suite
// Test IDs 32 -> 44
// We are mocking the backend here via page.route() for player endpoints and model prediction.

import { test, expect, type Page } from "@playwright/test";

// ---------
// Mock data
// ---------

const PHILLIES_BATTERS = [
  {
    id: 547989,
    use_first_name: "Bryce",
    use_last_name: "Harper",
    position: "1B",
    team_id: 143,
  },
  {
    id: 656775,
    use_first_name: "Trea",
    use_last_name: "Turner",
    position: "SS",
    team_id: 143,
  },
];
const PHILLIES_PITCHERS = [
  {
    id: 554430,
    use_first_name: "Zack",
    use_last_name: "Wheeler",
    position: "P",
    team_id: 143,
  },
  {
    id: 663855,
    use_first_name: "Aaron",
    use_last_name: "Nola",
    position: "P",
    team_id: 143,
  },
];
const YANKEES_BATTERS = [
  {
    id: 592450,
    use_first_name: "Aaron",
    use_last_name: "Judge",
    position: "RF",
    team_id: 147,
  },
];
const YANKEES_PITCHERS = [
  {
    id: 543037,
    use_first_name: "Gerrit",
    use_last_name: "Cole",
    position: "P",
    team_id: 147,
  },
];

// Mocked response
const MOCK_PREDICT_RESPONSE = {
  outcome: "strikeout",
  pitch_count: 4,
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
    const batters = teamId === 143 ? PHILLIES_BATTERS : teamId === 147 ? YANKEES_BATTERS : [];
    await route.fulfill({ json: batters });
  });
  await page.route("**/api/players/pitchers*", async (route) => {
    const url = new URL(route.request().url());
    const teamId = Number(url.searchParams.get("teamId"));
    const pitchers = teamId === 143 ? PHILLIES_PITCHERS : teamId === 147 ? YANKEES_PITCHERS : [];
    await route.fulfill({ json: pitchers });
  });
}

// Select bat team from combo box
async function selectBatTeam(page: Page, teamName: string) {
  // Target the visible combobox div, not the hidden input
  await page.locator('[data-testid="bat-team-select"]')
    .locator("..") // walk up to the MuiSelect root
    .getByRole("combobox")
    .click();
  await page.getByRole("option", { name: teamName }).click();
}

// Select pitch team from combo box
async function selectPitchTeam(page: Page, teamName: string) {
  await page.locator('[data-testid="pitch-team-select"]')
    .locator("..")
    .getByRole("combobox")
    .click();
  await page.getByRole("option", { name: teamName }).click();
}

// Select batter from first autocomplete match
async function selectBatter(page: Page, name: string) {
  // Use getByRole('combobox') to avoid strict mode violation, since when the dropdown
  // opens, the listbox also gets labelled "Select Batter" via aria-labelledby,
  // so getByLabel resolves to 2 elements and throws.
  const input = page.getByRole("combobox", { name: "Select Batter" });
  await input.click();
  await input.fill(name.split(" ")[1]); // search by last name
  await page.getByRole("option", { name }).click();
}

// Select pitcher from first autocomplete match
async function selectPitcher(page: Page, name: string) {
  const input = page.getByRole("combobox", { name: "Select Pitcher" });
  await input.click();
  await input.fill(name.split(" ")[1]);
  await page.getByRole("option", { name }).click();
}

// Setup Phillies bat and pitch teams, select Harper & Wheeler
async function fillFullForm(page: Page) {
  await selectBatTeam(page, "Philadelphia Phillies");
  await selectPitchTeam(page, "Philadelphia Phillies");
  await selectBatter(page, "Bryce Harper");
  await selectPitcher(page, "Zack Wheeler");
}

// ----------
// Test Suite
// ----------

test.describe("Simulation Screen", () => {
  test.beforeEach(async ({ page }) => {
    await mockPlayerAPIs(page);
    await page.goto("/simulation");
  });

  test("VERIFY_BALLS_SELECT", async ({ page }) => {
    const group = page.getByTestId("balls-toggle");
    // Default is 0
    await expect(group.getByRole("button", { name: "0" })).toHaveAttribute("aria-pressed", "true");
    await expect(group.getByRole("button", { name: "1" })).toHaveAttribute("aria-pressed", "false");
    await expect(group.getByRole("button", { name: "2" })).toHaveAttribute("aria-pressed", "false");
    await expect(group.getByRole("button", { name: "3" })).toHaveAttribute("aria-pressed", "false");

    for (const val of [1, 2, 3, 0]) {
      await group.getByRole("button", { name: String(val) }).click();
      await expect(group.getByRole("button", { name: String(val) })).toHaveAttribute("aria-pressed", "true");
      // All other buttons should be deselected
      for (const other of [0, 1, 2, 3].filter((n) => n !== val)) {
        await expect(group.getByRole("button", { name: String(other) })).toHaveAttribute("aria-pressed", "false");
      }
    }
  });

  test("VERIFY_STRIKES_SELECT", async ({ page }) => {
    const group = page.getByTestId("strikes-toggle");
    await expect(group.getByRole("button", { name: "0" })).toHaveAttribute("aria-pressed", "true");
    for (const val of [1, 2, 0]) {
      await group.getByRole("button", { name: String(val) }).click();
      await expect(group.getByRole("button", { name: String(val) })).toHaveAttribute("aria-pressed", "true");
      for (const other of [0, 1, 2].filter((n) => n !== val)) {
        await expect(group.getByRole("button", { name: String(other) })).toHaveAttribute("aria-pressed", "false");
      }
    }
  });

  test("VERIFY_OUTS_SELECT", async ({ page }) => {
    const group = page.getByTestId("outs-toggle");
    await expect(group.getByRole("button", { name: "0" })).toHaveAttribute("aria-pressed", "true");
    for (const val of [1, 2, 0]) {
      await group.getByRole("button", { name: String(val) }).click();
      await expect(group.getByRole("button", { name: String(val) })).toHaveAttribute("aria-pressed", "true");
      for (const other of [0, 1, 2].filter((n) => n !== val)) {
        await expect(group.getByRole("button", { name: String(other) })).toHaveAttribute("aria-pressed", "false");
      }
    }
  });

  test("VERIFY_RUNNERS_FIELD", async ({ page }) => {
    const group = page.getByTestId("runners-toggle");
    const btn1B = group.getByRole("button", { name: "1B" });
    const btn2B = group.getByRole("button", { name: "2B" });
    const btn3B = group.getByRole("button", { name: "3B" });
    // Default: all deselected
    await expect(btn1B).toHaveAttribute("aria-pressed", "false");
    await expect(btn2B).toHaveAttribute("aria-pressed", "false");
    await expect(btn3B).toHaveAttribute("aria-pressed", "false");
    // Individual selections
    for (const [btn, others] of [
      [btn1B, [btn2B, btn3B]],
      [btn2B, [btn1B, btn3B]],
      [btn3B, [btn1B, btn2B]],
    ] as const) {
      // Deselect all first
      for (const b of [btn1B, btn2B, btn3B]) {
        if ((await b.getAttribute("aria-pressed")) === "true") await b.click();
      }
      await btn.click();
      await expect(btn).toHaveAttribute("aria-pressed", "true");
      for (const other of others) {
        await expect(other).toHaveAttribute("aria-pressed", "false");
      }
    }
    // Reset
    for (const b of [btn1B, btn2B, btn3B]) {
      if ((await b.getAttribute("aria-pressed")) === "true") await b.click();
    }
    // 1B + 2B
    await btn1B.click();
    await btn2B.click();
    await expect(btn1B).toHaveAttribute("aria-pressed", "true");
    await expect(btn2B).toHaveAttribute("aria-pressed", "true");
    await expect(btn3B).toHaveAttribute("aria-pressed", "false");
    // 1B + 3B
    await btn2B.click();
    await btn3B.click();
    await expect(btn1B).toHaveAttribute("aria-pressed", "true");
    await expect(btn2B).toHaveAttribute("aria-pressed", "false");
    await expect(btn3B).toHaveAttribute("aria-pressed", "true");
    // 2B + 3B
    await btn1B.click();
    await btn2B.click();
    await expect(btn1B).toHaveAttribute("aria-pressed", "false");
    await expect(btn2B).toHaveAttribute("aria-pressed", "true");
    await expect(btn3B).toHaveAttribute("aria-pressed", "true");
    // 1B + 2B + 3B
    await btn1B.click();
    await expect(btn1B).toHaveAttribute("aria-pressed", "true");
    await expect(btn2B).toHaveAttribute("aria-pressed", "true");
    await expect(btn3B).toHaveAttribute("aria-pressed", "true");
    // Deselect all
    await btn1B.click();
    await btn2B.click();
    await btn3B.click();
    await expect(btn1B).toHaveAttribute("aria-pressed", "false");
    await expect(btn2B).toHaveAttribute("aria-pressed", "false");
    await expect(btn3B).toHaveAttribute("aria-pressed", "false");
  });

  test("VERIFY_INNING_OPTIONS", async ({ page }) => {
    const halfCombobox = page.getByTestId("inning-half-select").locator("../..").getByRole("combobox");
    const inningCombobox = page.getByTestId("inning-select").locator("../..").getByRole("combobox");
    // Default state: Top, Inning 1
    await expect(page.getByTestId("inning-half-select")).toHaveValue("top");
    await expect(page.getByTestId("inning-select")).toHaveValue("1");
    // Switch to Bottom
    await halfCombobox.click();
    await page.getByRole("option", { name: "Bottom" }).click();
    await expect(page.getByTestId("inning-half-select")).toHaveValue("bottom");
    // Cycle through innings 1–9 and 10+
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      await inningCombobox.click();
      await page.getByRole("option", { name: n === 10 ? "10+" : String(n), exact: true }).click();
      await expect(page.getByTestId("inning-select")).toHaveValue(String(n));
    }
  });

  test("VERIFY_SCORE", async ({ page }) => {
    const batScore = page.getByTestId("bat-score-input");
    const pitchScore = page.getByTestId("pitch-score-input");
    // Default values
    await expect(batScore).toHaveValue("0");
    await expect(pitchScore).toHaveValue("0");
    // Enter a positive integer
    await batScore.fill("5");
    await expect(batScore).toHaveValue("5");
    await pitchScore.fill("3");
    await expect(pitchScore).toHaveValue("3");
    // Increment bat score using the spinner arrow
    await batScore.press("ArrowUp");
    await expect(batScore).toHaveValue("6");
    // Decrement bat score
    await batScore.press("ArrowDown");
    await expect(batScore).toHaveValue("5");
  });

  test("VERIFY_INVALID_SCORE", async ({ page }) => {
    const batScore = page.getByTestId("bat-score-input");
    const pitchScore = page.getByTestId("pitch-score-input");
    // Attempt negative value, onChange regex only allows digits, so "-5" is rejected
    await batScore.fill("-5");
    // The field should not hold a negative value
    await batScore.blur();
    await expect(batScore).toHaveValue("0");
    // Attempt letters
    await batScore.click();
    await batScore.pressSequentially("abc");
    await batScore.blur();
    await expect(batScore).toHaveValue("0");
    // Attempt special characters
    await batScore.click();
    await batScore.pressSequentially("!@#");
    await batScore.blur();
    await expect(batScore).toHaveValue("0");
    // Clear the field and blur, should default to 0
    await batScore.fill("");
    await batScore.blur();
    await expect(batScore).toHaveValue("0");
    // Same checks for pitch score
    await pitchScore.fill("-3");
    await pitchScore.blur();
    await expect(pitchScore).toHaveValue("0");
    await pitchScore.fill("");
    await pitchScore.blur();
    await expect(pitchScore).toHaveValue("0");
  });

  test("SIMULATION_SUCCESS", async ({ page }) => {
    // Mock the model predict endpoint
    await page.route("**/api/model/predict", async (route) => {
      await route.fulfill({ json: MOCK_PREDICT_RESPONSE });
    });
    await fillFullForm(page);
    // Modify inputs
    await page.getByTestId("balls-toggle").getByRole("button", { name: "2" }).click();
    await page.getByTestId("strikes-toggle").getByRole("button", { name: "1" }).click();
    await page.getByTestId("outs-toggle").getByRole("button", { name: "1" }).click();
    await page.getByTestId("runners-toggle").getByRole("button", { name: "1B" }).click();
    // Set scores
    await page.getByTestId("bat-score-input").fill("3");
    await page.getByTestId("pitch-score-input").fill("1");
    // Submit
    const btn = page.getByTestId("get-pitch-sequence-btn");
    await expect(btn).toBeEnabled();
    await btn.click();
    // Pie charts should render, one per sequence step in the mock response
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 10_000 });
    // Verify a chart heading from the mock response appears
    await expect(page.getByRole("heading", { name: /Pitch 0:.*FF/ })).toBeVisible();
  });

  test("SIMULATION_MISSING_INPUT", async ({ page }) => {
    const btn = page.getByTestId("get-pitch-sequence-btn");
    // Initial state - nothing selected
    await expect(btn).toBeDisabled();
    // Select bat team only
    await selectBatTeam(page, "Philadelphia Phillies");
    await expect(btn).toBeDisabled();
    // Select batter
    await selectBatter(page, "Bryce Harper");
    await expect(btn).toBeDisabled();
    // Select pitch team
    await selectPitchTeam(page, "Philadelphia Phillies");
    await expect(btn).toBeDisabled();
    // Select pitcher
    await selectPitcher(page, "Zack Wheeler");
    await expect(btn).toBeEnabled();
  });

  test("SIM_PREV_PITCH_NO_PITCHER", async ({ page }) => {
    const prevPitchSelect = page.getByTestId("prev-pitch-select");
    const prevPitchCombobox = prevPitchSelect.locator("../..").getByRole("combobox");
    await expect(prevPitchSelect).toHaveValue("START");
    await expect(prevPitchSelect).toBeEnabled();
    // With no pitcher selected, the dropdown still opens and shows at least "First Pitch"
    await prevPitchCombobox.click();
    await expect(page.getByRole("option", { name: "First Pitch", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    // Select a pitch team and pitcher
    await selectPitchTeam(page, "Philadelphia Phillies");
    await selectPitcher(page, "Zack Wheeler");
    // Now Wheeler's arsenal should appear alongside "First Pitch"
    await prevPitchCombobox.click();
    await expect(page.getByRole("option", { name: "First Pitch", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: /Sweeper/ })).toBeVisible();
    await page.keyboard.press("Escape");
    // Changing the team clears the pitcher selection, which triggers the useEffect that
    // resets prevPitchType to START when the selected pitch isn't in the new arsenal.
    await selectPitchTeam(page, "New York Yankees");
    await expect(prevPitchSelect).toHaveValue("START");
    await expect(prevPitchSelect).toBeEnabled();
  });

  test("SIM_CHANGE_TEAM", async ({ page }) => {
    // Set up both teams and players
    await selectBatTeam(page, "Philadelphia Phillies");
    await selectPitchTeam(page, "Philadelphia Phillies");
    await selectBatter(page, "Bryce Harper");
    await selectPitcher(page, "Zack Wheeler");
    // Confirm players are selected
    await expect(page.getByRole("combobox", { name: "Select Batter" })).toHaveValue("Bryce Harper");
    await expect(page.getByRole("combobox", { name: "Select Pitcher" })).toHaveValue("Zack Wheeler");
    // Change bat team
    await selectBatTeam(page, "New York Yankees");
    // Batter input should be cleared
    await expect(page.getByRole("combobox", { name: "Select Batter" })).toHaveValue("");
    // Change pitch team
    await selectPitchTeam(page, "New York Yankees");
    // Pitcher input should be cleared
    await expect(page.getByRole("combobox", { name: "Select Pitcher" })).toHaveValue("");
  });

  test("SIM_EDIT_WITHOUT_TEAM", async ({ page }) => {
    const batterInput = page.getByRole("combobox", { name: "Select Batter" });
    const pitcherInput = page.getByRole("combobox", { name: "Select Pitcher" });
    // Both disabled by default
    await expect(batterInput).toBeDisabled();
    await expect(pitcherInput).toBeDisabled();
    // Select bat team
    await selectBatTeam(page, "Philadelphia Phillies");
    await expect(batterInput).toBeEnabled();
    await expect(pitcherInput).toBeDisabled();
    // Select pitch team
    await selectPitchTeam(page, "Philadelphia Phillies");
    await expect(pitcherInput).toBeEnabled();
  });
});