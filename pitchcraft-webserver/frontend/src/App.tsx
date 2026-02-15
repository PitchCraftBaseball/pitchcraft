import { useEffect, useState } from "react";
import ModelOutputTest from "./ModelOutputTest";
import "./App.css";

type Status = "checking" | "up" | "down";
type HealthResponse = { ok: boolean };

export default function App() {
  const [status, setStatus] = useState<Status>("checking");

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

  return (
    <div className="page">
      <h1>Pitchcraft</h1>
      <p>
        API status:{" "}
        <strong>
          {status === "checking" ? "checking…" : status === "up" ? "UP" : "DOWN"}
        </strong>
      </p>

      <ModelOutputTest />
    </div>
  );
}
