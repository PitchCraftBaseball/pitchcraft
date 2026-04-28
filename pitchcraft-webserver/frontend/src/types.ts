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
export type PieSlice = { id: string; value: number; label: string, color: string };

export type OutTypeProbs = {
  p_none: number;
  p_so: number;
  p_go: number;
  p_fo: number;
  p_hhfb: number;
};

export interface SequenceStep {
  pitch_index: number;
  pitch_type: string;
  rnn_pitch_probs: PitchProbMap;
  p_strike: number;
  p_ball: number;
  out_type_probs: OutTypeProbs;
  transition_event: string;
  out_type_event: string;
  balls_after: number;
  strikes_after: number;
  terminal: boolean;
  outcome: string | null;
}

export type PredictResponse = {
  outcome: string;
  pitch_count: number;
  sequence: SequenceStep[];
};
