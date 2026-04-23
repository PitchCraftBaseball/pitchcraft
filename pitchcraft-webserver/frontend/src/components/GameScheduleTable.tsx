import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Box, Button, IconButton, Modal, Paper, Typography, CircularProgress } from "@mui/material";
import PlayerComboBox from "../components/PlayerComboBox";
import { Player } from "../types";
import { TEAMS } from "../shared";
import CloseIcon from "@mui/icons-material/Close";
import Alert from '@mui/material/Alert';

type ScheduleRow = {
  game_id: string;
  game_datetime: string;
  away_team: string;
  away_team_id: number;
  home_team: string;
  home_team_id: number;
  venue_id: number;
  venue_name: string;
  summary: string;
};

dayjs.extend(utc);

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function GameScheduleTable() { 
  const [gameDate, setGameDate] = useState<Dayjs | null>(dayjs());
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [open, setOpen] = useState(false);
  const [pitchingTeam, setPitchingTeam] = useState(0);
  const [battingTeam, setBattingTeam] = useState(0);
  const [players, setPlayers] = useState<(Player | null)[]>(Array(10).fill(null));
  const [otherSidePlayers, setOtherSidePlayers] = useState<(Player | null)[]>(Array(10).fill(null));
  const [preGameLoadingId, setPreGameLoadingId] = useState<string | null>(null); 
  const [homeLineupDate, setHomeLineupDate] = useState<string | null>(null);
  const [awayLineupDate, setAwayLineupDate] = useState<string | null>(null);
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  const [homeLineupEdited, setHomeLineupEdited] = useState(false);
  const [awayLineupEdited, setAwayLineupEdited] = useState(false);


  const navigate = useNavigate();

  const openReportPopup = async (row: ScheduleRow) => {
    setPreGameLoadingId(row.game_id);
    setPitchingTeam(row.home_team_id);
    setBattingTeam(row.away_team_id);
    setHomeTeamId(row.home_team_id);
    setAwayTeamId(row.away_team_id);

    let data;
    try {
      const response = await fetch(
        `/api/players/projected-lineup?gamePk=${row.game_id}`
      );
      if (!response.ok) {
        console.error(`Failed to fetch projected lineup for game ${row.game_id}: ${response.status}`);
      }

      data = await response.json();

      setHomeLineupDate(data.home.fromDate ? data.home.fromDate : null);
      setAwayLineupDate(data.away.fromDate ? data.away.fromDate : null);

      const tempBatting = [
        data.home.pitcher,
        ...data.away.batters
      ];
      setPlayers(tempBatting);
      
      const tempOther = [
        data.away.pitcher,
        ...data.home.batters
      ];
      setOtherSidePlayers(tempOther);
    } catch (err) {
      console.error('Fetch error:', err);
      setOpen(true);
      setPreGameLoadingId(null);
      return;
    }
    
    setOpen(true);
    setPreGameLoadingId(null);
  }

  const closeReportPopup = (_event: object, reason: any) => {
    if (reason != "backdropClick") {
      setPitchingTeam(0);
      setBattingTeam(0);
      setPlayers(Array(10).fill(null));
      setHomeLineupDate(null);
      setAwayLineupDate(null);
      setHomeTeamId(null);
      setAwayTeamId(null);
      setHomeLineupEdited(false);
      setAwayLineupEdited(false);
      setOpen(false);
    }
  }

  const updatePlayer = (index: number, player: Player | null) => {
    const temp = [...players];
    temp[index] = player;
    setPlayers(temp);
    if (player?.team_id === homeTeamId) {
      index === 0 ? setAwayLineupEdited(true) : setHomeLineupEdited(true);
    } else if (player?.team_id === awayTeamId) {
      index === 0 ? setHomeLineupEdited(true) : setAwayLineupEdited(true);
    }
  }

  const fetchSchedule = async (date: Dayjs | null) => {
    if (date === null) { 
      return; 
    }
    setGameDate(date);
    const dateString = date.format("YYYY-MM-DD");
    const tzOffsetMinutes = date.utcOffset();
    const response = await fetch(
      `api/schedule/date?date=${encodeURIComponent(dateString)}&tzOffsetMinutes=${encodeURIComponent(tzOffsetMinutes)}`
    );

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as ScheduleRow[];
    setScheduleRows(data);
  };

  const getTeam = (id: number) => {
    return TEAMS.find((x) => x.id == id);
  }

  const onSwapClick = () => {
    const temp = pitchingTeam;
    setPitchingTeam(battingTeam);
    setBattingTeam(temp);

    const newBatting = [...otherSidePlayers];
    const newPitching = [...players];

    setPlayers(newBatting);
    setOtherSidePlayers(newPitching);
    setPlayers(newBatting);
  }

  const onClearClick = () => {
    setPlayers(Array(10).fill(null));
    battingTeam === homeTeamId ? setHomeLineupEdited(true) : setAwayLineupEdited(true);
  }

  useEffect(() => {
    fetchSchedule(gameDate);
  }, []);

  return (
    <div className="schedule">
      <h2>Schedule</h2>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker 
          label="datepicker" 
          value={gameDate} 
          onChange={e => fetchSchedule(e)} 
        />
      </LocalizationProvider>

      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table size="small" aria-label="schedule table">
          <TableHead>
            <TableRow>
              <TableCell>Date/Time</TableCell>
              <TableCell>Away</TableCell>
              <TableCell>Home</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Summary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduleRows.map(row => (
              <TableRow key={row.game_id}>
                <TableCell>
                  {dayjs.utc(row.game_datetime).local().format("YYYY-MM-DD h:mm A")}
                </TableCell>
                <TableCell>{row.away_team}</TableCell>
                <TableCell>{row.home_team}</TableCell>
                <TableCell>{row.venue_name}</TableCell>
                <TableCell>{row.summary}</TableCell>
                <TableCell sx={{ textAlign: "center" }}>
                  {preGameLoadingId === row.game_id ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Button variant="contained" onClick={() => openReportPopup(row)}>Open Pre-Game Report</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Modal
        open={open}
        onClose={closeReportPopup}
      >
        <Box sx={style}>
          <IconButton 
            onClick={(event) => closeReportPopup(event, "closeButtonClick")}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" component="h2">Pitching: {getTeam(pitchingTeam)?.name ?? "Unknown Team"}</Typography>
          <Typography variant="h6" component="h2">Batting: {getTeam(battingTeam)?.name ?? "Unknown Team"}</Typography>
            {!homeLineupEdited && battingTeam === homeTeamId && homeLineupDate && (
              <Alert severity="info" sx={{ mb: 1 }}>
                {getTeam(battingTeam)?.name ?? "Home"} batting lineup autofilled from game on {dayjs(homeLineupDate).format("YYYY-MM-DD")}.
              </Alert>
            )}

            {!awayLineupEdited && battingTeam === awayTeamId && awayLineupDate && (
              <Alert severity="info" sx={{ mb: 1 }}>
                {getTeam(battingTeam)?.name ?? "Away"} batting lineup autofilled from game on {dayjs(awayLineupDate).format("YYYY-MM-DD")}.
              </Alert>
            )}
            
            {(
              (!homeLineupEdited && battingTeam === homeTeamId && !homeLineupDate) ||
              (!awayLineupEdited && battingTeam === awayTeamId && !awayLineupDate)
            ) && (
              <Alert severity="success" sx={{ mb: 1 }}>
                This lineup is the official posted lineup for this game.
              </Alert>
            )}

          <Box display="flex" justifyContent="space-between">
            <Button 
              variant="contained" 
              onClick={onSwapClick}
            >
              Swap Teams
            </Button>
            <Button 
              variant="contained"
              color="error"
              onClick={onClearClick}
            >
              Clear
            </Button>
          </Box>
          <PlayerComboBox value={players[0]} teamId={pitchingTeam} batters={false} onChange={(newValue) => { updatePlayer(0, newValue) }}/>
          <PlayerComboBox value={players[1]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(1, newValue) }}/>
          <PlayerComboBox value={players[2]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(2, newValue) }}/>
          <PlayerComboBox value={players[3]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(3, newValue) }}/>
          <PlayerComboBox value={players[4]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(4, newValue) }}/>
          <PlayerComboBox value={players[5]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(5, newValue) }}/>
          <PlayerComboBox value={players[6]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(6, newValue) }}/>
          <PlayerComboBox value={players[7]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(7, newValue) }}/>
          <PlayerComboBox value={players[8]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(8, newValue) }}/>
          <PlayerComboBox value={players[9]} teamId={battingTeam} batters={true} onChange={(newValue) => { updatePlayer(9, newValue) }}/>
          <Button variant="contained" onClick={() => {
            navigate("/pregame", { state: { players: players } });
          }} disabled={players.filter(player => player != null).length != 10}>Continue</Button>
        </Box>
      </Modal>
    </div>
  );
}
