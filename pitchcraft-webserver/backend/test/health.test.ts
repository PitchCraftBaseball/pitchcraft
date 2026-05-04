import { describe, expect, it } from "vitest";
import { api } from "./client.js";

describe("BE_DB_HEALTH_OK", () => {
  it("GET /api/health returns 200 with {ok: true, db: 'up'} when DB is reachable", async () => {
    const res = await api.get("/api/health");

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true, db: "up" });
  });
});
