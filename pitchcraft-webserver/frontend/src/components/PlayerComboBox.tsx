import { useEffect, useState } from "react";
import { Autocomplete, styled, TextField } from "@mui/material";
import type { Player } from "../types";

// Fetches batters or pitchers for a given teamId.
// Returns an empty array on error so the combo box just shows nothing.
async function fetchPlayers(teamId: number, batters: boolean): Promise<Player[]> {
  const endpoint = batters
    ? `/api/players/batters?teamId=${teamId}`
    : `/api/players/pitchers?teamId=${teamId}`;

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
  alreadySelected: Set<number>;
  label: string;
}

function PlayerComboBoxLogic({ teamId, batters, value, onChange, alreadySelected, label, ...props }: PlayerComboBoxProps) {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setPlayers([]);

    if (!teamId) return;

    // Prevents a stale fetch from an old teamId from overwriting a newer result.
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
      value={value!}
      onChange={(_event, newValue) => onChange(newValue)}
      options={players}
      getOptionLabel={(option) => `${option.use_first_name} ${option.use_last_name}`}
      getOptionKey={(option) => String(option.id)}
      getOptionDisabled={(option) => alreadySelected.has(option.id)}
      isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
      disabled={!teamId}
      disableClearable={true}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          placeholder={teamId ? "Search…" : "Select a team first…"}
        />
      )}
      {...props}
    />
  );
}

const PlayerComboBox = styled(PlayerComboBoxLogic)``;
export default PlayerComboBox;
