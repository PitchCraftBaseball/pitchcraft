import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { alpha, Stack, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import { Box, Button, IconButton, Modal, Paper, Typography } from "@mui/material";
import PlayerComboBox from "../components/PlayerComboBox";
import { Player } from "../types";
import { TEAMS } from "../shared";
import CloseIcon from "@mui/icons-material/Close";
import Alert from '@mui/material/Alert';
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { SportsBaseball, SportsCricket } from "@mui/icons-material";

type ScheduleRow = {
  game_id: string;
  game_datetime: string;
  away_team: string;
  away_team_id: number;
  home_team: string;
  home_team_id: number;
  venue_id: number;
  venue_name: string;
};

dayjs.extend(utc);

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  maxHeight: "90vh",
  overflowY: "auto",
  backdropFilter: "blur(8px)",
  backgroundColor: (theme) => alpha(theme.palette.background.default, 0.6),
  borderRadius: 4,
  border: 1,
  borderColor: "divider",
  p: 2,
};

export default function GameScheduleTable() {
  const [gameDate, setGameDate] = useState<Dayjs | null>(dayjs());
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [open, setOpen] = useState(false);
  const [pitchingTeam, setPitchingTeam] = useState(0);
  const [battingTeam, setBattingTeam] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
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
      setSelectedPlayers(new Set(tempBatting.filter((player) => player != null).map((player) => player.id)));

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
    const oldPlayer = players[index];
    const temp = [...players];
    temp[index] = player;
    setPlayers(temp);
    if (player?.team_id === homeTeamId) {
      index === 0 ? setAwayLineupEdited(true) : setHomeLineupEdited(true);
    } else if (player?.team_id === awayTeamId) {
      index === 0 ? setHomeLineupEdited(true) : setAwayLineupEdited(true);
    }

    const tempSelected = selectedPlayers;
    if (oldPlayer) {
      tempSelected.delete(oldPlayer?.id);
    }
    if (player) {
      tempSelected.add(player?.id);
    }
    setSelectedPlayers(tempSelected);
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

  const batters = [];
  for (let i = 1; i < players.length; i++) {
    batters.push(<PlayerComboBox
                   sx={{ mt: 1 }}
                   value={players[i]}
                   teamId={battingTeam}
                   batters={true}
                   alreadySelected={selectedPlayers}
                   label={"Select Batter " + i}
                   onChange={(newValue) => { updatePlayer(i, newValue!) }}
                   key={"batter" + i}
                 />);
  }

  const onSwapClick = () => {
    const temp = pitchingTeam;
    setPitchingTeam(battingTeam);
    setBattingTeam(temp);

    const newBatting = [...otherSidePlayers];
    const newPitching = [...players];

    setPlayers(newBatting);
    setOtherSidePlayers(newPitching);
    setSelectedPlayers(new Set(newBatting.filter((player) => player != null).map((player) => player.id)));
  }

  const onClearClick = () => {
    setPlayers(Array(10).fill(null));
    setSelectedPlayers(new Set());
    battingTeam === homeTeamId ? setHomeLineupEdited(true) : setAwayLineupEdited(true);
  }

  useEffect(() => {
    fetchSchedule(gameDate);
  }, []);

  return (
    <Box>
      <Typography align="center" variant="h4">Schedule</Typography>

      <Stack direction="row" sx={{ mt: 2, alignItems: "center", justifyContent: "center" }}>
        <IconButton onClick={() => {
          const dayBefore = gameDate!.subtract(1, "day")
          setGameDate(dayBefore);
          fetchSchedule(dayBefore);
        } }>
          <ChevronLeft />
        </IconButton>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            sx={{ width: "30%", mx: 1 }}
            value={gameDate}
            slotProps={{ openPickerButton: { sx: { m: -1 } } }}
            onChange={e => fetchSchedule(e)}
          />
        </LocalizationProvider>
        <IconButton onClick={() => {
          const dayAfter = gameDate!.add(1, "day")
          setGameDate(dayAfter);
          fetchSchedule(dayAfter);
        } }>
          <ChevronRight />
        </IconButton>
      </Stack>

      {(scheduleRows.length > 0) ? (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small" padding="none" aria-label="schedule table">
            <TableBody>
              {scheduleRows.map(row => (
                <TableRow key={row.game_id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ pl: 1 }}>
                    {dayjs.utc(row.game_datetime).local().format("h:mm A")}
                  </TableCell>
                  <TableCell sx={{ textAlign: "right", pr: 0 }}>
                    {row.away_team}
                  </TableCell>
                  <TableCell sx={{ p: 0, width: "1%" }}>
                    <Stack direction="row" sx={{ p: 1 }}>
                      <Box
                        component="img"
                        sx={{
                          height:"32px",
                          filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 1))"
                        }}
                        src={"logos/" + row.away_team_id + ".png"}
                        onError={(e) => e.target.src = "crystal.png"}
                      />
                      <Typography sx={{ mx: 1 }} variant="h5">@</Typography>
                      <Box
                        component="img"
                        sx={{
                          height:"32px",
                          filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 1))"
                        }}
                        src={"logos/" + row.home_team_id + ".png"}
                        onError={(e) => e.target.src = "crystal.png"}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ pl: 0 }}>
                    {row.home_team}
                  </TableCell>
                  <TableCell sx={{ textAlign: "right", pr: 1 }}>{row.venue_name}</TableCell>
                  <TableCell padding="none" sx={{ textAlign: "right", width: "1%", whiteSpace: "nowrap" }}>
                    <Button variant="contained" loading={preGameLoadingId === row.game_id} onClick={() => openReportPopup(row)} sx={{ m: 1 }}>Open Pre-Game Report</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography align="center" sx={{ mt: 2 }}>No games were found for the selected date.</Typography>
      )}
      <Modal
        open={open}
        onClose={closeReportPopup}
      >
        <Box sx={style}>
          <IconButton
            aria-label="close pregame popup"
            onClick={(event) => closeReportPopup(event, "closeButtonClick")}
          >
            <CloseIcon />
          </IconButton>
          <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
            <Box flex={1} display="flex" justifyContent="center">
              <Stack direction="column" alignItems="center">
                <Box component="img" sx={{ height:"128px", width: "128px" }} src={"logos/" + getTeam(pitchingTeam)?.id + ".png"} onError={(e) => {
                  e.target.src = "crystal.png";
                }}/>
                <Stack direction="row" alignItems="center">
                  <SportsBaseball />
                  <Typography variant="h6" component="h2" sx={{ ml: 1 }}>{getTeam(pitchingTeam)?.name ?? "Unknown Team"}</Typography>
                </Stack>
              </Stack>
            </Box>
            <Button
              variant="contained"
              onClick={onSwapClick}
            >
              Swap Teams
            </Button>
            <Box flex={1} display="flex" justifyContent="center">
              <Stack direction="column" alignItems="center">
                <Box component="img" sx={{ height:"128px", width: "128px" }} src={"logos/" + getTeam(battingTeam)?.id + ".png"} onError={(e) => {
                  e.target.src = "crystal.png";
                }}/>
                <Stack direction="row" alignItems="center">
                  <SportsCricket />
                  <Typography variant="h6" component="h2" sx={{ ml: 1 }}>{getTeam(battingTeam)?.name ?? "Unknown Team"}</Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
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

          <Box display="flex" justifyContent="right" sx={{ mb: 1 }}>
            <Button
              variant="contained"
              color="error"
              onClick={onClearClick}
            >
              Clear
            </Button>
          </Box>
          <PlayerComboBox
            sx={{ mb: 3 }}
            value={players[0]}
            teamId={pitchingTeam}
            batters={false}
            alreadySelected={selectedPlayers}
            label={"Select Pitcher"}
            onChange={(newValue) => { updatePlayer(0, newValue) }}/>
          {batters}
          <Button sx={{ mt: 1 }} variant="contained" onClick={() => {
            navigate("/pregame", { state: { players: players } });
          }} disabled={players.filter(player => player != null).length != 10}>Continue</Button>
        </Box>
      </Modal>
    </Box>
  );
}
