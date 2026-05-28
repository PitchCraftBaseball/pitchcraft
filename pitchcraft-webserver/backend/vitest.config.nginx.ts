import { defineConfig } from "vitest/config";

// Separate config for nginx integration tests.
// No globalSetup — assumes the full Docker Compose stack is already running on port 80.
// Run with: npm run test:nginx
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/nginx.test.ts"],
    testTimeout: 30_000,
    sequence: {
      concurrent: false,
    },
  },
});
