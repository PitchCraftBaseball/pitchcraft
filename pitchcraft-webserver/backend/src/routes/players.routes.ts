import { Request, Respone } from "express";
import express from "express";
import { prisma } from "../services/db.js";

let playersRouter = express.Router();

async function getPlayers(req: Request, res: Response, teamId: number, batters: boolean) {
  if (Number.isNaN(teamId)) {
    return res.status(400).json({ error: "Invalid teamId" });
  }

  try {
    const players = await prisma.player?.findMany({
      where: {
        team_id: Number(teamId),
        position: (batters ? { not: "P" } : "P")
      },
    });

    console.log(`Found ${players.length} players for team ${teamId}`);

    const payload = players.map((player) => ({
      ...player,
      player_id: player.id.toString(),
    }));

    return res.json(payload);
  } catch(err) {
    let error = err as Object;
    console.log(error.toString());
    return res.status(500).json({ error: error.toString() });
  }
}

playersRouter.get("/", async (req, res) => {
  try {
    const players = await prisma.player?.findMany({ take: 25 });
    return res.json(players ?? []);
  } catch {
    return res.status(500).json({ error: "failed_to_query_players" });
  }
});

playersRouter.get("/pitchers", async (req, res) => {
  const teamId = req.query.teamId;
  return getPlayers(req, res, teamId, false);
});

playersRouter.get("/batters", async (req, res) => {
  const teamId = req.query.teamId;
  return getPlayers(req, res, teamId, true);
});

export default playersRouter;
