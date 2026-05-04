import { describe, expect, it } from "vitest";
import { api } from "./client.js";

describe("BE_PITCHERS_RETURNS_ACTIVE", () => {
  it("GET /api/players/pitchers returns only active pitchers for the team", async () => {
    const res = await api.get("/api/players/pitchers", { params: { teamId: 1 } });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);

    const ids = res.data.map((p: { id: number }) => p.id);
    expect(ids).toContain(1001); // active pitcher A
    expect(ids).toContain(1002); // active pitcher B
    expect(ids).not.toContain(1003); // inactive — must be excluded

    for (const player of res.data) {
      expect(["P", "TWP"]).toContain(player.position);
    }
  });
});
