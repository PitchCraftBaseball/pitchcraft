import { useEffect, useState } from "react";
import Simulation from "./Simulation";
import type { Player } from "./types";
import "./App.css";

type Status = "checking" | "up" | "down";
type HealthResponse = { ok: boolean };

export default function App() {
  const [status, setStatus] = useState<Status>("checking");
  const [players, setPlayers] = useState<Player[]>([]);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/health");
        const data = (await r.json()) as HealthResponse;
        setStatus(data.ok ? "up" : "down");
      } catch {
        setStatus("down");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const r = await fetch("/api/players");
        if (!r.ok) throw new Error(`players fetch failed: ${r.status}`);
        const data = (await r.json()) as Player[];
        setPlayers(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
      }
    })();
  }, []);

  return (
    <div className="page">
      <h1>Pitchcraft</h1>
      <p>
        API status:{" "}
        <strong>
          {status === "checking" ? "checking…" : status === "up" ? "UP" : "DOWN"}
        </strong>
      </p>

      {err && <pre className="pre pre-error">{err}</pre>}

      <Simulation players={players} />
    </div>
  );
}
