import { Stack, Typography } from "@mui/material";
import { Player, PredictResponse } from "../types";
import ModelGateway from "../modelGateway";
import { useEffect, useState } from "react";
import ProbabilityPieChart from "./ProbabilityPieChart";

interface PreGameBatterProps {
  pitcher: Player,
  batter: Player
}

export default function PreGameBatter({ pitcher, batter }: PreGameBatterProps) {
  const model = new ModelGateway();
  const [loading, setLoading] = useState(true);
  const [modelOutput, setModelOutput] = useState<PredictResponse | undefined>();
  const [error, setError] = useState("");

  function buildBody() {
    return {
      year: "2025",
      strategy: "argmax",
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

  useEffect(() => {
    run();
  }, [pitcher, batter]);

  let output;
  if (loading) {
    output = <Typography>Loading...</Typography>;
  } else if (modelOutput) {
    const charts = [];
    for (let i = 0; i < Math.min(modelOutput.sequence.length, 4); i++) {
      const step = modelOutput.sequence[i];
      charts.push(<ProbabilityPieChart key={"chart" + i} size={100} data={{
        pitchIndex: step.pitch_index,
        pitchType: step.pitch_type,
        ballsAfter: step.balls_after,
        strikesAfter: step.strikes_after,
        data: step.rnn_pitch_probs
      }} />);
    }
    output = <Stack direction={{ xs: "column", sm: "row" }} spacing = {1}>
      {charts}
    </Stack>
  }

  return <div>
    <Typography variant="h5">
      {batter.first_name} {batter.last_name}
    </Typography>
    {output}
    {error && <Typography>error</Typography>}
  </div>
}
