import { cache, useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import Player from "../types";

const lookUpPlayers = cache(async (teamId: number, batters: bool): Player[] => {
  const response = await fetch(`api/players/${batters ? "batters" : "pitchers"}?teamId=${teamId}`);

  if (!response.ok) {
    return;
  }

  return (await response.json()) as Player[];
});

export default function PlayerComboBox({ teamId, batters, value, onChange }) {
    const [players, setPlayers] = useState([]);
  useEffect(() => {
    let ignore = false;
    setPlayers([]);
    lookUpPlayers(teamId, batters).then(result => {
      if (!ignore) {
        setPlayers(result);
      }
    });

    return () => {
      ignore = true;
    }
  }, []);

  return (<Autocomplete
    value={value}
    onChange={onChange}
    options={players}
    getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
    getOptionKey={(option) => option.id}
    renderInput={(params) => (
      <TextField {...params} label={batters ? "Select Batter" : "Select Pitcher"} variant="standard" />
    )}
  />);
}
