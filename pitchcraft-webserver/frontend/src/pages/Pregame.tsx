import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

export default function Pregame() {
  const navigate = useNavigate();
  const state = useLocation().state;

  useEffect(() => {
    if (!state) {
      navigate("/");
    }
  });

  return <div>
    <p>{state.players[0].id}</p>
    <p>{state.players[1].id}</p>
    <p>{state.players[2].id}</p>
    <p>{state.players[3].id}</p>
    <p>{state.players[4].id}</p>
    <p>{state.players[5].id}</p>
    <p>{state.players[6].id}</p>
    <p>{state.players[7].id}</p>
    <p>{state.players[8].id}</p>
    <p>{state.players[9].id}</p>
  </div>
}
