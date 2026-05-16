import "dotenv/config";
import express, { Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { prisma } from "./services/db.js";
import scheduleRouter from "./routes/schedule.routes.js";
import playersRouter from "./routes/players.routes.js";

const PORT = Number(process.env.PORT || 8000);
const modelBaseUrl = process.env.MODEL_BASE_URL;
const app = express();

app.set("trust proxy", true);

// Security headers, by default helmet applies 12 various security headers
// preventing specific types of attacks
app.use(helmet());

app.use(morgan("combined"));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Rate limiting. Ceilings are intentionally high
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // ~1.1 req/sec sustained per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limit_exceeded" },
});

// Tighter rate limit on model passthrough endpoints
const modelLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 1 req/sec sustained per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limit_exceeded" },
});

app.use("/api", generalLimiter);

// DB health
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch {
    res.status(500).json({ ok: false, error: "db_unreachable" });
  }
});

// Passthrough: Pitchcraft FE -> Pitchcraft BE -> Model API
app.get("/api/model/health", modelLimiter, async (_req, res) => {
  if (!modelBaseUrl) return res.status(500).json({ error: "model_base_url_not_configured" });
  try {
    const r = await fetch(`http://${modelBaseUrl}/health`);
    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: "model_unreachable" });
  }
});

// Passthrough: Pitchcraft FE -> Pitchcraft BE -> Model API
app.post("/api/model/predict", modelLimiter, async (req, res) => {
  if (!modelBaseUrl) return res.status(500).json({ error: "model_base_url_not_configured" });
  try {
    const r = await fetch(`http://${modelBaseUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") ?? "application/json");
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: "model_unreachable" });
  }
});

app.use("/api/schedule", scheduleRouter);
app.use("/api/players", playersRouter);
app.use("/api", (_req: Request, res: Response) => res.status(404).json({ error: "not_found" }));

app.listen(PORT, () => {
  console.log(`Node API listening on :${PORT}`);
});
