import express from "express"; 
import { prisma } from "../services/db.js";

let scheduleRouter = express.Router(); 

scheduleRouter.get("/date", async (req, res) => { 
  const dateParam = Array.isArray(req.query.date)
    ? req.query.date[0]
    : req.query.date;
  const dateString = typeof dateParam === "string" ? dateParam : undefined;
  const baseDate = dateString ? new Date(dateString) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);

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