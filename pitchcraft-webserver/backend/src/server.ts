import "dotenv/config";
import express, { Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import { prisma } from "./services/db.js";
import scheduleRouter from "./routes/schedule.routes.js";
import playersRouter from "./routes/players.routes.js";

const PORT = Number(process.env.PORT || 8000);
const modelBaseUrl = process.env.MODEL_BASE_URL;
const app = express();

app.set("trust proxy", true);
app.use(morgan("combined"));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// DB health
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch {
    res.status(500).json({ ok: false, error: "db_unreachable" });
  }
});

// DB query example
app.get("/api/players", async (_req: Request, res: Response) => {
  try {
    const players = await prisma.player?.findMany({ take: 25 });
    res.json(players ?? []);
  } catch {
    res.status(500).json({ error: "failed_to_query_players" });
  }
});

// Passthrough: Pitchcraft FE -> Pitchcraft BE -> Model API
app.get("/api/model/health", async (_req, res) => {
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
app.post("/api/model/predict", async (req, res) => {
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

// Get batters by team (position != 'P', TODO)
app.get("/api/teams/:teamId/batters", async (req: Request, res: Response) => {
  const teamId = Number(req.params.teamId);
  if (!Number.isFinite(teamId)) return res.status(400).json({ error: "invalid_team_id" });
  try {
    const batters = await prisma.$queryRaw`
      SELECT *
      FROM players
      WHERE team_id = ${teamId} AND position <> 'P'
      ORDER BY last_name, first_name
    `;
    return res.json(batters);
  } catch (e) {
    console.error("failed_to_query_batters", e);
    return res.status(500).json({ error: "failed_to_query_batters" });
  }
});

// Get pitchers by team (position != 'P')
app.get("/api/teams/:teamId/pitchers", async (req: Request, res: Response) => {
  const teamId = Number(req.params.teamId);
  if (!Number.isFinite(teamId)) return res.status(400).json({ error: "invalid_team_id" });
  try {
    const pitchers = await prisma.$queryRaw`
      SELECT *
      FROM players
      WHERE team_id = ${teamId} AND position = 'P'
      ORDER BY last_name, first_name
    `;
    return res.json(pitchers);
  } catch (e) {
    console.error("failed_to_query_pitchers", e);
    return res.status(500).json({ error: "failed_to_query_pitchers" });
  }
});

app.use("/api/schedule", scheduleRouter)
app.use("/api/players", playersRouter)
app.use("/api", (_req: Request, res: Response) => res.status(404).json({ error: "not_found" }));

app.listen(PORT, () => {
  console.log(`Node API listening on :${PORT}`);
});
