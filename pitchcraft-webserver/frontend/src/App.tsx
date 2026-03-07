import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Simulation from "./pages/Simulation";
import Pregame from "./pages/Pregame";

export default function App() {
  return (
    <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/simulation" element={<Simulation />} />
      <Route path="/pregame" element={<Pregame />} />
      <Route path="*" element={<p>404</p>} />
    </Routes>
    </>
  );
}
