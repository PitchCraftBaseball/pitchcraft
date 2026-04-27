import { PredictResponse } from "./types";

interface ModelParameters {
  year: string,
  strategy: string,
  pitcher: string,
  pitcherFeatures: string[],
  batter: string,
  batterFeatures: string[],
  countState: string,
  previousPitchType: string,
  balls: number,
  strikes: number,
  outs: number,
  inning: number,
  inningTopBot: string,
  scoreDifference: number
  on1b: number,
  on2b: number,
  on3b: number,
}

export default class ModelGateway {
  public async run(parameters: ModelParameters): Promise<{ success: boolean, text: string, payload?: PredictResponse }> {
    const body = {
      year: parameters.year,
      strategy: parameters.strategy,
      pitcher: parameters.pitcher,
      pitcher_features: parameters.pitcherFeatures,
      batter: parameters.batter,
      batter_features: parameters.batterFeatures,
      state_features: {
        inning: parameters.inning,
        inning_topbot: parameters.inningTopBot,
        count_state: parameters.countState,
        prev_pitch_type: parameters.previousPitchType,
        balls: parameters.balls,
        strikes: parameters.strikes,
        outs_when_up: parameters.outs,
        bat_score_diff: parameters.scoreDifference,
        on_1b: parameters.on1b,
        on_2b: parameters.on2b,
        on_3b: parameters.on3b,
      }
    }

    console.log("Request body:", body);
    try {
      const r = await fetch("/api/model/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await r.text();
      if (!r.ok) {
        return {
          success: false,
          text: this.pretty(text || `Request failed (${r.status})`)
        }
      }

      console.log("Response body:\n", this.pretty(text));
      return {
        success: true,
        text: this.pretty(text),
        payload: JSON.parse(text) as PredictResponse
      };
    } catch (e) {
      return {
        success: false,
        text: e instanceof Error ? e.message : String(e)
      };
    }
  }

  private  pretty(j: string): string {
    try {
      return JSON.stringify(JSON.parse(j), null, 2);
    } catch {
      return j;
    }
  }
}
