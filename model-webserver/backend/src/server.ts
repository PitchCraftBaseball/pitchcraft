import express, { Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import { SequenceInputSchema, type SequenceInput } from "./schemas.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);

app.set("trust proxy", true);
app.use(morgan("combined"));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/api/sequence", (req, res) => {
  const parsed = SequenceInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
  }

  const input: SequenceInput = parsed.data;
  return res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Model API listening on :${PORT}`);
});
