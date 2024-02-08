const express = require('express');
const { Server } = require('socket.io')
const { v4: uuidV4 } = require('uuid')
const http = require('http');

// Express initialized by calling express()
const app = express()

// An HTTP server is created passing the express app as an argument
const server = http.createServer(app);

// Set port to value in environment variables or 8080 by default
const port = process.env.PORT || 8080

// Upgrade http server to websocket server
const io = new Server(server, {
  cors: '*' // Allow connection from any origin
})

// Game rooms will be stored in a map using roomID (string) - players (object) as the key-value pair
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  socket.on('username', (username) => {
    console.log(`Username: ${username}`)
    socket.data.username = username;  // Set socket's username to that given by client
  })

  socket.on('createRoom', async (callback) => {
    const roomID = uuidV4(); // Create a new uuid
    await socket.join(roomID);  // User creates and joins the room

    // Add room to rooms map with roomID as key and player data 
    rooms.set(roomID, {
      roomID,
      players: [{id: socket.id, username: socket.data?.username}]
    });
    
    socket.data.roomID = roomID;
    callback(roomID); // Respond to client with roomID using client-side callback function
  })

  socket.on('joinRoom', async (args, callback) => {
    
    const room = rooms.get(args.roomID);
    let error, message;

    if (!room) { // Check if roomID given is a valid room within the socket
      error = true;
      message ='Room Does Not Exist'
    } else if (room.length <= 0)  { // Check if there is a player in the given room
      error = true;
      message ='Room Is Currently Empty'
    } else if (room.length >= 2) {  // Check if the given room is already full
      error = true;
      message ='Room Is Currently Full'
    }

    if (error) {  // Check if there was an error
      if(callback) {  // Check if user passed a callback
        callback({  // True; Call callback using error object as payload
          error,
          message
        });
      }
      return; // Exit 
    }

    await socket.join(args.roomID)  // Make the client who inputted room ID join the given room

    const updatedRoomData = {  // Create a new room object using the spread operator to pass in the existing players data first
      ...room,
      players: [
        ...room.players,
        { id: socket.id, username: socket.data?.username }  // Add the joining client's data to the room object
      ],
    };

    rooms.set(args.roomID, updatedRoomData) // Update room with new room object

    callback(updatedRoomData);  // Respond to the client with the room details

    socket.data.roomID = args.roomID;
    socket.to(args.roomID).emit('opponentJoined', updatedRoomData)  // Emit an 'opponentJoined event to the room alerting the other player someone has joined
  })

  socket.on('disconnect', () => {
    const gameRooms = Array.from(rooms.values()); // Grab all game rooms disconnected user is a part of

    gameRooms.forEach((room) => {
      const playersInRoom = room.players.find((player) => player.id === socket.id);  //
      
      if (playersInRoom) {  // Check if room has players
        if (room.players.length < 2) {  // True; Check if room only has 1 player
          rooms.delete(room.roomID);  // True; close room
          return;
        }
      }
      socket.to(room.roomID).emit('opponentDisconnected', playersInRoom);
    })

    
  })

  // When one player makes a move on their end send that move data to the other player
  socket.on('sendMove', async (args, callback) => {
    socket.to(socket.data?.roomID).emit('recieveMove', args.moveData)
  })

  // When the players game is over close the game room
  socket.on('closeRoom', async (roomData) => {
    socket.to(roomData.roomID).emit('closeRoom', roomData.roomID);  // Emit to room players room is closing

    const clientSockets = await io.in(roomData.roomID).fetchSockets();  // Get all sockets in the current room

    clientSockets.forEach((socket) => { // Iterate over each client connected to the game room
      socket.leave(roomData.roomID);  // Have each client leave the socket.io room
    });

    rooms.delete(roomData.roomID); // Remove game room from rooms map

  })
})

server.listen(port, () => {
  console.log(`Server Listening On Port: ${port}`)
})

