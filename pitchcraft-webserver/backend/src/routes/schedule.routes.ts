import express from "express"; 
import { prisma } from "../services/db.js";

let scheduleRouter = express.Router(); 

scheduleRouter.get("/date", async (req, res) => { 
  const dateParam = Array.isArray(req.query.date)
    ? req.query.date[0]
    : req.query.date;
  const dateString = typeof dateParam === "string" ? dateParam : undefined;
  const tzOffsetParam = Array.isArray(req.query.tzOffsetMinutes)
    ? req.query.tzOffsetMinutes[0]
    : req.query.tzOffsetMinutes;
  const tzOffsetString = typeof tzOffsetParam === "string" ? tzOffsetParam : undefined;
  const tzOffsetMinutes = tzOffsetString ? Number(tzOffsetString) : undefined;
  const baseDate = dateString ? new Date(dateString) : new Date();

  if (
    (tzOffsetMinutes !== undefined && Number.isNaN(tzOffsetMinutes)) ||
    Number.isNaN(baseDate.getTime())
  ) {
    return res.status(400).json({ error: "Invalid date" });
  }

  let start: Date;
  let end: Date;
  if (dateString && tzOffsetMinutes !== undefined) {
    const parts = dateString.split("-").map((part) => Number(part));
    const [year, month, day] = parts;
    const hasValidDate =
      parts.length === 3 &&
      !Number.isNaN(year) &&
      !Number.isNaN(month) &&
      !Number.isNaN(day);

    if (!hasValidDate) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const utcStartMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - (tzOffsetMinutes * 60 * 1000);
    start = new Date(utcStartMs);
    end = new Date(utcStartMs + 24 * 60 * 60 * 1000 - 1);
  } else {
    // The server runs in UTC. Fall back to a UTC day window based on the provided date.
    start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(baseDate);
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