export interface Player {
  id: number | string;
  first_name: string;
  last_name: string;
}
export type TeamId = number | "";
export type PitchProbMap = Record<string, number>;
export type PieSlice = { id: string; value: number; label: string };
export type PredictResponse = { pitch_one: PitchProbMap };