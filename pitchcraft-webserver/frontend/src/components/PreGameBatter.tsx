import { Box, Stack, styled, Typography } from "@mui/material";
import { Player, PredictResponse } from "../types";
import ModelGateway from "../modelGateway";
import { useEffect, useState } from "react";
import ProbabilityPieChart from "./ProbabilityPieChart";

interface PreGameBatterProps {
  pitcher: Player,
  batter: Player,
  outType: string,
}

function PreGameBatterLogic({ pitcher, batter, outType, ...props }: PreGameBatterProps) {
  const model = new ModelGateway();
  const [loading, setLoading] = useState(true);
  const [modelOutput, setModelOutput] = useState<PredictResponse | undefined>();
  const [error, setError] = useState("");

  // Maps UI option strings to the model's preferred_out_type param; null means let the model decide.
  const OUT_TYPE_MAP: Record<string, string | null> = {
    default: null,
    ground: "groundout",
    fly: "flyout",
    strike: "strikeout",
  };

  function buildBody() {
    return {
      year: "2025",
      strategy: outType === "default" ? "argmax" : "preferred",
      pitcher: String(pitcher?.id ?? ""),
      pitcherFeatures: ["p_throws"],
      batter: String(batter?.id ?? ""),
      batterFeatures: ["stand"],
      countState: `0-0`,
      previousPitchType: "START",
      balls: 0,
      strikes: 0,
      outs: 0,
      inning: 1,
      inningTopBot: "Top",
      scoreDifference: 0,
      on1b: 0,
      on2b: 0,
      on3b: 0,
      preferredOutType: OUT_TYPE_MAP[outType] ?? null,
    };
  }
  
  async function run() {
    setLoading(true);
    if (!pitcher || !batter) {
      setError("Invalid pitcher/batter");
      return;
    }

    const response = await model.run(buildBody());
    if (response.success) {
      const payload = response.payload!;
      setModelOutput(payload);
    } else {
      setError(response.text);
      console.log(response.text);
    }
    setLoading(false);
  }

  // Re-run the prediction whenever the matchup or preferred out type changes.
  useEffect(() => {
    run();
  }, [pitcher, batter, outType]);

  let output;
  if (loading) {
    output = <Typography>Loading...</Typography>;
  } else if (modelOutput) {
    const charts = [];
    for (let i = 0; i < modelOutput.sequence.length; i++) {
      const step = modelOutput.sequence[i];
      charts.push(<ProbabilityPieChart key={"chart" + i} sx={{ minWidth: "192px", "@media print": { flex: "1" } }} size={128} data={{
        pitchIndex: step.pitch_index,
        pitchType: step.pitch_type,
        ballsAfter: step.balls_after,
        strikesAfter: step.strikes_after,
        data: step.rnn_pitch_probs
      }} />);
    }
    output = <Stack direction={{ xs: "column", sm: "row" }} useFlexGap sx={{ overflowX: "auto", "@media print": { flexWrap: "wrap", overflowX: "visible" } }} spacing = {1}>
      {charts}
    </Stack>
  }

  const outcomeLabel = modelOutput
    ? modelOutput.outcome.charAt(0).toUpperCase() + modelOutput.outcome.slice(1)
    : null;

  return <Box {...props} sx={{ "@media print": { display: "block", breakInside: "avoid" }}}>
    <Typography variant="h5">
      {batter.use_first_name} {batter.use_last_name}
      {outcomeLabel && ` - ${outcomeLabel}`}
    </Typography>
    {output}
    {error && <Typography>error</Typography>}
  </Box>
}

const PreGameBatter = styled(PreGameBatterLogic)``;
export default PreGameBatter;
