import { useNavigate } from "react-router";
import { Button } from "@mui/material";
import ModelOutputTest from "../ModelOutputTest";

export default function Home() {
  let navigate = useNavigate();

  return <div>
    <Button variant="contained" onClick={() => navigate("/guide")}>User Guide</Button>
    <Button variant="contained" onClick={() => navigate("/simulation")}>Simulation</Button>
    <br />
    <div className="page">
      <h1>Pitchcraft</h1>
      <p>
        API status:{" "}
        <strong>
          {status === "checking" ? "checking…" : status === "up" ? "UP" : "DOWN"}
        </strong>
      </p>

      <ModelOutputTest />
    </div>
  </div>
}