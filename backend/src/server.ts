import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { prisma } from "./services/db.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);

app.set("trust proxy", true);
app.use(morgan("combined"));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "db_unreachable" });
  }
});

app.get("/api/players", async (_req, res) => {
  try {
    const players = await prisma.player.findMany({ take: 25 });
    res.json(players);
  } catch {
    res.status(500).json({ error: "failed_to_query_players" });
  }
});


app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

app.listen(PORT, () => {
  console.log(`Node API listening on :${PORT}`);
});
