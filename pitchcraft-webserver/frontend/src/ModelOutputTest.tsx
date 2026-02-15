import { useState } from "react";

export default function ModelOutputTest() {
  const [reqText, setReqText] = useState<string>("");
  const [respText, setRespText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");

  function pretty(j: string): string {
    try {
      return JSON.stringify(JSON.parse(j), null, 2);
    } catch {
      return j;
    }
  }

  async function run(): Promise<void> {
    setErr("");
    setRespText("");

    let body: unknown;
    try {
      body = JSON.parse(reqText);
    } catch {
      setErr("Request JSON is invalid.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/model/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await r.text();
      if (!r.ok) return setErr(pretty(text || `Request failed (${r.status})`));
      setRespText(pretty(text));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sim">
      <h2>Model Predict</h2>

      <div className="sim-grid">
        <label>Request (raw JSON)</label>
        <textarea
          rows={10}
          value={reqText}
          onChange={(e) => setReqText(e.target.value)}
        />

        <label>Response</label>
        <textarea rows={10} value={respText} readOnly spellCheck={false} />
      </div>

      <button className="btn" onClick={run} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>

      {err && <pre className="pre pre-error">{err}</pre>}
    </div>
  );
}
