import { useNavigate } from "react-router";
import { Button } from "@mui/material";
import GameScheduleTable from "../components/GameScheduleTable";

export default function Home() {
  const navigate = useNavigate();

  return <div>
    <Button variant="contained" onClick={() => navigate("/guide")}>User Guide</Button>
    <Button variant="contained" onClick={() => navigate("/simulation")}>Simulation</Button>
    <br />
    <div className="page">
      <h1>Pitchcraft</h1>

      <GameScheduleTable />
    </div>
  </div>
}
