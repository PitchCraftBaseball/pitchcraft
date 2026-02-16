import { AppBar, Box, Toolbar, Typography } from "@mui/material";

export default function Navbar() {
  return (
    <Box sx={{ flexGrow: 1}}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "inherit", textDecoration: "none" }} component="a" href="/">PitchCraft</Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
