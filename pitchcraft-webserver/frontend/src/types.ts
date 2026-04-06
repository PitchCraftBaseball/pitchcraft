export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  team_id: number;
  position: string;
  batting_side: string;
  throwing_arm: string;
  use_first_name: string;
  use_last_name: string;
  height: number;
  weight: number;
  jersey_number: number;
}

export type TeamId = number | "";
export type PitchProbMap = Record<string, number>;
export type PieSlice = { id: string; value: number; label: string };
export type PredictResponse = { pitch_one: PitchProbMap };
