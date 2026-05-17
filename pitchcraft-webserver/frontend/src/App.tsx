import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Simulation from "./pages/Simulation";
import Pregame from "./pages/Pregame";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import Guide from "./pages/Guide";

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          colorScheme: "dark",
          "& *::-webkit-scrollbar-button": {
            display: "none"
          },
          "& *::-webkit-scrollbar-thumb": {
            backgroundColor: "#c2b8e6",
            borderRadius: "10px",
            border: "2px solid transparent",
            backgroundClip: "content-box"
          },
          "& *::-webkit-scrollbar": {
            backgroundColor: "transparent",
            width: "8px",
            height: "8px"
          },
          "& *::-webkit-scrollbar-button:single-button:vertical:decrement": {
            height: "16px",
            display: "block",
            background: "transparent",
          },
          "& *::-webkit-scrollbar-button:single-button:vertical:increment": {
            height: "16px",
            display: "block",
            background: "transparent",
          },
        },
        "@media print": {
          body: {
            color: "#000 !important",
          },
          ".MuiTypography-root": {
            color: "#000 !important"
          },
        },
      }
    },
    MuiModal: {
      defaultProps: {
        sx: {
          borderRadius: 9
        }
      }
    },
    MuiAlert: {
      defaultProps: {
        variant: "outlined"
      }
    }
  },
  typography: {
    fontFamily: "Sen"
  },
  shadows: Array(25).fill("none"),
  palette: {
    mode: "dark",
    background: {
      default: "#0e0a1a",
      paper: "#140f26",
    },
    primary: {
      main: "#6655be",
    },
    divider: "#c2b8e6",
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
          <Route path="/guide" element={<Guide />} />
          <Route path="*" element={<p>404</p>} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}
