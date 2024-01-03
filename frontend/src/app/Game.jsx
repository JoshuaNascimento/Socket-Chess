'use client'
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import CustomDialog from './components/CustomDialog';
import socket from './socket';

export default function Game({ room, orientation, username, players, cleanup }) {
  // Create a memoized chess instance with 0 dependencies
  // useMemo allows the caching of chess instance to prevent new instances on re-render
  const chess = useMemo(() => new Chess(), []); // The Chess library is used for move generation and validation
  const [fen, setFen] = useState(chess.fen());  // Set FEN (standard notation for chess position) to that returned from chess instance
  const [over, setOver] = useState('');

  useEffect(() => { // Call use effect to create a socket listener for when the opposing player makes a move
    socket.on('recieveMove', (moveData) => {
      makeAMove(moveData) // Validate the incoming move on the recieving players side as well
    })
  }, [])

  // useCallback caches the function between re-renders to prevent the function from getting called on every re-render
  const makeAMove = useCallback(
    (move) => {
      try {
        const result = chess.move(move) // We pass the given move object to chess where it is validated 
        setFen(chess.fen());  // We then update fen to reflect the new game state

        console.log("over, checkmate", chess.isGameOver(), chess.isCheckmate());

        if (chess.isGameOver()) { // Check if move results in game over
          if (chess.isCheckmate()) {  // Check if game is over due to checkmate
            setOver(
              `Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`  // True; set over message based on winning colour
            );
          } else if (chess.isDraw()) {  // If game is not over due to checkmate check if game is drawn
            setOver("Draw");
          } else {
            setOver("Game Over")  // Otherwise; set default game over message
          }
        }

        socket.emit('sendMove', {moveData: move}) // If move is valid send the moveData to the opposing player
        return result;
      } catch (e) {
        return null;
      }
    }
  )

  function onDrop(sourceSquare, targetSquare) {
    
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      color: chess.turn(),
      //promotion: "q", // Always promote to a queen for example simplicity
    })

    // Check illegal moves
    if (chess.turn() != orientation.charAt(0)) {  // Check if player's colour matches the current turn colour
      return false;
    }

    return true;  // Move is valid
  }


  return (
  <>
    <div className='gameBoard'>
      
      <Chessboard position={fen} boardOrientation={orientation} onPieceDrop={onDrop}/> {/* Create Chessboard via react-chessboard with initial position given by fen */}
    </div>
    { /* Render Dialog when 'over' state is true, describing the reason the game is over */ }
    <CustomDialog 
      open={Boolean(over)} 
      title={over}
      contentText={over}
      handleContinue={() => {
        setOver("");
      }} 
    />
  </>
  )
}