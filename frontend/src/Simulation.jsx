import { useEffect, useMemo, useState } from "react";

const DEFAULT_FEATURES = {
  categorical: [{ feature_name: "pitch_type", value: "FF" }],
  boolean: [{ feature_name: "is_home", value: true }],
};

export default function Simulation({ players = [] }) {
  const [batterId, setBatterId] = useState("");
  const [pitcherId, setPitcherId] = useState("");
  const [featuresText, setFeaturesText] = useState(
    JSON.stringify(DEFAULT_FEATURES, null, 2)
  );

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!players.length) return;
    if (!batterId) setBatterId(String(players[0].id));
    if (!pitcherId) setPitcherId(String(players[Math.min(1, players.length - 1)].id));
  }, [players, batterId, pitcherId]);

  const batterLabel = useMemo(() => {
    const p = players.find(x => String(x.id) === String(batterId));
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [players, batterId]);

  const pitcherLabel = useMemo(() => {
    const p = players.find(x => String(x.id) === String(pitcherId));
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [players, pitcherId]);

  async function run() {
    setErr("");
    setResp(null);

    let features;
    try {
      features = JSON.parse(featuresText);
    } catch (e) {
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

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(data?.error ? JSON.stringify(data) : `Request failed (${r.status})`);
      } else {
        setResp(data);
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Model Simulation</h2>

      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, maxWidth: 720 }}>
        <label>Batter</label>
        <select value={batterId} onChange={(e) => setBatterId(e.target.value)}>
          {players.map(p => (
            <option key={p.id} value={String(p.id)}>
              {p.first_name} {p.last_name} (id {p.id})
            </option>
          ))}
        </select>

        <label>Pitcher</label>
        <select value={pitcherId} onChange={(e) => setPitcherId(e.target.value)}>
          {players.map(p => (
            <option key={p.id} value={String(p.id)}>
              {p.first_name} {p.last_name} (id {p.id})
            </option>
          ))}
        </select>

        <label>Features (JSON)</label>
        <textarea
          rows={8}
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        />
      </div>

      <button onClick={run} disabled={loading} style={{ marginTop: 12 }}>
        {loading ? "Running..." : "Run simulation"}
      </button>

      <div style={{ marginTop: 12, color: "#555" }}>
        <div><b>Selected:</b> batter={batterLabel} pitcher={pitcherLabel}</div>
      </div>

      {err && <pre style={{ marginTop: 12, color: "crimson", whiteSpace: "pre-wrap" }}>{err}</pre>}
      {resp && (
        <pre style={{ marginTop: 12, background: "#f7f7f7", padding: 12, borderRadius: 8 }}>
          {JSON.stringify(resp, null, 2)}
        </pre>
      )}
    </div>
  );
}
