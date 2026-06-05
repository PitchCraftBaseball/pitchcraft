import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api } from "./client.js";
import { spawnServer } from "./server-utils.js";

describe("BE_DB_HEALTH_OK", () => {
  it("GET /api/health returns 200 with {ok: true, db: 'up'} when DB is reachable", async () => {
    const res = await api.get("/api/health");

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true, db: "up" });
  });
});

describe("BE_UNKNOWN_API_ROUTE_404", () => {
  it("GET /api/does-not-exist returns structured JSON 404", async () => {
    const res = await api.get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.data).toEqual({ error: "not_found" });
  });
});

describe("BE_DB_HEALTH_UNREACHABLE", () => {
  let stop: () => void;
  let badDbApi: Awaited<ReturnType<typeof spawnServer>>["api"];

  beforeAll(async () => {
    const server = await spawnServer(18001, {
      DATABASE_URL: "postgresql://test:test@127.0.0.1:1/pitchcraft_test",
    });
    badDbApi = server.api;
    stop = server.stop;
  });

  afterAll(() => stop());

  it("GET /api/health returns 500 with {ok: false, error: 'db_unreachable'} when DB is unreachable", async () => {
    const res = await badDbApi.get("/api/health");

    expect(res.status).toBe(500);
    expect(res.data).toEqual({ ok: false, error: "db_unreachable" });
  });
});
