import { useEffect, useState } from "react";
import Simulation from "./Simulation";

export default function App() {
  const [status, setStatus] = useState("checking");
  const [players, setPlayers] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const h = await fetch("/api/health").then((r) => r.json());
        if (!h.ok) {
          setStatus("down");
          return;
        }
        setStatus("up");

        const list = await fetch("/api/players").then((r) => r.json());
        setPlayers(list);
      } catch (e) {
        setStatus("down");
        setErr(String(e));
      }
    })();
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>PitchCraft</h1>
      <p>DB: {status}</p>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {status === "up" && (
        <>
          <Simulation players={players} />
        </>
      )}
    </div>
  );
}
