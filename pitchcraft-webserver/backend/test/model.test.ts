import axios, { AxiosError } from "axios";
import { beforeAll, expect, test } from "vitest";

axios.defaults.baseURL = "http://127.0.0.1:8000";

const REQUIRED_PITCH_TYPES = [
  "SL",
  "FF",
  "FS",
  "SI",
  "ST",
  "CU",
  "KC",
  "FC",
  "CH",
  "FA",
  "SV",
  "OTHER",
  "EP",
  "FO",
] as const;

const sampleBody = {
  pitcher: "642121",
  batter: "595777",
  state_features: {
    inning_topbot: "Top",
    count_state: "1-1",
    prev_pitch_type: "FF",
    balls: 1,
    strikes: 1,
    outs_when_up: 1,
    inning: 3,
    score_diff_bat: 0,
    on_1b: 0,
    on_2b: 1,
    on_3b: 0,
  },
  batter_features: ["stand"],
  pitcher_features: ["p_throws"],
};

const DEBUG = process.env.DEBUG_TESTS === "1";
function dbg(...args: any[]) {
  if (DEBUG) console.log("[model.test]", ...args);
}

function parseMaybeJson(data: unknown) {
  return typeof data === "string" ? JSON.parse(data) : data;
}

function getPitchDistributions(data: any): Array<[string, Record<string, unknown>]> {
  const keys = Object.keys(data ?? {}).filter((k) => /^pitch_/i.test(k));
  expect(keys.length, "No pitch_* distributions found in response").toBeGreaterThan(0);

  const result: Array<[string, Record<string, unknown>]> = [];
  for (const k of keys) {
    const dist = data[k];
    expect(dist && typeof dist === "object", `${k} is not an object`).toBe(true);
    result.push([k, dist as Record<string, unknown>]);
  }
  return result;
}

function assertHasOnlyExpectedPitchTypes(label: string, dist: Record<string, unknown>) {
  expect(Object.keys(dist).sort(), `${label} has unexpected pitch keys`).toEqual(
    [...REQUIRED_PITCH_TYPES].sort()
  );

  for (const pitchType of REQUIRED_PITCH_TYPES) {
    const v = dist[pitchType];

    expect(typeof v, `${label}["${pitchType}"] is not a number`).toBe("number");
    expect(Number.isFinite(v as number), `${label}["${pitchType}"] is not finite`).toBe(true);
    expect(v as number, `${label}["${pitchType}"] < 0`).toBeGreaterThanOrEqual(0);
    expect(v as number, `${label}["${pitchType}"] > 1`).toBeLessThanOrEqual(1);
  }
}

function sumAllWeights(dist: Record<string, unknown>) {
  let sum = 0;
  for (const key of Object.keys(dist)) {
    const v = dist[key];
    sum += typeof v === "number" ? v : Number(v);
  }
  return sum;
}

async function callPredict() {
  try {
    dbg("POST /api/model/predict ->", axios.defaults.baseURL);
    dbg("request sample:", {
      pitcher: sampleBody.pitcher,
      batter: sampleBody.batter,
      state_features: sampleBody.state_features,
      batter_features: sampleBody.batter_features,
      pitcher_features: sampleBody.pitcher_features,
    });

    const r = await axios.post("/api/model/predict", sampleBody, { timeout: 15000 });

    dbg("status:", r.status);
    dbg("content-type:", r.headers?.["content-type"]);
    dbg("raw type:", typeof r.data);

    const data = parseMaybeJson(r.data);
    dbg("parsed top-level keys:", Object.keys(data ?? {}));

    expect(r.status).toBe(200);
    return data;
  } catch (err) {
    const error = err as AxiosError<any>;

    dbg("axios error message:", error.message);
    dbg("axios code:", (error as any).code);
    dbg("axios config url:", error.config?.url);
    dbg("axios config baseURL:", error.config?.baseURL);

    if (!error.response) {
      throw Error("Server never sent response (is it running?)");
    }

    dbg("response status:", error.response.status);
    dbg("response data:", error.response.data);

    const respErr = (error.response.data as any)?.error;

    if (respErr === "model_base_url_not_configured") {
      throw Error("MODEL_BASE_URL is not configured, so /api/model/predict cannot be tested.");
    }

    // Helpful hint for the exact situation you're in (502 from proxy)
    if (error.response.status === 502 && respErr === "model_unreachable") {
      throw Error(
        "Backend returned 502 model_unreachable. That means the Node server cannot reach MODEL_BASE_URL from *its* network. " +
          "If Node is running in Docker, localhost points to the container, not your host/model. Try MODEL_BASE_URL=host.docker.internal:3175 " +
          "or the model container service name (e.g., model:3175)."
      );
    }

    throw err;
  }
}

let dists: Array<[string, Record<string, unknown>]> = [];

beforeAll(async () => {
  const data = await callPredict();
  dists = getPitchDistributions(data);
}, 30000); // give hook enough time even if model warms up

test("Model predict includes only expected pitch types", () => {
  for (const [label, dist] of dists) {
    assertHasOnlyExpectedPitchTypes(label, dist);
  }
});

test("Model pitch weights sum to 1 (per pitch_*)", () => {
  const EPS_DIGITS = 5;

  for (const [label, dist] of dists) {
    const sum = sumAllWeights(dist);
    expect(sum, `${label} weights do not sum to 1 (got ${sum})`).toBeCloseTo(1, EPS_DIGITS);
  }
});
