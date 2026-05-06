import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Simulation from "./pages/Simulation";
import Pregame from "./pages/Pregame";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import { red } from "@mui/material/colors";

const theme = createTheme({
  shadows: Array(25).fill("none"),
  palette: {
    primary: {
      main: red[500],
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Box>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/pregame" element={<Pregame />} />
          <Route path="*" element={<p>404</p>} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}
