import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
    Chip,
    Divider,
  FormControl,
  FormLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import PlayerComboBox from "../components/PlayerComboBox";
import { Player } from "../types";
import PreGameBatter from "../components/PreGameBatter";
import pitchArsenal from "../data/pitch_arsenal.json";
import pitchColors from "../data/pitch_colors.json";
import { ArsenalEntry, Colors, formatPitchType } from "../shared";

type OutType = "default" | "ground" | "fly" | "strike";

export default function Pregame() {
  const navigate = useNavigate();
  const state = useLocation().state;
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [outTypes, setOutTypes] = useState<OutType[]>(Array(9).fill("default"));

  function updatePlayer(index: number, player: Player) {
    const oldPlayer = players[index];
    state.players[index] = player;

    const temp = [...players];
    temp[index] = player;
    setPlayers(temp);

    const tempSelected = selectedPlayers;
    tempSelected.delete(oldPlayer.id);
    tempSelected.add(player.id);
    setSelectedPlayers(tempSelected);
  }

  function updateOutTypes(index: number, outType: OutType) {
    const temp = [...outTypes];
    temp[index] = outType;
    setOutTypes(temp);
  }

  useEffect(() => {
    if (!state || !("players" in state)) {
      navigate("/");
    } else if (players.length == 0) {
      setPlayers(state.players);
      setSelectedPlayers(new Set(state.players.map((player: Player) => player.id)));
    }
  });

  if (players.length == 0) {
    return;
  }

  let pitchingTeam = players[0].team_id;
  let battingTeam = players[1].team_id;

  const reports = [];
  const batters = [];
  for (let i = 1; i < players.length; i++) {
    reports.push(<PreGameBatter pitcher={players[0]} batter={players[i]} key={"report" + i} />);
    batters.push(
      <div key={"batterDiv" + i}>
        <PlayerComboBox
          value={players[i]}
          teamId={battingTeam}
          batters={true}
          alreadySelected={selectedPlayers}
          onChange={(newValue) => { updatePlayer(i, newValue!) }}
          key={"batter" + i}
        />
          <FormControl fullWidth size="small" sx={{ flex: 1 }}>
            <Select value={outTypes[i-1]} onChange={(e) => updateOutTypes(i-1, e.target.value)}>
              <MenuItem value="default">Default</MenuItem>
              <MenuItem value="ground">Groundout</MenuItem>
              <MenuItem value="fly">Flyout</MenuItem>
              <MenuItem value="strike">Strikeout</MenuItem>
            </Select>
          </FormControl>
        </div>
    );
  }

  let arsenal = [];
  let pitcherProfileError;
  const entry = (pitchArsenal as Record<string, ArsenalEntry>)[players[0].id];
  const year = entry["2025"] ?? entry["2024"];
  if (year) {
    const keys = Object.keys(year.pitch_type_percentage);
    for (let i = 0; i < keys.length; i++) {
      const color = (pitchColors as Colors)[keys[i]].color;
      arsenal.push(
        <Stack direction="column" spacing={1} key={"pitcherArsenalStack" + i}>
          <Chip size="small" sx={{ bgcolor: color, color: color, userSelect: "none" }} />
          <Typography align="center">
            {formatPitchType(keys[i]) + ": " + (year.pitch_type_percentage[keys[i]] * 100).toFixed(2) + "%"}
          </Typography>
        </Stack>);
    }
  } else {
    pitcherProfileError = <Typography>Could not load pitcher profile.</Typography>;
  }

  return <Paper sx={{ p: 2 }}>
    <Grid container spacing={2}>
      <Grid size={3}>
        <Typography variant="h5">
          Roster
        </Typography>
        <Divider />
        <Typography>
          Pitcher
        </Typography>
        <PlayerComboBox
          value={players[0]}
          teamId={pitchingTeam}
          batters={false}
          alreadySelected={selectedPlayers}
          onChange={(newValue) => { updatePlayer(0, newValue!) }}
        />
        <Divider />
        <Typography>
          Batters
        </Typography>
        {batters}
      </Grid>
      <Grid size="grow">
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5">
            {players[0].use_first_name} {players[0].use_last_name} Profile
          </Typography>
          {pitcherProfileError}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {arsenal}
          </Stack>
        </Paper>
        {reports}
      </Grid>
    </Grid>
  </Paper>
}
