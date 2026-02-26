import { useEffect, useMemo, useState } from "react";
import type { Player, TeamId, PitchProbMap, PredictResponse, PieSlice } from "../types";
import { TEAMS, PITCH_TYPES, INNING_OPTIONS, formatPitchType } from "../shared";
import {
  Button,
  FormControl,
  FormLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const text = await r.text();
  if (!r.ok) throw new Error(text || `Request failed (${r.status})`);
  return JSON.parse(text) as T;
}

export default function Simulation() {
  const [batTeamId, setBatTeamId] = useState<TeamId>("");
  const [pitchTeamId, setPitchTeamId] = useState<TeamId>("");

  const [batters, setBatters] = useState<Player[]>([]);
  const [pitchers, setPitchers] = useState<Player[]>([]);

  const [batterId, setBatterId] = useState("");
  const [pitcherId, setPitcherId] = useState("");

  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [runnersOn, setRunnersOn] = useState<Array<"1B" | "2B" | "3B">>([]);
  const [inningHalf, setInningHalf] = useState<"top" | "bottom">("top");
  const [inning, setInning] = useState(1);
  const [batScore, setBatScore] = useState(0);
  const [pitchScore, setPitchScore] = useState(0);
  const [prevPitchType, setPrevPitchType] = useState("FF");

  const [pieData, setPieData] = useState<PieSlice[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Load batters when batting team changes
  useEffect(() => {
    (async () => {
      setBatters([]);
      setBatterId("");
      if (!batTeamId) return;

      try {
        const rows = await fetchJson<Player[]>(`/api/teams/${batTeamId}/batters`);
        setBatters(rows);
        setBatterId(rows[0] ? String(rows[0].id) : "");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [batTeamId]);

  // Load pitchers when pitching team changes
  useEffect(() => {
    (async () => {
      setPitchers([]);
      setBatterId("");
      if (!pitchTeamId) return;

      try {
        const rows = await fetchJson<Player[]>(`/api/teams/${pitchTeamId}/pitchers`);
        setPitchers(rows);
        setBatterId(rows[0] ? String(rows[0].id) : "");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [pitchTeamId]);

  const batterLabel = useMemo(() => {
    const p = batters.find((x) => String(x.id) === String(batterId));
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [batters, batterId]);

  const pitcherLabel = useMemo(() => {
    const p = pitchers.find((x) => String(x.id) === String(pitcherId));
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [pitchers, pitcherId]);

  function buildPieData(probs: PitchProbMap): PieSlice[] {
    const positive = Object.entries(probs)
      .filter(([, p]) => p > 0)
      .sort((a, b) => b[1] - a[1]);

    // 1 to 5 pitches: show all
    if (positive.length <= 5) {
      return positive.map(([code, value]) => ({
        id: code,
        label: formatPitchType(code), // friendly name
        value,
      }));
    }

    // >5 pitches: show top 4 + other bucket
    const top4 = positive.slice(0, 4);
    const rest = positive.slice(4);
    const otherValue = rest.reduce((sum, [, p]) => sum + p, 0);

    return [
      ...top4.map(([code, value]) => ({
        id: code,
        label: formatPitchType(code), // friendly name
        value,
      })),
      { id: "__other__", label: "Other", value: otherValue },
    ];
  }

  function buildBody() {
    return {
      pitcher: String(pitcherId),
      batter: String(batterId),
      state_features: {
        inning_topbot: inningHalf === "top" ? "Top" : "Bottom",
        count_state: `${balls}-${strikes}`,
        prev_pitch_type: prevPitchType,
        balls,
        strikes,
        outs_when_up: outs,
        inning,
        score_diff_bat: batScore - pitchScore,
        on_1b: runnersOn.includes("1B") ? 1 : 0,
        on_2b: runnersOn.includes("2B") ? 1 : 0,
        on_3b: runnersOn.includes("3B") ? 1 : 0,
      },
      batter_features: ["stand"],
      pitcher_features: ["p_throws"],
    };
  }

  function NumToggle({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: number;
    options: number[];
    onChange: (v: number) => void;
  }) {
    return (
      <FormControl fullWidth size="small">
        <FormLabel sx={{ mb: 0.5 }}>{label}</FormLabel>
        <ToggleButtonGroup
          fullWidth
          exclusive
          value={value}
          onChange={(_, v) => v !== null && onChange(v)}
          size="small"
        >
          {options.map((n) => (
            <ToggleButton key={n} value={n}>
              {n}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormControl>
    );
  }

  async function run(): Promise<void> {
    setErr("");
    setPieData([]);

    const body = buildBody();
    console.log("Request body:", body);

    setLoading(true);
    try {
      const r = await fetch("/api/model/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await r.text();
      if (!r.ok) {
        setErr(text || `Request failed (${r.status})`);
        return;
      }

      const payload = JSON.parse(text) as PredictResponse;
      setPieData(buildPieData(payload.pitch_one));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Model Simulation
      </Typography>

      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Bat Team</FormLabel>
            <Select
              value={batTeamId === "" ? "" : String(batTeamId)}
              onChange={(e) => {
                const v = e.target.value as string; // MUI select gives string
                setBatTeamId(v === "" ? "" : Number(v));
              }}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select…</em>
              </MenuItem>
              {TEAMS.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitch Team</FormLabel>
            <Select
              value={pitchTeamId === "" ? "" : String(pitchTeamId)}
              onChange={(e) => {
                const v = e.target.value as string; // MUI select gives string
                setPitchTeamId(v === "" ? "" : Number(v));
              }}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select…</em>
              </MenuItem>
              {TEAMS.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small" disabled={!batTeamId}>
            <FormLabel sx={{ mb: 0.5 }}>Batter</FormLabel>
            <Select value={batterId} onChange={(e) => setBatterId(String(e.target.value))} displayEmpty>
              <MenuItem value="">
                <em>{batTeamId ? "Select…" : "Select a team first…"}</em>
              </MenuItem>
              {batters.map((p) => (
                <MenuItem key={String(p.id)} value={String(p.id)}>
                  {p.first_name} {p.last_name} (id {p.id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={!pitchTeamId}>
            <FormLabel sx={{ mb: 0.5 }}>Pitcher</FormLabel>
            <Select value={pitcherId} onChange={(e) => setPitcherId(String(e.target.value))} displayEmpty>
              <MenuItem value="">
                <em>{pitchTeamId ? "Select…" : "Select a team first…"}</em>
              </MenuItem>
              {pitchers.map((p) => (
                <MenuItem key={String(p.id)} value={String(p.id)}>
                  {p.first_name} {p.last_name} (id {p.id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <NumToggle label="Balls" value={balls} options={[0, 1, 2, 3]} onChange={setBalls} />
          <NumToggle label="Strikes" value={strikes} options={[0, 1, 2]} onChange={setStrikes} />
          <NumToggle label="Outs" value={outs} options={[0, 1, 2]} onChange={setOuts} />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
          <FormControl size="small" sx={{ flex: 1 }}>
            <FormLabel sx={{ mb: 0.5 }}>Runners on</FormLabel>
            <ToggleButtonGroup value={runnersOn} onChange={(_, v) => setRunnersOn(v)} size="small">
              <ToggleButton value="1B" sx={{ flex: 1 }}>
                1B
              </ToggleButton>
              <ToggleButton value="2B" sx={{ flex: 1 }}>
                2B
              </ToggleButton>
              <ToggleButton value="3B" sx={{ flex: 1 }}>
                3B
              </ToggleButton>
            </ToggleButtonGroup>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ flex: 1 }}>
            <FormLabel sx={{ mb: 0.5 }}>Inning half</FormLabel>
            <Select value={inningHalf} onChange={(e) => setInningHalf(e.target.value as "top" | "bottom")}>
              <MenuItem value="top">Top</MenuItem>
              <MenuItem value="bottom">Bottom</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ flex: 1 }}>
            <FormLabel sx={{ mb: 0.5 }}>Inning</FormLabel>
            <Select value={inning} onChange={(e) => setInning(Number(e.target.value))}>
              {INNING_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Bat Team Score</FormLabel>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={batScore}
              onChange={(e) => setBatScore(Number(e.target.value) || 0)}
            />
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitch Team Score</FormLabel>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={pitchScore}
              onChange={(e) => setPitchScore(Number(e.target.value) || 0)}
            />
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Previous pitch type</FormLabel>
            <Select value={prevPitchType} onChange={(e) => setPrevPitchType(String(e.target.value))}>
              {PITCH_TYPES.map((pt) => (
                <MenuItem key={pt} value={pt}>
                  {formatPitchType(pt)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={run}
          disabled={loading || !batterId || !pitcherId}
        >
          {loading ? "Sending..." : "Get Pitch Sequence"}
        </Button>

        {err && <pre className="pre pre-error">{err}</pre>}

        {pieData.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Top pitch probabilities
            </Typography>
            <PieChart
              height={260}
              series={[
                {
                  data: pieData,
                  valueFormatter: (item) => `${(item.value * 100).toFixed(1)}%`,
                },
              ]}
            />
          </Paper>
        )}

        <Typography variant="body2" color="text.secondary">
          <b>Selected:</b> batter={batterLabel} pitcher={pitcherLabel}
        </Typography>
      </Stack>
    </Paper>
  );
}