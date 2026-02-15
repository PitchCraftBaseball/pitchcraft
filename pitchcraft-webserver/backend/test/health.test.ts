import axios, { AxiosError } from "axios";
import { expect, test } from "vitest";

axios.defaults.baseURL = "http://127.0.0.1:8000";

test("GET /api/health returns {ok: true, db: 'up'}", async () => {
  try {
    const response = await axios.get("/api/health", { timeout: 5000 });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true, db: "up" });
  } catch (err) {
    const error = err as AxiosError;
    if (!error.response) throw Error("Server never sent response (is it running?)");
    throw err;
  }
});
