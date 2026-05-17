import { Container, Typography } from "@mui/material";

export default function Guide() {
  return <Container>
    <Typography variant="h4">Overview</Typography>
    <Typography>
      PitchCraft is a tool that identifies optimal pitch sequencing strategies based on the matchup between a given MLB pitcher and batter.
      The two main modes of use available in PitchCraft are the <b>Model Simulation page</b> and the <b>Pre-Game Report page</b>.
      The <b>Model Simulation page</b> allows the user to view the recommended pitch sequence between a pitcher and batter during a specific game state.
      The <b>Pre-Game Report page</b> allows the user to view the set of recommended pitch sequences between one pitcher and nine of another team's batters, with a print-friendly format available.
      When viewing a recommended pitch pie chart, each pitch type has a unique color.
      The full name of each pitch type can be viewed by mousing over its respective slice of the pie chart.
    </Typography>
    <Typography variant="h4" sx={{ mt: 2 }}>Home Screen</Typography>
    <Typography>
      The home screen is the main landing page for PitchCraft.
      It can be returned to at any time by clicking on the <b>PitchCraft logo</b> in the top left corner of the screen.
      Both ways of using PitchCraft are available from the home screen.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Simulate Matchup Button</Typography>
    <Typography>
      This button will take the user to the <b>Model Simulation page</b>.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Game Schedule Table</Typography>
    <Typography>
      The game schedule table allows the user to select an MLB game to generate a Pre-Game Report for.
      The team on the <b>left</b> side of the @ sign is the <b>away</b> team, and the team on the <b>right</b> side of the @ sign is the <b>home</b> team.
      The date being displayed can be adjusted using either the date picker or the left and right buttons on either side.
      The default date is the current date.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Open Pre-Game Report</Typography>
    <Typography>
      Once the desired game is found, the <b>Open Pre-Game Report</b> button can be pressed to open a roster confirmation pop-up.
      Within this pop-up, the user can choose which team is pitching and which team is batting.
      The list of players will be autofilled based on available data and can be adjusted from this pop-up.
      If the official roster for the selected game has not been released, the roster will be filled based on data from previous games.
      If this occurs, please note that some players must be manually selected.
      When the list of players has been confirmed, press <b>Continue</b> to proceed to the <b>Pre-Game Report page</b>.
      This button will be unavailable if any of the player slots are not filled.
    </Typography>
    <Typography variant="h4" sx={{ mt: 2 }}>Model Simulation</Typography>
    <Typography>
      The <b>Model Simulation page</b> allows users to generate a pitch sequence between a pitcher and a batter given a specific game state.
      Once the desired game state is filled in, the user can press the <b>Get Pitch Sequence</b> button to generate the pitch sequence.
      The details of each available input field as are defined below.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Bat Team</Typography>
    <Typography>
      The team to choose the batter from.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Pitch Team</Typography>
    <Typography>
      The team to choose the pitcher from.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Batter</Typography>
    <Typography>
      The batter for the current simulation.
      Only batters from the <b>Bat Team</b>'s current active roster can be selected.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Pitcher</Typography>
    <Typography>
      The pitcher for the current simulation.
      Only pitchers from the <b>Pitch Team</b>'s current active roster can be selected.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Balls</Typography>
    <Typography>
      The number of pitches in the current plate appearance counted as balls.
      A ball occurs when the pitcher throws a pitch outside of the strike zone (a rectangle of space defined in front of the batter) and the batter does not swing.
      If the batter receives 4 balls, they are allowed to walk to first base.
      A higher number of balls is more favorable for the batter.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Strikes</Typography>
    <Typography>
      The number of pitches in the current plate appearance counted as strikes.
      A strike occurs when the pitcher throws a pitch inside the strike zone and the batter does not swing or if the batter swings at a pitch and misses.
      If the batter receives 3 strikes, they will strikeout and their plate appearance ends.
      A higher number of strikes is more favorable for the pitcher.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Outs</Typography>
    <Typography>
      The number of players on the batting team that are out in the current inning.
      An out occurs if:
    </Typography>
    <ul>
      <li>The batter receives 3 strikes <b>(strikeout)</b></li>
      <li>The batter hits the ball and someone on the pitching team catches it before it hits the ground <b>(flyout)</b></li>
      <li>The batter hits the ball on the ground and someone on the pitching team touches the base the batter is going toward while holding the ball <b>(groundout)</b></li>
    </ul>
    <Typography>
      If the batting team receives 3 outs, the inning half ends and the teams switch roles.
      A higher number of outs is more favorable for the pitching team.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Runners On</Typography>
    <Typography>
      Whether or not each base has a runner.
      Each base can be toggled individually.
      More runners is more favorable for the batting team.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Inning half</Typography>
    <Typography>
      Which half of the inning the game is currently in.
      <b>Top</b> indicates that when this half ends, the game will proceed to the <b>Bottom</b> of the same inning.
      <b>Bottom</b> indicates that when this half ends, the game will proceed to the <b>Top</b> of the next inning.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Inning</Typography>
    <Typography>
      The current inning.
      Normal games have <b>9</b> innings.
      However, in the event that the <b>Bottom</b> of the <b>9th</b> inning ends with a tied score, the game will enter overtime until either team scores a point.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Bat Score</Typography>
    <Typography>
      The current score of the batting team.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Pitch Score</Typography>
    <Typography>
      The current score of the pitching team.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Previous Pitch Type</Typography>
    <Typography>
      The type of pitch that was thrown before the first pitch in the generated sequence.
      Only pitch types in the current pitcher's arsenal may be selected.
    </Typography>
    <Typography variant="h4" sx={{ mt: 2 }}>Pre-Game Report</Typography>
    <Typography>
      After selecting a game and confirming its roster on the <b>Home Page</b>, the user will be taken to the <b>Pre-Game Report page</b>.
      To generate a pre-game report for a different combination of teams, please return to the <b>Home Screen</b> and select a different game in the <b>Game Schedule Table</b>.
      The pitcher's profile is shown at the top of the page, with the generated pitch sequence for each batter listed below.
      Each pitch sequence is generated from an initial state of <b>0 balls, 0 strikes, and 0 outs at the top of the 1st inning</b>.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Roster</Typography>
    <Typography>
      On the left side of the screen, the roster as well as the preferred out type (groundout, flyout, strikeout, or automatically chosen by the model) can be adjusted.
      If any of these fields are changed, the pre-game report will update to reflect the new roster/preferred out type.
    </Typography>
    <Typography variant="h6" sx={{ mt: 1 }}>Print Report</Typography>
    <Typography sx={{ mb: 2 }}>
      In the top left corner, the <b>Print Report button</b> allows the user to generate a print-friendly version of the pre-game report.
      On the printed version of the report, the pie charts are replaced with numerical percentages for the sake of clarity.
    </Typography>
  </Container>
}
