import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { AppBar, Container, CssBaseline, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import { useNavigate } from "react-router";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky">
      <CssBaseline />
        <Container>
        <Toolbar disableGutters>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "inherit", textDecoration: "none" }} component="a" href="/">PitchCraft</Typography>
          <Tooltip title="User Guide" placement="left">
            <IconButton onClick={() => navigate("/guide")} sx={{ color: "primary.contrastText" }} >
              <HelpOutlineOutlined />
            </IconButton>
          </Tooltip>
        </Toolbar>
        </Container>
    </AppBar>
  );
}
