import { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { Player } from "../types";

// Fetches batters or pitchers for a given teamId.
// Returns an empty array on error so the combo box just shows nothing.
async function fetchPlayers(teamId: number, batters: boolean): Promise<Player[]> {
  const endpoint = batters
    ? `/api/teams/${teamId}/batters`
    : `/api/teams/${teamId}/pitchers`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    console.error(`Failed to fetch players for team ${teamId}: ${response.status}`);
    return [];
  }
  return (await response.json()) as Player[];
}

interface PlayerComboBoxProps {
  teamId: number | "";
  batters: boolean;
  value: Player | null;
  onChange: (player: Player | null) => void;
}

export default function PlayerComboBox({ teamId, batters, value, onChange }: PlayerComboBoxProps) {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Clear the list whenever the team changes
    setPlayers([]);

    if (!teamId) return;

    let cancelled = false;

    fetchPlayers(teamId, batters).then((result) => {
      if (!cancelled) {
        setPlayers(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [teamId, batters]);

  return (
    <Autocomplete
      value={value}
      onChange={(_event, newValue) => onChange(newValue)}
      options={players}
      getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
      getOptionKey={(option) => String(option.id)}
      disabled={!teamId}
      renderInput={(params) => (
        <TextField
          {...params}
          label={batters ? "Select Batter" : "Select Pitcher"}
          variant="standard"
          placeholder={teamId ? "Search…" : "Select a team first…"}
        />
      )}
    />
  );
}
