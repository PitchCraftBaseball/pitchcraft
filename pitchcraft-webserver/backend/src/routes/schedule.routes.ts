import express from "express"; 
import { prisma } from "../services/db";

let scheduleRouter = express.Router(); 

const start = new Date();
start.setHours(0, 0, 0, 0);

const end = new Date();
end.setHours(23, 59, 59, 999);

scheduleRouter.get("/date", async (req, res) => { 
  let { date } = req.query; 

  

  try {
    const gamesToday = await prisma.schedule.findMany({
      where: {
        game_datetime: {
          gte: start,
          lte: end,
        },
      },
    });
  } catch (err) { 
    let error = err as Object; 
    return res.status(500).json({ error: error.toString() });
  }
  

});