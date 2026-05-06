import { useNavigate } from "react-router";
import { Button, Container } from "@mui/material";
import GameScheduleTable from "../components/GameScheduleTable";

export default function Home() {
  const navigate = useNavigate();

  return <Container>
    <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => navigate("/simulation")}>Simulation</Button>
    <br />
    <div className="page">
      <GameScheduleTable />
    </div>
  </Container>
}
