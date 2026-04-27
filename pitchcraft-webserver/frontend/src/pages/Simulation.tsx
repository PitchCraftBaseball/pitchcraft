import { useEffect, useMemo, useState } from "react";
import { type Player, type PitchProbMap, type PieSlice, PredictResponse } from "../types";
import { TEAMS, PITCH_TYPES, INNING_OPTIONS, formatPitchType, getPitcherArsenal } from "../shared";
import {
  Button,
  FormControl,
  FormLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import PlayerComboBox from "../components/PlayerComboBox";
import ModelGateway from "../modelGateway";
import ProbabilityPieChart from "../components/ProbabilityPieChart";

type TeamId = number | "";

type ChartEntry = {
  pitchIndex: number;
  pitchType: string;
  ballsAfter: number;
  strikesAfter: number;
  data: PieSlice[];
};

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
  const [batScore, setBatScore] = useState("0");
  const [pitchScore, setPitchScore] = useState("0");
  const [prevPitchType, setPrevPitchType] = useState("FF");

  // Output
  const [respText, setRespText] = useState("");
  const [modelOutput, setModelOutput] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const model = new ModelGateway();

  // When team changes, clear the player selection too
  function handleBatTeamChange(teamId: TeamId) {
    setBatTeamId(teamId);
    setBatter(null);
  }

  function handlePitchTeamChange(teamId: TeamId) {
    setPitchTeamId(teamId);
    setPitcher(null);
  }

  const availablePitchTypes = useMemo(() => {
    if (!pitcher) return PITCH_TYPES as unknown as string[];
    const arsenal = getPitcherArsenal(pitcher.id);
    return arsenal.length > 0 ? arsenal : PITCH_TYPES as unknown as string[];
  }, [pitcher]);

  const batterLabel = useMemo(() => {
    return batter ? `${batter.use_first_name} ${batter.use_last_name}` : "";
  }, [batter]);

  const pitcherLabel = useMemo(() => {
    return pitcher ? `${pitcher.use_first_name} ${pitcher.use_last_name}` : "";
  }, [pitcher]);

  // Reset prev pitch type if selected pitcher doesn't throw it
  useEffect(() => {
    if (!availablePitchTypes.includes(prevPitchType)) {
      setPrevPitchType(availablePitchTypes[0]);
    }
  }, [availablePitchTypes]);

  function buildBody() {
    return {
      year: "2025", 
      strategy: "argmax",
      pitcher: String(pitcher?.id ?? ""),
      pitcherFeatures: ["p_throws"],
      batter: String(batter?.id ?? ""),
      batterFeatures: ["stand"],
      countState: `${balls}-${strikes}`,
      previousPitchType: prevPitchType,
      balls,
      strikes,
      outs,
      inning,
      inningTopBot: inningHalf === "top" ? "Top" : "Bottom",
      scoreDifference: (parseInt(batScore) || 0) - (parseInt(pitchScore) || 0),
      on1b: runnersOn.includes("1B") ? 1 : 0,
      on2b: runnersOn.includes("2B") ? 1 : 0,
      on3b: runnersOn.includes("3B") ? 1 : 0,
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
    setModelOutput(null);
    setRespText("");

    setLoading(true);
    const response = await model.run(buildBody());

    if (response.success) {
      const payload = response.payload!;
      setModelOutput(payload);
    }

    setRespText(response.text);
    setLoading(false);
  }

  const charts = [];
  if (modelOutput) {
    for (let i = 0; i < Math.min(modelOutput.sequence.length, 4); i++) {
      const step = modelOutput.sequence[i];
      charts.push(<ProbabilityPieChart size={260} data={{
        pitchIndex: step.pitch_index,
        pitchType: step.pitch_type,
        ballsAfter: step.balls_after,
        strikesAfter: step.strikes_after,
        data: step.rnn_pitch_probs
      }} />);
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
              alreadySelected={new Set()}
              onChange={setBatter}
            />
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitcher</FormLabel>
            <PlayerComboBox
              teamId={pitchTeamId}
              batters={false}
              value={pitcher}
              alreadySelected={new Set()}
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
                <MenuItem key={n} value={n}>{n === 10 ? "10+" : n}</MenuItem>
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
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d+$/.test(v)) setBatScore(v);
              }}
              onBlur={() => setBatScore(String(Math.max(0, parseInt(batScore) || 0)))}
              inputProps={{ min: 0 }}
            />
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Pitch Score</FormLabel>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={pitchScore}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d+$/.test(v)) setPitchScore(v);
              }}
              onBlur={() => setPitchScore(String(Math.max(0, parseInt(pitchScore) || 0)))}
              inputProps={{ min: 0 }}
            />
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.5 }}>Previous pitch type</FormLabel>
            <Select value={prevPitchType} onChange={(e) => setPrevPitchType(String(e.target.value))}>
              {availablePitchTypes.map((pt) => (
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

        {charts.length > 0 && (
          <Box sx={{ my: 1 }}>
            <Grid container columnSpacing={2} rowSpacing={2} alignItems="stretch">
              {charts}
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 1 }}>
          <TextField
            label="Response"
            value={respText}
            minRows={6}
            fullWidth
            multiline
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          <b>Selected:</b> batter={batterLabel} pitcher={pitcherLabel}
        </Typography>

      </Stack>
    </Paper>
  );
}
