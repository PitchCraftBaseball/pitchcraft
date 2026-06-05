import { spawn, execSync } from "child_process";
import type { ChildProcess } from "child_process";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");

// Resolves as soon as the server accepts any HTTP connection, even a 404/500.
// Uses the 404 catch-all as a readiness probe so DB-unavailable servers still respond instantly.
function waitForReady(url: string, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() > deadline)
            reject(new Error(`${url} never accepted connections`));
          else
            setTimeout(attempt, 300);
        });
    };
    attempt();
  });
}

function killProcess(proc: ChildProcess): void {
  if (!proc.pid) return;
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: "pipe" });
    } catch { /* already gone */ }
  } else {
    proc.kill("SIGTERM");
  }
}

export async function spawnServer(
  port: number,
  env: Record<string, string | undefined>
): Promise<{ api: ReturnType<typeof axios.create>; stop: () => void }> {
  const proc = spawn("npx", ["tsx", "src/server.ts"], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, ...env, PORT: String(port) },
    stdio: "pipe",
    shell: true,
  });

  const baseURL = `http://127.0.0.1:${port}`;
  await waitForReady(`${baseURL}/api/__probe__`);

  return {
    api: axios.create({ baseURL, timeout: 10_000, validateStatus: () => true }),
    stop: () => killProcess(proc),
  };
}
