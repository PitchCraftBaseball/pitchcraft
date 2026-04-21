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

  function updateRoster(playerIndex: number, player: Player) {
    state.players[playerIndex] = player;
    const temp = [...players];
    temp[playerIndex] = player;
    setPlayers(temp);
  }

  useEffect(() => {
    if (!state || !("players" in state)) {
      navigate("/");
    } else {
      setPlayers(state.players);
    }
  });

  if (players.length == 0) {
    return;
  }

  let pitchingTeam = players[0].team_id;
  let battingTeam = players[1].team_id;

  const reports = [];
  for (let i = 1; i < players.length; i++) {
    reports.push(<PreGameBatter pitcher={players[0]} batter={players[i]} key={"report" + i} />);
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
        <PlayerComboBox value={players[0]} teamId={pitchingTeam} batters={false} onChange={(newValue) => { updateRoster(0, newValue!) }}/>
        <Divider />
        <Typography>
          Batters
        </Typography>
        <PlayerComboBox value={players[1]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(1, newValue!) }}/>
        <PlayerComboBox value={players[2]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(2, newValue!) }}/>
        <PlayerComboBox value={players[3]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(3, newValue!) }}/>
        <PlayerComboBox value={players[4]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(4, newValue!) }}/>
        <PlayerComboBox value={players[5]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(5, newValue!) }}/>
        <PlayerComboBox value={players[6]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(6, newValue!) }}/>
        <PlayerComboBox value={players[7]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(7, newValue!) }}/>
        <PlayerComboBox value={players[8]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(8, newValue!) }}/>
        <PlayerComboBox value={players[9]} teamId={battingTeam} batters={true} onChange={(newValue) => { updateRoster(9, newValue!) }}/>
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
