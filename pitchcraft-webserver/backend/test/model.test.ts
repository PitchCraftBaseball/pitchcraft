import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api } from "./client.js";
import { spawnServer } from "./server-utils.js";

describe("BE_MODEL_HEALTH_URL_UNSET", () => {
  it("GET /api/model/health returns 500 when MODEL_BASE_URL is unset", async () => {
    const res = await api.get("/api/model/health");
    expect(res.status).toBe(500);
    expect(res.data).toEqual({ error: "model_base_url_not_configured" });
  });
});

describe("BE_MODEL_PREDICT_URL_UNSET", () => {
  it("POST /api/model/predict returns 500 when MODEL_BASE_URL is unset", async () => {
    const res = await api.post("/api/model/predict", { game_state: {} });
    expect(res.status).toBe(500);
    expect(res.data).toEqual({ error: "model_base_url_not_configured" });
  });
});

describe("model passthrough with unreachable model server", () => {
  let stop: () => void;
  let badModelApi: Awaited<ReturnType<typeof spawnServer>>["api"];

  beforeAll(async () => {
    const server = await spawnServer(18002, {
      DATABASE_URL: process.env.DATABASE_URL!,
      MODEL_BASE_URL: "127.0.0.1:1",
    });
    badModelApi = server.api;
    stop = server.stop;
  });

  afterAll(() => stop());

  describe("BE_MODEL_HEALTH_UNREACHABLE", () => {
    it("GET /api/model/health returns 502 when model API is unreachable", async () => {
      const res = await badModelApi.get("/api/model/health");

      expect(res.status).toBe(502);
      expect(res.data).toEqual({ error: "model_unreachable" });
    });
  });

  describe("BE_MODEL_PREDICT_UNREACHABLE", () => {
    it("POST /api/model/predict returns 502 when model API is unreachable", async () => {
      const res = await badModelApi.post("/api/model/predict", { game_state: {} });

      expect(res.status).toBe(502);
      expect(res.data).toEqual({ error: "model_unreachable" });
    });
  });
});

describe("BE_PREDICT_JSON_MALFORMED", () => {
  it("POST /api/model/predict with malformed JSON body returns 400 application/json", async () => {
    const res = await api.post("/api/model/predict", "{bad json}", {
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});
