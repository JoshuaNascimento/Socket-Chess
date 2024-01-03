"use client"

import { useState, useEffect, useCallback } from 'react'
import { Container, TextField } from '@mui/material'
import InitGame from './components/InitGame'
import Game from './Game'
import CustomDialog from './components/CustomDialog'
import socket from './socket'

export default function Home() {

  const [username, setUsername] = useState('');
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);

  const [room, setRoom] = useState('');
  const [orientation, setOrientation] = useState('');
  const [players, setPlayers] = useState([]);

  // Reset states which initialize a game
  const cleanup = useCallback( () => {  // Callback creates a memoization which caches the function and prevents it from being called on every render 
    setRoom('');
    setOrientation('');
    setPlayers([]);
  }, []);

  useEffect(() => {
    socket.on('opponentJoined', (roomData) => { // Listen to opponentJoined event from backend indicating a room is ready for a game
      console.log(`Room Data: ${roomData}`);
      setPlayers(roomData.players);
    });
  }, [])

  return (
    <Container>
      <CustomDialog
        open={!usernameSubmitted} // leave open if username has not been selected
        title="Pick a username" // Title of dialog
        contentText="Please select a username" // content text of dialog
        handleContinue={() => { // fired when continue is clicked
          if (!username) return; // if username hasn't been entered, do nothing
          socket.emit("username", username); // emit a websocket event called "username" with the username as data
          setUsernameSubmitted(true); // indicate that username has been submitted
        }}
      >
        <TextField // Input
          autoFocus // automatically set focus on input (make it active).
          margin="dense"
          id="username"
          label="Username"
          name="username"
          value={username}
          required
          onChange={(e) => setUsername(e.target.value)} // update username state with value
          type="text"
          fullWidth
          variant="standard"
        />
      </CustomDialog>

      { room ? (  // Check if user is in a game room
        // True; Render Game component with the values associated with the given Game
        <Game 
          room={room}
          orientation={orientation} 
          username={username}
          players={players} 
          // Cleanup used by Game component to reset the associated state on game over
          cleanup={cleanup} 
        />
      ) : ( // Otherwise; Render InitGame prompting user to either create or join a game room
        // Pass setters as props to allow InitGame component to change parent state when a room is created/joined
        <InitGame 
          setRoom={setRoom}
          setOrientation={setOrientation}
          setPlayers={setPlayers}
        />
      )}
    </Container>
  )
}
