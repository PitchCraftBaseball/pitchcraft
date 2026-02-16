import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

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
export default function GameScheduleTable() { 
  const [gameDate, setGameDate] = useState<Dayjs | null>(dayjs());
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);

  const fetchSchedule = async (date: Dayjs | null) => {
    if (date === null) { 
      return; 
    }
    setGameDate(date);
    const response = await fetch(
      `api/schedule/date?date=${encodeURIComponent(date.toISOString())}`
    );

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as ScheduleRow[];
    setScheduleRows(data);
  };
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
                  {dayjs(row.game_datetime).format("YYYY-MM-DD HH:mm")}
                </TableCell>
                <TableCell>{row.away_team}</TableCell>
                <TableCell>{row.home_team}</TableCell>
                <TableCell>{row.venue_name}</TableCell>
                <TableCell>{row.summary}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </div>
  );
}