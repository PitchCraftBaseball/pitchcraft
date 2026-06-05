import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { AppBar, Box, Container, CssBaseline, IconButton, Modal, Toolbar, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material";
import { useState } from "react";
import Guide from "./Guide";
import { boxStyle } from "../shared";
import CloseIcon from "@mui/icons-material/Close";

export default function Navbar() {
  const [openGuide, setOpenGuide] = useState(false);

  return (
    <AppBar position="sticky" elevation={0} sx={{
      backdropFilter: "blur(8px)",
      backgroundColor: (theme) => alpha(theme.palette.background.default, 0.6),
      borderBottom: 1,
      borderColor: (theme) => alpha(theme.palette.divider, 0.3),
      mb: 2,
      displayPrint: "none"
    }}>
      <CssBaseline />
        <Container>
        <Toolbar disableGutters>
          <Box component="a" href="/" sx={{ display: "flex", flexDirection: "row", color: "inherit", textDecoration: "none" }}>
            <Box component="img" sx={{ height:"32px" }} src="crystal.png" />
            <Typography variant="h6" sx={{ ml: 1 }}>PitchCraft</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="User Guide" placement="left">
            <IconButton onClick={() => setOpenGuide(true)} sx={{ color: "primary.contrastText" }} >
              <HelpOutlineOutlined />
            </IconButton>
          </Tooltip>
        </Toolbar>
        </Container>
        <Modal open={openGuide}>
          <Box sx={boxStyle}>
            <IconButton
              data-testid="close-user-guide"
              onClick={() => setOpenGuide(false)}
            >
              <CloseIcon />
            </IconButton>
            <Guide />
          </Box>
        </Modal>
    </AppBar>
  );
}
