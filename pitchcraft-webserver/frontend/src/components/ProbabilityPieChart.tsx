import { PieChart } from "@mui/x-charts";
import { PieSlice, PitchProbMap } from "../types";
import { formatPitchType } from "../shared";
import { Paper, Typography } from "@mui/material";


function buildPieData(probabilities: PitchProbMap): PieSlice[] {
    const positive = Object.entries(probabilities)
      .filter(([, p]) => p > 0)
      .sort((a, b) => b[1] - a[1]);

    // 5 or fewer: show all
    if (positive.length <= 5) {
      return positive.map(([code, value]) => ({
        id: code,
        label: formatPitchType(code),
        value,
      }));
    }

    // More than 5: top 4 + other bucket
    const top4 = positive.slice(0, 4);
    const rest = positive.slice(4);
    const otherValue = rest.reduce((sum, [, p]) => sum + p, 0);

    const slices: PieSlice[] = top4.map(([code, value]) => ({
      id: code,
      label: formatPitchType(code),
      value,
    }));
    slices.push({ id: "__other__", label: "Other", value: otherValue });
    return slices;
}

interface PieData {
  pitchIndex: number,
  pitchType: string,
  ballsAfter: number,
  strikesAfter: number,
  data: PitchProbMap
}

interface ProbabilityPieChartProps {
  size: number,
  data?: PieData
}

export default function ProbabilityPieChart({ size, data }: ProbabilityPieChartProps) {
  if (!data) {
    return;
  }

  return <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
    <Typography variant="subtitle1" sx={{ mb: 1 }}>
      Pitch {data.pitchIndex}: {formatPitchType(data.pitchType)} (Count: {data.ballsAfter}-{data.strikesAfter})
    </Typography>
    <PieChart
      height={size}
      series = {[
        {
          data: buildPieData(data.data),
          valueFormatter: (item) => `${(item.value * 100).toFixed(1)}%`,
        },
      ]}
    />
  </Paper>;
}
