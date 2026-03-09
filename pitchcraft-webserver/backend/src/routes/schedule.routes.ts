import express from "express"; 
import { prisma } from "../services/db.js";

let scheduleRouter = express.Router(); 

scheduleRouter.get("/date", async (req, res) => { 
  const startParam = Array.isArray(req.query.start)
    ? req.query.start[0]
    : req.query.start;
  const endParam = Array.isArray(req.query.end)
    ? req.query.end[0]
    : req.query.end;
  const startString = typeof startParam === "string" ? startParam : undefined;
  const endString = typeof endParam === "string" ? endParam : undefined;
  const startFromClient = startString ? new Date(startString) : undefined;
  const endFromClient = endString ? new Date(endString) : undefined;

  const dateParam = Array.isArray(req.query.date)
    ? req.query.date[0]
    : req.query.date;
  const dateString = typeof dateParam === "string" ? dateParam : undefined;
  const baseDate = dateString ? new Date(dateString) : new Date();

  if (
    (startFromClient && Number.isNaN(startFromClient.getTime())) ||
    (endFromClient && Number.isNaN(endFromClient.getTime())) ||
    Number.isNaN(baseDate.getTime())
  ) {
    return res.status(400).json({ error: "Invalid date" });
  }

  const start = startFromClient ?? new Date(baseDate);
  const end = endFromClient ?? new Date(baseDate);
  if (!startFromClient || !endFromClient) {
    // The server is in UTC. If the client does not provide a local-day range,
    // fall back to a UTC day window based on the provided date.
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  try {
    const gamesToday = await prisma.schedule.findMany({
      where: {
        game_datetime: {
          gte: start,
          lte: end,
        },
      },
    });

    console.log(`Found ${gamesToday.length} games`);

    const payload = gamesToday.map((game) => ({
      ...game,
      game_id: game.game_id.toString(),
    }));

    return res.json(payload);
  } catch (err) { 
    let error = err as Object; 
    console.log(error.toString());
    return res.status(500).json({ error: error.toString() });
  }
});

export default scheduleRouter; 