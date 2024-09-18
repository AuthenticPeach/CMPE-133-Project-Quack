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
const uri = 'mongodb+srv://travispeach:OI4G8xqZJvWcKFgl@quackcluster1.hwojm.mongodb.net/';
const client = new MongoClient(uri);

let usersCollection, messagesCollection;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true })); // For URL-encoded form data
app.use(bodyParser.json()); // For JSON data
app.use(express.static('client')); // Serve static files from the client folder

// Route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Route for the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'signup.html')); // Serve signup.html from client folder
});

app.get('/favicon.ico', (req, res) => res.status(204));

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

// Track users
const users = {};

io.on('connection', (socket) => {
  // Handle signup data from signup.html
  socket.on('signup', async (data) => {
    const { firstName, lastName, username, email, password, confirmPassword } = data;

    // Simple validation
    if (password !== confirmPassword) {
      socket.emit('signup response', { success: false, message: 'Passwords do not match' });
      return;
    }

    try {
      // Check if the username already exists
      const existingUser = await usersCollection.findOne({ username });

      if (existingUser) {
        socket.emit('signup response', { success: false, message: 'Username already exists' });
        return;
      }

      // Create a new user and insert into the database
      await usersCollection.insertOne({ firstName, lastName, username, email, password });
      console.log('New user created:', username);

      socket.emit('signup response', { success: true });
    } catch (err) {
      console.error('Error signing up:', err);
      socket.emit('signup response', { success: false, message: 'An error occurred. Please try again.' });
    }
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
