import { useEffect, useMemo, useState } from "react";
import type { Player } from "../types";
import { TEAM_OPTIONS, PITCH_TYPES, INNING_OPTIONS } from "../shared";
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

type SimulationProps = {
  players?: Player[];
};

export default function Simulation({ players = [] }: SimulationProps) {
  // Input
  const [batterId, setBatterId] = useState("");
  const [pitcherId, setPitcherId] = useState("");
  // TODO actually connect to db and filter players by team
  const [batTeam, setBatTeam] = useState("");
  const [pitchTeam, setPitchTeam] = useState("");
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [runnersOn, setRunnersOn] = useState<Array<"1B" | "2B" | "3B">>([]);
  const [inningHalf, setInningHalf] = useState<"top" | "bottom">("top");
  const [inning, setInning] = useState(1);
  const [batScore, setBatScore] = useState(0);
  const [pitchScore, setPitchScore] = useState(0);
  const [prevPitchType, setPrevPitchType] = useState("FF");

  // Output + functionality
  const [respText, setRespText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Default to first player loaded
  useEffect(() => {
    if (!players.length) return;
    if (!batterId) setBatterId(String(players[0].id));
    if (!pitcherId)
      setPitcherId(String(players[Math.min(1, players.length - 1)].id));
  }, [players, batterId, pitcherId]);

  // Names for batter/pitcher
  const batterLabel = useMemo(() => {
    const p = players.find((x) => String(x.id) === String(batterId));
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [players, batterId]);
  const pitcherLabel = useMemo(() => {
    const p = players.find((x) => String(x.id) === String(pitcherId));
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [players, pitcherId]);

  function pretty(j: string): string {
    try {
      return JSON.stringify(JSON.parse(j), null, 2);
    } catch {
      return j;
    }
  }

  // Assemble input json
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

  // Send request to model and render output
  async function run(): Promise<void> {
    setErr("");
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
            <Select value={batTeam} onChange={(e) => setBatTeam(String(e.target.value))} displayEmpty>
              <MenuItem value="">
                <em>Select…</em>
              </MenuItem>
              {TEAM_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitch Team</FormLabel>
            <Select value={pitchTeam} onChange={(e) => setPitchTeam(String(e.target.value))} displayEmpty>
              <MenuItem value="">
                <em>Select…</em>
              </MenuItem>
              {TEAM_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Batter</FormLabel>
            <Select value={batterId} onChange={(e) => setBatterId(String(e.target.value))} displayEmpty>
              <MenuItem value="">
                <em>Select…</em>
              </MenuItem>
              {players.map((p) => (
                <MenuItem key={String(p.id)} value={String(p.id)}>
                  {p.first_name} {p.last_name} (id {p.id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitcher</FormLabel>
            <Select value={pitcherId} onChange={(e) => setPitcherId(String(e.target.value))} displayEmpty>
              <MenuItem value="">
                <em>Select…</em>
              </MenuItem>
              {players.map((p) => (
                <MenuItem key={String(p.id)} value={String(p.id)}>
                  {p.first_name} {p.last_name} (id {p.id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <NumToggle label="Balls" value={balls} options={[0,1,2,3]} onChange={setBalls} />
          <NumToggle label="Strikes" value={strikes} options={[0,1,2]} onChange={setStrikes} />
          <NumToggle label="Outs" value={outs} options={[0,1,2]} onChange={setOuts} />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
          <FormControl size="small" sx={{ flex: 1 }}>
            <FormLabel sx={{ mb: 0.5 }}>
              Runners on
            </FormLabel>

            <ToggleButtonGroup
              value={runnersOn}
              onChange={(_, v) => setRunnersOn(v)}
              size="small"
            >
              <ToggleButton value="1B" sx={{ flex: 1 }}>
                1
              </ToggleButton>
              <ToggleButton value="2B" sx={{ flex: 1 }}>
                2
              </ToggleButton>
              <ToggleButton value="3B" sx={{ flex: 1 }}>
                3
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
                <MenuItem key={pt} value={pt}>
                  {pt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Button variant="contained" size="large" fullWidth onClick={run} disabled={loading}>
          {loading ? "Sending..." : "Get Pitch Sequence"}
        </Button>

        {err && <pre className="pre pre-error">{err}</pre>}

        <TextField
          label="Response"
          value={respText}
          minRows={6}
          fullWidth
        />

        <Typography variant="body2" color="text.secondary">
          <b>Selected:</b> batter={batterLabel} pitcher={pitcherLabel}
        </Typography>
      </Stack>
    </Paper>
  );
}