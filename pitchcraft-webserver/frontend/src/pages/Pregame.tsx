import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
    Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import PlayerComboBox from "../components/PlayerComboBox";
import { Player } from "../types";
import PreGameBatter from "../components/PreGameBatter";

export default function Pregame() {
  const navigate = useNavigate();
  const state = useLocation().state;
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());

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
    batters.push(<PlayerComboBox
                   value={players[i]}
                   teamId={battingTeam}
                   batters={true}
                   alreadySelected={selectedPlayers}
                   onChange={(newValue) => { updatePlayer(i, newValue!) }}
                   key={"batter" + i}
                 />);
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
            Pitcher Profile
          </Typography>
          <Typography>
            TODO
          </Typography>
        </Paper>
        {reports}
      </Grid>
    </Grid>
  </Paper>
}
