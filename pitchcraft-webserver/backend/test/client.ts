import axios from "axios";

export const api = axios.create({
  baseURL: process.env.TEST_API_URL ?? "http://127.0.0.1:18000",
  timeout: 10_000,
  validateStatus: () => true,
});
