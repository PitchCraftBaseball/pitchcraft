// Setup file for Vitest suite
// Uses postgres testcontainers, runs a migration, seeds data, starts test environment express, tests

import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";
import { ChildProcess, spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");

let pgContainer: StartedPostgreSqlContainer;
let serverProcess: ChildProcess;

async function seed(connectionUri: string) {
  const sql = `
    -- Players
    INSERT INTO players
      (id, first_name, last_name, team_id, position, batting_side, throwing_arm, active, use_first_name, use_last_name)
    VALUES
      -- Team 1, active pitchers
      (1001, 'Active',   'PitcherA',  1, 'P',  'R', 'R', true,  'Active',   'PitcherA'),
      (1002, 'Active',   'PitcherB',  1, 'P',  'R', 'R', true,  'Active',   'PitcherB'),
      -- Team 1, inactive pitcher (must be excluded from /pitchers results)
      (1003, 'Inactive', 'PitcherC',  1, 'P',  'R', 'R', false, 'Inactive', 'PitcherC'),
      -- Team 1, active batters
      (1004, 'Active',   'BatterA',   1, 'RF', 'R', 'R', true,  'Active',   'BatterA'),
      (1005, 'Active',   'BatterB',   1, 'CF', 'R', 'R', true,  'Active',   'BatterB'),
      -- Team 1, inactive batter (must be excluded from /batters results)
      (1006, 'Inactive', 'BatterC',   1, 'LF', 'R', 'R', false, 'Inactive', 'BatterC'),
      -- Team 2
      (2001, 'Other',    'Pitcher',   2, 'P',  'R', 'R', true,  'Other',    'Pitcher'),
      (2002, 'Other',    'Batter',    2, '1B', 'R', 'R', true,  'Other',    'Batter')
    ON CONFLICT (id) DO NOTHING;

    -- Schedule
    INSERT INTO schedule
      (game_id, game_datetime, away_team, away_team_id, home_team, home_team_id, venue_id, venue_name, summary)
    VALUES
      (9000001, '2025-06-01 17:10:00+00', 'Away Team A', 1, 'Home Team B', 2, 10, 'Test Stadium', 'ATL @ PHI'),
      (9000002, '2025-06-01 20:10:00+00', 'Away Team C', 3, 'Home Team D', 4, 11, 'Other Park',   'CHC @ NYM'),
      (9000003, '2025-06-02 17:10:00+00', 'Away Team E', 5, 'Home Team F', 6, 12, 'Third Field',  'LAD @ SF')
    ON CONFLICT (game_id) DO NOTHING;
  `;

  execSync(`psql "${connectionUri}" -c "${sql.replace(/"/g, '\\"')}"`, {
    stdio: "pipe",
  });
}

function waitForServer(url: string, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() > deadline) {
            reject(new Error(`Server at ${url} never became ready`));
          } else {
            setTimeout(attempt, 300);
          }
        });
    };
    attempt();
  });
}

export async function setup() {
  // Start Postgres
  console.log("[globalSetup] Starting PostgreSQL testcontainer...");
  pgContainer = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("pitchcraft_test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const connectionUri = pgContainer.getConnectionUri();
  process.env.TEST_DATABASE_URL = connectionUri;
  process.env.DATABASE_URL = connectionUri; // Prisma migrate reads this

  // Push schema directly
  console.log("[globalSetup] Running prisma db push...");
  execSync("npx prisma db push --accept-data-loss", {
    cwd: BACKEND_ROOT,
    env: { ...process.env, DATABASE_URL: connectionUri },
    stdio: "inherit",
  });

  // Seed
  console.log("[globalSetup] Seeding test data...");
  await seed(connectionUri);

  // Start Express on a random free port
  const TEST_PORT = 18000;
  const serverUrl = `http://127.0.0.1:${TEST_PORT}`;
  process.env.TEST_API_URL = serverUrl;

  console.log(`[globalSetup] Starting Express server on :${TEST_PORT}...`);
  serverProcess = spawn("npx", ["tsx", "src/server.ts"], {
    cwd: BACKEND_ROOT,
    env: {
      ...process.env,
      DATABASE_URL: connectionUri,
      PORT: String(TEST_PORT),
    },
    stdio: "pipe",
  });

  serverProcess.stdout?.on("data", (d) =>
    process.stdout.write(`[server] ${d}`)
  );
  serverProcess.stderr?.on("data", (d) =>
    process.stderr.write(`[server] ${d}`)
  );

  await waitForServer(`${serverUrl}/api/health`);
  console.log("[globalSetup] Server ready.");
}

export async function teardown() {
  console.log("[globalSetup] Tearing down...");
  serverProcess?.kill("SIGTERM");
  await pgContainer?.stop();
  console.log("[globalSetup] Done.");
}
