import { useEffect, useMemo, useState } from "react";
import type { Player } from "./types";

const DEFAULT_FEATURES = {
  categorical: [{ feature_name: "pitch_type", value: "FF" }],
  boolean: [{ feature_name: "is_home", value: true }],
};

type SimulationProps = {
  players?: Player[];
};

export default function Simulation({ players = [] }: SimulationProps) {
  const [batterId, setBatterId] = useState<string>("");
  const [pitcherId, setPitcherId] = useState<string>("");
  const [featuresText, setFeaturesText] = useState<string>(
    JSON.stringify(DEFAULT_FEATURES, null, 2)
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [resp, setResp] = useState<unknown | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!players.length) return;
    if (!batterId) setBatterId(String(players[0].id));
    if (!pitcherId)
      setPitcherId(String(players[Math.min(1, players.length - 1)].id));
  }, [players, batterId, pitcherId]);

  const batterLabel = useMemo(() => {
    const p = players.find((x) => String(x.id) === String(batterId));
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [players, batterId]);

  const pitcherLabel = useMemo(() => {
    const p = players.find((x) => String(x.id) === String(pitcherId));
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [players, pitcherId]);

  async function run(): Promise<void> {
    setErr("");
    setResp(null);

    let features: unknown;
    try {
      features = JSON.parse(featuresText);
    } catch {
      setErr("Features JSON is invalid.");
      return;
    }

    const body = {
      batter: String(batterId),
      pitcher: String(pitcherId),
      features,
    };

    setLoading(true);
    try {
      const r = await fetch("/api/model/sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: any = await r.json().catch(() => ({}));

      if (!r.ok) {
        setErr(data?.error ? JSON.stringify(data) : `Request failed (${r.status})`);
      } else {
        setResp(data);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sim">
      <h2>Model Simulation</h2>

      <div className="sim-grid">
        <label>Batter</label>
        <select value={batterId} onChange={(e) => setBatterId(e.target.value)}>
          {players.map((p) => (
            <option key={String(p.id)} value={String(p.id)}>
              {p.first_name} {p.last_name} (id {p.id})
            </option>
          ))}
        </select>

        <label>Pitcher</label>
        <select value={pitcherId} onChange={(e) => setPitcherId(e.target.value)}>
          {players.map((p) => (
            <option key={String(p.id)} value={String(p.id)}>
              {p.first_name} {p.last_name} (id {p.id})
            </option>
          ))}
        </select>

        <label>Features (JSON)</label>
        <textarea
          rows={8}
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
        />
      </div>

      <button className="btn" onClick={run} disabled={loading}>
        {loading ? "Running..." : "Run simulation"}
      </button>

      <div className="meta">
        <div>
          <b>Selected:</b> batter={batterLabel} pitcher={pitcherLabel}
        </div>
      </div>

      {err && <pre className="pre pre-error">{err}</pre>}

      {resp !== null && (
        <pre className="pre pre-output">{JSON.stringify(resp, null, 2)}</pre>
      )}
    </div>
  );
}
