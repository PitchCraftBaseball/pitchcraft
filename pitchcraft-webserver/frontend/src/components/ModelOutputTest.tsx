import { useState } from "react";
import { Button, TextField, Typography } from "@mui/material";

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
      <Typography variant="h2">Model Predict</Typography>

      <div className="sim-grid">
        <TextField
          label="Request (raw JSON)"
          multiline
          onChange={(e) => setReqText(e.target.value)}
        />
        <br />
        <Typography variant="h6">Response</Typography>
        <Typography variant="p">{respText}</Typography>
      </div>

      <Button className="btn" variant="contained" onClick={run} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </Button>

      {err && <pre className="pre pre-error">{err}</pre>}
    </div>
  );
}
