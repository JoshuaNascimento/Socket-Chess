import socket from "../socket";
import { useState } from "react";
import { Stack, TextField, Button} from "@mui/material";
import CustomDialog from "./CustomDialog";

/**
 * 
 * @param setRoom - Determines if CustomDialog should be rendered
 * @param roomInput - Enables component to control the text input, will contain the room ID provided by user
 * @param roomError - Tracks whatever error was encountered while trying to join a room 
 * @returns 
 */
const InitGame = ({ setRoom, setOrientation, setPlayers }) => {
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [roomError, setRoomError] = useState('');

  return (
    // Stack component acts as a css flex component with flex-direction of column
  <Stack
    justifyContent="center"
    alignItems="center"
    sx={{ py: 1, height: "100vh" }}
  >
    {/* Dialog containing a text field to enable user to enter a room ID */}
    <CustomDialog
      open={roomDialogOpen}
      handleClose={() => setRoomDialogOpen(false)}
      title="Enter a Room Code"
      contentText="Please Enter a Room Code"
      handleContinue={() => {
        // join a room
        if (!roomCode) return;  // Check if room code is valid
        socket.emit('joinRoom', {roomID: roomCode}, (response: any) => {
          if (response.error) return setRoomError(response.message);  // If returned an error set roomError to the given message and exit
          console.log(`response: ${response}`);
          setRoom(response?.roomID);  // Set room to the Room ID
          setPlayers(response?.players);  // Set players array to the players in the room
          setOrientation('black');  // Set orientation to black
          setRoomDialogOpen(false); // Close Dialog Box
        })
      }}
    >
      <TextField
        autoFocus // automatically set focus on input (make it active).
        margin="dense"
        id="roomcode"
        label="Room ID"
        name="roomcode"
        value={roomCode}
        required
        onChange={(e) => setRoomCode(e.target.value)} // update username state with value
        type="text"
        fullWidth
        variant="standard"
        error={Boolean(roomError)}
        helperText={!roomError ? 'Enter a Room ID': `Invalid Room ID: ${roomError}`}
      />
    </CustomDialog>
    {/* Button for creating a new game which initializes a room */}
    <Button
      variant="contained"
      onClick={() => {
        // Emit the event for creating room through the websocket to the backend
        socket.emit('createRoom', (response: any) => { // Backend event contains a callback which will be passed the roomID
          console.log(response)
          setRoom(response);  // Set room to the Room ID
          setPlayers(response?.players);  // Set players array to the players in the room
          setRoomCode(response);
          setOrientation('white')
        })
    }}>
      Create a Room
    </Button>

    {/* Button for joining a room prompting user to enter room code */}
    <Button
      onClick={() => {
        setRoomDialogOpen(true);  // On clicking join room button prompt user to enter room code
    }}>
      Join Game
    </Button>
  </Stack>
  )
};

export default InitGame;