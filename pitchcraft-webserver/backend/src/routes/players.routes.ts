import { Request, Response } from "express";
import express from "express";
import { prisma } from "../services/db.js";

const MLB_STATS_API_URL = "https://statsapi.mlb.com/api/v1.1";

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
        position: batters ? { not: "P" } : "P",
        active: { not: false },
      },
      orderBy: [{ use_last_name: "asc" }, { use_first_name: "asc" }],
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

async function getFallbackLineup(teamId: number, oppPitchHand: 'R' | 'L' | 'S' | undefined): Promise<number[]> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);

    const games = await prisma.schedule.findMany({
      where: {
        game_datetime: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { home_team_id: teamId },
          { away_team_id: teamId }
        ]
      },
      orderBy: {
        game_datetime: "desc"
      }
    });

    console.log(`Found ${games.length} recent games for team ${teamId} to use as fallback lineup`);

    for (const game of games) {
      const gameRes = await fetch(`${MLB_STATS_API_URL}/game/${game.game_id}/feed/live`);

      if (!gameRes.ok) {
        console.error(`MLB Stats API error: ${gameRes.status} ${gameRes.statusText}`);
        return [];
      }

      const gameData = await gameRes.json();
      
      const isHome = gameData.gameData.teams.home.id === teamId;
      const teamSide = isHome ? 'home' : 'away';

      if (!oppPitchHand || oppPitchHand === 'S') {
        // take most recent game if no projected opposing pitcher or if switch pitcher
        const batterIds = gameData?.liveData?.boxscore?.teams?.[teamSide]?.battingOrder;
        if (batterIds && batterIds.length > 0) {
          return batterIds;
        }
      } else {
        const oppPitcherHand = gameData?.gameData?.probablePitchers?.[isHome ? 'away' : 'home']?.pitchHand?.code;

        if (oppPitcherHand && oppPitcherHand !== oppPitchHand) {
          continue;
        }

        const batterIds = gameData?.liveData?.boxscore?.teams?.[teamSide]?.battingOrder;

        if (batterIds && batterIds.length > 0) {
          return batterIds;
        }
      }
    }

    // fallback to most recent game if no games found with a matching pitcher hand
    const fallbackGame = games[0];
    const fallbackGameRes = await fetch(`${MLB_STATS_API_URL}/game/${fallbackGame.game_id}/feed/live`);
    if (!fallbackGameRes.ok) {
      console.error(`MLB Stats API error: ${fallbackGameRes.status} ${fallbackGameRes.statusText}`);
      return [];
    }

    const fallbackGameData = await fallbackGameRes.json();
    const isHome = fallbackGameData.gameData.teams.home.id === teamId;
    const teamSide = isHome ? 'home' : 'away';
    const fallbackBatterIds = fallbackGameData?.liveData?.boxscore?.teams?.[teamSide]?.battingOrder;
    return fallbackBatterIds ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error fetching recent game for team ${teamId}: ${message}`);
    return [];
  }
}

async function getProjectedLineup(req: Request, res: Response) {
  const gamePk = Number(req.query.gamePk);

  if (Number.isNaN(gamePk)) {
    return res.status(400).json({ error: "Invalid gamePk" });
  }

  try {
    const response = await fetch(`${MLB_STATS_API_URL}/game/${gamePk}/feed/live`);
    if (!response.ok) {
      console.error(`MLB Stats API error: ${response.status} ${response.statusText}`);
      return res.status(500).json({ error: "Failed to fetch game data" });
    }

    const data = await response.json();
    const homePitcherId = data?.gameData?.probablePitchers?.home?.id ?? 0;
    const awayPitcherId = data?.gameData?.probablePitchers?.away?.id ?? 0; 

    const homePitcherHand = data?.gameData?.players[`ID${homePitcherId}`]?.pitchHand?.code;
    const awayPitcherHand = data?.gameData?.players[`ID${awayPitcherId}`]?.pitchHand?.code;

    const boxScore = data?.liveData?.boxscore?.teams;

    
    let homeBatterIds = boxScore?.home?.battingOrder ?? [];
    let awayBatterIds = boxScore?.away?.battingOrder ?? [];

    if (homeBatterIds.length != 0 && awayBatterIds.length != 0) {
      console.log("FROM STATS API", {
        homeBatterIds,
        awayBatterIds
      })
    }
    
    // lineups are only posted after manager has submitted (usually around 2 hours before gametime) 
    // if not available, fallback to recent games, prioritizing a game with a pitcher that matches the projected opposing pitcher's throwing hand
    if (homeBatterIds.length === 0) {
      homeBatterIds = await getFallbackLineup(data.gameData.teams.home.id, awayPitcherHand);
    }

    if (awayBatterIds.length === 0) {
      awayBatterIds = await getFallbackLineup(data.gameData.teams.away.id, homePitcherHand);
    }

    const combinedIds = [...new Set([...homeBatterIds, ...awayBatterIds, homePitcherId, awayPitcherId])];

    const dbPlayers = await prisma.player.findMany({
      where: {
        id: { in: combinedIds.map(id => Number(id)) },
        active: { not: false }
      }
    })

    console.log(`Found ${dbPlayers.length} projected players for game ${gamePk}`);
    return res.json({
      home: {
        pitcher: dbPlayers.find(player => player.id === homePitcherId),
        batters: homeBatterIds.map((id: Number) => dbPlayers.find(player => player.id === id))
      },
      away: {
        pitcher: dbPlayers.find(player => player.id === awayPitcherId),
        batters: awayBatterIds.map((id: Number) => dbPlayers.find(player => player.id === id))
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return res.status(500).json({ error: message });
  }
}

playersRouter.get("/pitchers", (req, res) => getPlayers(req, res, false));
playersRouter.get("/batters",  (req, res) => getPlayers(req, res, true));
playersRouter.get("/projected-lineup", (req, res) => getProjectedLineup(req, res));

export default playersRouter;
