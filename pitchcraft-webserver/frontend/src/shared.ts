// shared.ts
import { alpha } from "@mui/material";
import pitchArsenal from "./data/pitch_arsenal.json";

export type Team = { id: number; name: string };

// MLB Stats API team ids (sportId=1)
export const TEAMS: Team[] = [
  { id: 109, name: "Arizona Diamondbacks" },
  { id: 133, name: "Athletics" },
  { id: 144, name: "Atlanta Braves" },
  { id: 110, name: "Baltimore Orioles" },
  { id: 111, name: "Boston Red Sox" },
  { id: 112, name: "Chicago Cubs" },
  { id: 145, name: "Chicago White Sox" },
  { id: 113, name: "Cincinnati Reds" },
  { id: 114, name: "Cleveland Guardians" },
  { id: 115, name: "Colorado Rockies" },
  { id: 116, name: "Detroit Tigers" },
  { id: 117, name: "Houston Astros" },
  { id: 118, name: "Kansas City Royals" },
  { id: 108, name: "Los Angeles Angels" },
  { id: 119, name: "Los Angeles Dodgers" },
  { id: 146, name: "Miami Marlins" },
  { id: 158, name: "Milwaukee Brewers" },
  { id: 142, name: "Minnesota Twins" },
  { id: 121, name: "New York Mets" },
  { id: 147, name: "New York Yankees" },
  { id: 143, name: "Philadelphia Phillies" },
  { id: 134, name: "Pittsburgh Pirates" },
  { id: 135, name: "San Diego Padres" },
  { id: 137, name: "San Francisco Giants" },
  { id: 136, name: "Seattle Mariners" },
  { id: 138, name: "St. Louis Cardinals" },
  { id: 139, name: "Tampa Bay Rays" },
  { id: 140, name: "Texas Rangers" },
  { id: 141, name: "Toronto Blue Jays" },
  { id: 120, name: "Washington Nationals" },
];

export const PITCH_TYPES = [
  "SL",
  "FF",
  "FS",
  "SI",
  "ST",
  "CU",
  "KC",
  "FC",
  "CH",
  "FA",
  "SV",
  "OTHER",
  "EP",
  "FO",
] as const;

export const PITCH_TYPE_NAMES: Record<string, string> = {
  FF: "Four-seam Fastball",
  SI: "Sinker",
  FC: "Cutter",
  FS: "Splitter",
  CH: "Changeup",
  SL: "Slider",
  ST: "Sweeper",
  CU: "Curveball",
  KC: "Knuckle Curve",
  FO: "Forkball",
  EP: "Eephus",
  SV: "Screwball",
  FA: "Fastball",
  OTHER: "Other",
} as const;

export function formatPitchType(code: string): string {
  const name = PITCH_TYPE_NAMES[code];
  return name ? `${code} (${name})` : code;
}

export const INNING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type ArsenalEntry = { "2024"?: { pitch_type: Record<string, number>, pitch_type_percentage: Record<string, number> }; "2025"?: { pitch_type: Record<string, number>, pitch_type_percentage: Record<string, number> } };

export type Colors = {
  [Key: string]: { color: string, name: string }
}

export function getPitcherArsenal(playerId: string | number): string[] {
  const entry = (pitchArsenal as Record<string, ArsenalEntry>)[String(playerId)];
  if (!entry) return [];
  const year = entry["2025"] ?? entry["2024"];
  return year ? Object.keys(year.pitch_type) : [];
}

export const boxStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  maxHeight: "75%",
  overflowY: "auto",
  transform: "translate(-50%, -50%)",
  width: 800,
  backdropFilter: "blur(8px)",
  backgroundColor: (theme) => alpha(theme.palette.background.default, 0.6),
  borderRadius: 4,
  border: 1,
  borderColor: "divider",
  p: 2,
};
