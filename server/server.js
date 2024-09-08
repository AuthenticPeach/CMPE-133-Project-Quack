const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /client folder
app.use(express.static('client'));

// Handle a new WebSocket connection
const users = {}; // Track users by socket ID

io.on('connection', (socket) => {
  console.log('A user connected');

  // Broadcast to all users that a user connected
  socket.broadcast.emit('chat message', 'A user has connected');

  // Ask for the username when the user connects
  socket.on('set username', (username) => {
    users[socket.id] = username; // Store username based on socket ID
    io.emit('user list', Object.values(users)); // Send the list of users to everyone
  });

  socket.on('disconnect', () => {
    delete users[socket.id]; // Remove user on disconnect
    console.log('User disconnected');
    io.emit('user list', Object.values(users)); // Update the user list
  });

  socket.on('chat message', (msg) => {
    const timestamp = new Date().toLocaleTimeString(); // Get the current time
    io.emit('chat message', `${timestamp} - ${msg}`); // Send message with timestamp
  });
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username); // Broadcast typing event to others
  });
  
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing'); // Notify when typing stops
  });
  
});




const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
