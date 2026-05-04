import { describe, expect, it } from "vitest";
import { api } from "./client.js";

describe("BE_MODEL_HEALTH_URL_UNSET", () => {
  it("GET /api/model/health returns 500 when MODEL_BASE_URL is unset", async () => {
    const res = await api.get("/api/model/health");
    expect(res.status).toBe(500);
    expect(res.data).toEqual({ error: "model_base_url_not_configured" });
  });
});
