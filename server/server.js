const express = require('express');
const bodyParser = require('body-parser'); // For parsing form data
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const { MongoClient } = require('mongodb');

// MongoDB connection string from MongoDB Atlas
const uri = 'mongodb+srv://travispeach:ebr4SFmM7vLTp9p@quackcluster1.hwojm.mongodb.net/';
const client = new MongoClient(uri);

let usersCollection, messagesCollection;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true })); // For URL-encoded form data
app.use(bodyParser.json()); // For JSON data
app.use(express.static('client', {
  index: false // Disable automatic serving of index.html
}));


// Route to serve signin.html as the default page
app.get('/', (req, res) => {
  res.redirect('/signin');
});


// Route for the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'signup.html')); // Serve signup.html from client folder
});

app.get('/favicon.ico', (req, res) => res.status(204));

// Serve the chat page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'chat.html'));
});


// Route to handle signup form POST request
app.post('/signup', async (req, res) => {
  console.log('Received data:', req.body); // Log incoming request data

  const { firstName, lastName, username, email, password, confirmPassword } = req.body;

  // Simple validation
  if (password !== confirmPassword) {
    return res.json({ success: false, message: 'Passwords do not match' });
  }

  try {
    // Ensure MongoDB connection and collection is valid
    if (!usersCollection) {
      console.log('MongoDB connection failed or usersCollection is undefined');
      return res.json({ success: false, message: 'Database connection failed' });
    }

    console.log('Processing signup for username:', username);

    // Check if the username already exists
    const existingUser = await usersCollection.findOne({ username });
    console.log('Result of findOne for username:', existingUser);

    if (existingUser) {
      return res.json({ success: false, message: 'Username already exists' });
    }

    console.log('Inserting new user:', { firstName, lastName, username, email, password });

    // Create a new user and insert into the database
    await usersCollection.insertOne({ firstName, lastName, username, email, password });
    console.log('New user created:', username);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error signing up:', err);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'signin.html'));
});

// Track users
const users = {};

// Utility function to format timestamps
function formatTimestamp(date) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const messageDate = new Date(date);
  const isToday = now.toDateString() === messageDate.toDateString();
  const isYesterday = yesterday.toDateString() === messageDate.toDateString();

  let hours = messageDate.getHours();
  let minutes = messageDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes; // add leading zero to minutes

  const time = `${hours}:${minutes} ${ampm}`;

  if (isToday) {
    return `Today at ${time}`;
  } else if (isYesterday) {
    return `Yesterday at ${time}`;
  } else {
    const month = messageDate.getMonth() + 1;
    const day = messageDate.getDate();
    const year = messageDate.getFullYear();
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year} ${time}`;
  }
}

io.on('connection', (socket) => {
// Handle signup data
socket.on('signup', async (data) => {
  const { firstName, lastName, username, email, password } = data;

  // Server-side validation
  if (!/^[A-Za-z ]{1,50}$/.test(firstName) || !/^[A-Za-z ]{1,50}$/.test(lastName)) {
    socket.emit('signup response', { success: false, message: 'Invalid first or last name' });
    return;
  }

  if (!/^[A-Za-z0-9]{3,30}$/.test(username)) {
    socket.emit('signup response', { success: false, message: 'Invalid username' });
    return;
  }

  if (password.length < 6 || password.length > 50) {
    socket.emit('signup response', { success: false, message: 'Password must be between 6 and 50 characters' });
    return;
  }

  try {
    // Proceed with saving the user in the database
    const existingUser = await usersCollection.findOne({ username });

    if (existingUser) {
      socket.emit('signup response', { success: false, message: 'Username already exists' });
      return;
    }

    await usersCollection.insertOne({ firstName, lastName, username, email, password });
    socket.emit('signup response', { success: true }); // Respond with success
  } catch (err) {
    console.error('Error signing up:', err);
    socket.emit('signup response', { success: false, message: 'An error occurred. Please try again.' });
  }
});

  // Handle sign-in data
  socket.on('signin', async (data) => {
    const { username, password } = data;

    try {
      // Find the user in the database
      const user = await usersCollection.findOne({ username });

      if (!user || user.password !== password) {
        socket.emit('signin response', { success: false, message: 'Invalid username or password' });
        return;
      }

      // Sign-in successful
      console.log('User signed in:', username);
      socket.emit('signin response', { success: true });
    } catch (err) {
      console.error('Error signing in:', err);
      socket.emit('signin response', { success: false, message: 'An error occurred. Please try again.' });
    }
  });

  // Handle when a username is set
  socket.on('set username', (username) => {
    users[socket.id] = username;
    console.log(`${username} has joined the chat`);

    // Emit the updated list of users to all clients
    io.emit('user list', Object.values(users));  // Send the list of usernames
  });

  // Handle incoming chat messages
  socket.on('chat message', (data) => {
    const { username, message } = data;

    // Get the current timestamp and format it
    const timestamp = formatTimestamp(new Date());

    // Broadcast the message with the formatted timestamp
    io.emit('chat message', { username, message, timestamp });
  });

  // Typing indicator
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users[socket.id];
    console.log(`${username} has left the chat`);

    delete users[socket.id];  // Remove user from the list

    // Emit the updated user list to all clients
    io.emit('user list', Object.values(users));
  });
});

// Connect to MongoDB once when the server starts
async function connectDB() {
  try {
    await client.connect();
    const db = client.db('chatApp');
    usersCollection = db.collection('users');
    messagesCollection = db.collection('messages');
    console.log('Connected to MongoDB and collections initialized');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectDB();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
