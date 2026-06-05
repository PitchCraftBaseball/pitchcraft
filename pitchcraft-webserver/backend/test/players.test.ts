import { describe, expect, it } from "vitest";
import { api } from "./client.js";

describe("BE_PITCHERS_RETURNS_ACTIVE", () => {
  it("GET /api/players/pitchers returns only active pitchers for the team", async () => {
    const res = await api.get("/api/players/pitchers", { params: { teamId: 1 } });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);

    const ids = res.data.map((p: { id: number }) => p.id);
    expect(ids).toContain(1001);
    expect(ids).toContain(1002);
    expect(ids).not.toContain(1003);

    for (const player of res.data) {
      expect(["P", "TWP"]).toContain(player.position);
    }
  });
});

describe("BE_PITCHERS_EXCLUDES_INACTIVE", () => {
  it("GET /api/players/pitchers excludes inactive pitchers", async () => {
    const res = await api.get("/api/players/pitchers", { params: { teamId: 1 } });

    expect(res.status).toBe(200);
    const ids = res.data.map((p: { id: number }) => p.id);
    expect(ids).not.toContain(1003);
  });
});

describe("BE_BATTERS_RETURNS_ACTIVE", () => {
  it("GET /api/players/batters returns only active non-pitchers for the team", async () => {
    const res = await api.get("/api/players/batters", { params: { teamId: 1 } });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);

    const ids = res.data.map((p: { id: number }) => p.id);
    expect(ids).toContain(1004);
    expect(ids).toContain(1005);
    expect(ids).not.toContain(1006);

    for (const player of res.data) {
      expect(player.position).not.toBe("P");
    }
  });
});

describe("BE_BATTERS_EXCLUDES_INACTIVE", () => {
  it("GET /api/players/batters excludes inactive batters", async () => {
    const res = await api.get("/api/players/batters", { params: { teamId: 1 } });

    expect(res.status).toBe(200);
    const ids = res.data.map((p: { id: number }) => p.id);
    expect(ids).not.toContain(1006);
  });
});

describe("BE_PITCHERS_MISSING_TEAMID", () => {
  it("GET /api/players/pitchers returns 400 when teamId is absent", async () => {
    const res = await api.get("/api/players/pitchers");

    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: "Invalid teamId" });
  });
});

describe("BE_PITCHERS_NONNUMERIC_TEAMID", () => {
  it("GET /api/players/pitchers returns 400 when teamId is non-numeric", async () => {
    const res = await api.get("/api/players/pitchers", { params: { teamId: "abc" } });

    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: "Invalid teamId" });
  });
});

describe("BE_BATTERS_MISSING_TEAMID", () => {
  it("GET /api/players/batters returns 400 when teamId is absent", async () => {
    const res = await api.get("/api/players/batters");

    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: "Invalid teamId" });
  });
});

describe("BE_BATTERS_NONNUMERIC_TEAMID", () => {
  it("GET /api/players/batters returns 400 when teamId is non-numeric", async () => {
    const res = await api.get("/api/players/batters", { params: { teamId: "abc" } });

    expect(res.status).toBe(400);
    expect(res.data).toEqual({ error: "Invalid teamId" });
  });
});
