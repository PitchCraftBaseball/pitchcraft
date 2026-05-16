import { PieChart } from "@mui/x-charts";
import { PieSlice, PitchProbMap } from "../types";
import { Colors, formatPitchType } from "../shared";
import { Paper, styled, Typography } from "@mui/material";
import pitchColors from "../data/pitch_colors.json";


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
        color: (pitchColors as Colors)[code].color
      }));
    }

    // More than 5: top 4 + other bucket
    const top4 = positive.slice(0, 4);
    const rest = positive.slice(4);
    const otherValue = rest.reduce((sum, [, p]) => sum + p, 0);


    const slices: PieSlice[] = top4.map(([code, value]) => ({
      id: code,
      label: (location) => location === "legend" ? code : formatPitchType(code),
      value,
      color: (pitchColors as Colors)[code].color
    }));
    slices.push({ id: "__other__", label: "Other", value: otherValue, color: "gray" });
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

function ProbabilityPieChartLogic({ size, data, ...props }: ProbabilityPieChartProps) {
  if (!data) {
    return;
  }

  const pieSlices = buildPieData(data.data);
  console.log(pieSlices);
  const printReport = [];
  for (let i = 0; i < pieSlices.length; i++) {
    printReport.push(
      <Typography key={"printReport" + i} sx={{ display: "none", displayPrint: "block" }}>
        {pieSlices[i].id == "__other__" ? "Other" : formatPitchType(pieSlices[i].id)}: {(pieSlices[i].value * 100).toFixed(2)}%
      </Typography>
    );
  }

  return <Paper sx={{ p: 2, width: "100%" }} {...props}>
    <Typography variant="subtitle1" sx={{ mb: 1 }}>
      Pitch {data.pitchIndex}: {formatPitchType(data.pitchType)}<br />Count: {data.ballsAfter}-{data.strikesAfter}
    </Typography>
    <PieChart
      sx={{ displayPrint: "none" }}
      height={size}
      series={[
        {
          data: pieSlices,
          valueFormatter: (item) => `${(item.value * 100).toFixed(1)}%`,
        },
      ]}
      slotProps={{
        legend: {
          direction: "horizontal",
          position: { vertical: "bottom", horizontal: "center" }
        }
      }}
    />
    {printReport}
  </Paper>;
}

const ProbabilityPieChart = styled(ProbabilityPieChartLogic)``;
export default ProbabilityPieChart;
