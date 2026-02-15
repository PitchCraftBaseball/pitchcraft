import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PickerValue } from "@mui/x-date-pickers/internals";

export default function GameScheduleTable() { 
  const [gameDate, setGameDate] = useState<Dayjs | null>(dayjs());
  const [scheduleRows, setScheduleRows] = useState

  

  async function handleDateChange(e: Dayjs | null)  {
    setGameDate(e);
    // todo: trigger query again
    
    return;
  }

  return ( 
    <div className="schedule">
      <h2>Schedule</h2>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker 
          label="datepicker" 
          value={gameDate} 
          onChange={handleDateChange} 
        />
      </LocalizationProvider>

    </div>
  );
}