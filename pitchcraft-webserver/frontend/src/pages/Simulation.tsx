import { useMemo, useState } from "react";
import type { Player, PitchProbMap, PredictResponse, PieSlice } from "../types";
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
import PlayerComboBox from "../components/PlayerComboBox";

type TeamId = number | "";

export default function Simulation() {
  // Team selection
  const [batTeamId, setBatTeamId] = useState<TeamId>("");
  const [pitchTeamId, setPitchTeamId] = useState<TeamId>("");

  // Player selection — full Player object so we have the name and id together
  const [batter, setBatter] = useState<Player | null>(null);
  const [pitcher, setPitcher] = useState<Player | null>(null);

  // Game state
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [runnersOn, setRunnersOn] = useState<Array<"1B" | "2B" | "3B">>([]);
  const [inningHalf, setInningHalf] = useState<"top" | "bottom">("top");
  const [inning, setInning] = useState(1);
  const [batScore, setBatScore] = useState(0);
  const [pitchScore, setPitchScore] = useState(0);
  const [prevPitchType, setPrevPitchType] = useState("FF");

  // Output
  const [pieData, setPieData] = useState<PieSlice[]>([]);
  const [respText, setRespText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // When team changes, clear the player selection too
  function handleBatTeamChange(teamId: TeamId) {
    setBatTeamId(teamId);
    setBatter(null);
  }

  function handlePitchTeamChange(teamId: TeamId) {
    setPitchTeamId(teamId);
    setPitcher(null);
  }

  const batterLabel = useMemo(() => {
    return batter ? `${batter.first_name} ${batter.last_name}` : "";
  }, [batter]);

  const pitcherLabel = useMemo(() => {
    return pitcher ? `${pitcher.first_name} ${pitcher.last_name}` : "";
  }, [pitcher]);

  function pretty(j: string): string {
    try {
      return JSON.stringify(JSON.parse(j), null, 2);
    } catch {
      return j;
    }
  }

  function buildPieData(probs: PitchProbMap): PieSlice[] {
    const positive = Object.entries(probs)
      .filter(([, p]) => p > 0)
      .sort((a, b) => b[1] - a[1]);

    // 5 or fewer: show all
    if (positive.length <= 5) {
      return positive.map(([code, value]) => ({
        id: code,
        label: formatPitchType(code),
        value,
      }));
    }

    // More than 5: top 4 + other bucket
    const top4 = positive.slice(0, 4);
    const rest = positive.slice(4);
    const otherValue = rest.reduce((sum, [, p]) => sum + p, 0);

    const slices: PieSlice[] = top4.map(([code, value]) => ({
      id: code,
      label: formatPitchType(code),
      value,
    }));
    slices.push({ id: "__other__", label: "Other", value: otherValue });
    return slices;
  }

  function buildBody() {
    return {
      pitcher: String(pitcher?.id ?? ""),
      batter: String(batter?.id ?? ""),
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
    setRespText("");

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
        setErr(pretty(text || `Request failed (${r.status})`));
        return;
      }

      setRespText(pretty(text));
      const payload = JSON.parse(text) as PredictResponse;
      if (payload.pitch_one) {
        setPieData(buildPieData(payload.pitch_one));
      }
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

        {/* Team selectors */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Bat Team</FormLabel>
            <Select
              value={batTeamId === "" ? "" : String(batTeamId)}
              onChange={(e) => {
                const v = e.target.value as string;
                handleBatTeamChange(v === "" ? "" : Number(v));
              }}
              displayEmpty
            >
              <MenuItem value=""><em>Select…</em></MenuItem>
              {TEAMS.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitch Team</FormLabel>
            <Select
              value={pitchTeamId === "" ? "" : String(pitchTeamId)}
              onChange={(e) => {
                const v = e.target.value as string;
                handlePitchTeamChange(v === "" ? "" : Number(v));
              }}
              displayEmpty
            >
              <MenuItem value=""><em>Select…</em></MenuItem>
              {TEAMS.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Player selectors — using PlayerComboBox */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Batter</FormLabel>
            <PlayerComboBox
              teamId={batTeamId}
              batters={true}
              value={batter}
              onChange={setBatter}
            />
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitcher</FormLabel>
            <PlayerComboBox
              teamId={pitchTeamId}
              batters={false}
              value={pitcher}
              onChange={setPitcher}
            />
          </FormControl>
        </Stack>

        {/* Count / outs */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <NumToggle label="Balls"   value={balls}   options={[0, 1, 2, 3]} onChange={setBalls} />
          <NumToggle label="Strikes" value={strikes} options={[0, 1, 2]}    onChange={setStrikes} />
          <NumToggle label="Outs"    value={outs}    options={[0, 1, 2]}    onChange={setOuts} />
        </Stack>

        {/* Runners / inning */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
          <FormControl size="small" sx={{ flex: 1 }}>
            <FormLabel sx={{ mb: 0.5 }}>Runners on</FormLabel>
            <ToggleButtonGroup value={runnersOn} onChange={(_, v) => setRunnersOn(v)} size="small">
              <ToggleButton value="1B" sx={{ flex: 1 }}>1B</ToggleButton>
              <ToggleButton value="2B" sx={{ flex: 1 }}>2B</ToggleButton>
              <ToggleButton value="3B" sx={{ flex: 1 }}>3B</ToggleButton>
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
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Score inputs */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Bat Score</FormLabel>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={batScore}
              onChange={(e) => setBatScore(Number(e.target.value) || 0)}
            />
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitch Score</FormLabel>
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
                <MenuItem key={pt} value={pt}>{formatPitchType(pt)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={run}
          disabled={loading || !batter || !pitcher}
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

        <TextField
          label="Response"
          value={respText}
          minRows={6}
          fullWidth
          multiline
        />

        <Typography variant="body2" color="text.secondary">
          <b>Selected:</b> batter={batterLabel} pitcher={pitcherLabel}
        </Typography>

      </Stack>
    </Paper>
  );
}
