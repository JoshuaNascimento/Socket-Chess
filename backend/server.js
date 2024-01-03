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

  // When one player makes a move on their end send that move data to the other player
  socket.on('sendMove', async (args, callback) => {
    socket.to(socket.data?.roomID).emit('recieveMove', args.moveData)
  })
})

server.listen(port, () => {
  console.log(`Server Listening On Port: ${port}`)
})

