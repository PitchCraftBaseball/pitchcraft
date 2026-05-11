import { useNavigate } from "react-router";
import { Box, Button, Container } from "@mui/material";
import GameScheduleTable from "../components/GameScheduleTable";

export default function Home() {
  const navigate = useNavigate();

  return <Container>
    <Box display="flex" justifyContent="center" alignItems="center">
    <Button variant="contained" sx={{ p: 2, width: "30%" }} onClick={() => navigate("/simulation")}>Simulate Matchup</Button>
    </Box>
    <br />
    <div className="page">
      <GameScheduleTable />
    </div>
  </Container>
}
