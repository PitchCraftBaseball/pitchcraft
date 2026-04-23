import { Request, Response } from "express";
import express from "express";
import { prisma } from "../services/db.js";

const playersRouter = express.Router();

async function getPlayers(req: Request, res: Response, batters: boolean) {
  const teamId = Number(req.query.teamId);

  if (Number.isNaN(teamId)) {
    return res.status(400).json({ error: "Invalid teamId" });
  }

  try {
    const players = await prisma.player.findMany({
      where: {
        team_id: teamId,
        position: batters ? { not: "P" } : { in: ["P", "TWP"] },
        active: { not: false },
      },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
    });

    console.log(`Found ${players.length} players for team ${teamId}`);
    return res.json(players);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return res.status(500).json({ error: message });
  }
}

playersRouter.get("/", async (_req, res) => {
  try {
    const players = await prisma.player.findMany({ take: 25 });
    return res.json(players);
  } catch {
    return res.status(500).json({ error: "failed_to_query_players" });
  }
});

playersRouter.get("/pitchers", (req, res) => getPlayers(req, res, false));
playersRouter.get("/batters",  (req, res) => getPlayers(req, res, true));

export default playersRouter;
