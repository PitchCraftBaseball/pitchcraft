import { useNavigate } from "react-router";
import { Button } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function Home() {
  let navigate = useNavigate();

  return <div>
    <Button variant="contained" onClick={() => navigate("/guide")}>User Guide</Button>
    <Button variant="contained" onClick={() => navigate("/simulation")}>Simulation</Button>
    <br />
    {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        defaultValue={dayjs()}
        onChange={(newValue) => {
          setValue(newValue);
          console.log("Date changed: " + newValue);
        }
      }/>
    </LocalizationProvider> */}
  </div>
}
