const express = require('express');
const bodyParser = require('body-parser'); // For parsing form data
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const { MongoClient } = require('mongodb');

app.get('/img/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../img', req.params.filename); // Adjusted path
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status).end();
    }
  });
});

// MongoDB connection string from MongoDB Atlas
const uri = 'mongodb+srv://travispeach:ebr4SFmM7vLTp9p@quackcluster1.hwojm.mongodb.net/';
const client = new MongoClient(uri);

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp to make filenames unique
  }
});

const upload = multer({ storage: storage });
// Serve the /uploads folder to make images publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

let usersCollection, messagesCollection;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true })); // For URL-encoded form data
app.use(bodyParser.json()); // For JSON data
app.use(express.static('client', {
  index: false // Disable automatic serving of index.html
}));


// Serve the profile image from the uploads folder
app.use('/uploads', express.static('uploads'));

// Route for uploading a profile picture
app.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
  const username = req.body.username; // Assuming you're passing the username

  // Save the file path to MongoDB for the user's profile
  const profilePicPath = `/uploads/${req.file.filename}`;

  try {
    // Update the user's profile picture in MongoDB
    await usersCollection.updateOne(
      { username: username },
      { $set: { profilePic: profilePicPath } }
    );
    res.json({ success: true, profilePic: profilePicPath });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile picture.' });
  }
});

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

// Serve the user view page
app.get('/user-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'user-dashboard.html'));
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

// Route to handle saving the bio
app.post('/save-bio', async (req, res) => {
  const { username, bio } = req.body;

  if (!username || !bio) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  try {
    // Find the user in the database and update the bio
    const result = await usersCollection.updateOne(
      { username: username },
      { $set: { bio: bio } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'Bio updated successfully' });
  } catch (error) {
    console.error('Error saving bio:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});


app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'signin.html'));
});

// Serve the profile page
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'profile.html'));
});

// Route to fetch user profile including bio and profile picture
app.get('/get-user-profile', async (req, res) => {
  const username = req.query.username;

  try {
    // Find the user in the database by username
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return the user profile including the bio and profile picture
    res.json({
      success: true,
      profilePic: user.profilePic || '/uploads/default-avatar.png',
      bio: user.bio || '' // Send the bio, default to empty if not set
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});


const users = {}; // Track users by socket ID
const rooms = {}; // Track rooms by room name

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
  // Ensure MongoDB collections are available
  if (!usersCollection || !messagesCollection) {
    console.error('MongoDB not initialized');
    socket.emit('error', 'Server error: Database not connected');
    return;
  }

  // Handle when a user joins a group chat room
  socket.on('join room', async (roomName) => {
    // Log when a user joins a room
    console.log(`${users[socket.id]?.username || 'Unknown User'} is joining room ${roomName}`);
  
    socket.join(roomName);
  
    // Fetch the last 50 messages from the database
    const messages = await messagesCollection.find({ roomName: roomName })
      .sort({ timestamp: 1 })
      .limit(50)
      .toArray();
  
    // Log the messages being sent as chat history
    console.log('Sending chat history:', messages);
  
    // Send the chat history to the client
    socket.emit('chat history', messages);
  
    // Notify the room that a user has joined
    io.to(roomName).emit('room message', `${users[socket.id]?.username || 'Unknown User'} has joined the room.`);
  });
  

  // Handle signup data
  socket.on('signup', async (data) => {
    const { firstName, lastName, username, email, password } = data;
    // Perform signup logic...
  });

  // Handle sign-in data - moved inside the io.on('connection')
  socket.on('signin', async (data) => {
    if (!usersCollection) {
      socket.emit('signin response', { success: false, message: 'Database connection not established.' });
      return;
    }
  
    const { username, password } = data;
    const user = await usersCollection.findOne({ username });
  
    if (!user || user.password !== password) {
      socket.emit('signin response', { success: false, message: 'Invalid username or password' });
      return;
    }
  
    console.log('User signed in:', username);
    users[socket.id] = username; 
    socket.emit('signin response', { success: true });
  });

  // Handle when a username is set
  socket.on('set username', async (username) => {
    if (!usersCollection) {
      console.error('MongoDB connection is not established.');
      return;
    }
  
    const user = await usersCollection.findOne({ username });
    if (!user) {
      console.error('User not found in the database.');
      return;
    }
  
    // Store full user object with profile pic
    users[socket.id] = {
      username: user.username,
      profilePic: user.profilePic || '/uploads/default-avatar.png'
    };
  
    // Emit updated user list
    io.emit('user list', Object.values(users));
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users[socket.id]?.username || 'Unknown User';
    console.log(`${username} has left the chat`);
    delete users[socket.id]; // Remove user
    io.emit('user list', Object.values(users)); // Emit updated list
  });

  // Handle private 1-on-1 chat
  socket.on('private chat', (data) => {
    const { toUser, fromUser } = data;

    // Create a room name based on the two usernames to make it unique
    const roomName = [fromUser, toUser].sort().join('-');
    
    // Add both users to the private chat room
    socket.join(roomName);
    console.log(`${fromUser} has joined a private chat room with ${toUser}`);

    // Notify the users they are in the same room
    io.to(roomName).emit('private chat start', { roomName, users: [fromUser, toUser] });
  });

// Server-side: Handle incoming chat messages
socket.on('chat message', async (data) => {
  const { username, message, roomName, image } = data;

  console.log(`Message from ${username} to room ${roomName}: ${message}`);

  // Fetch user profile from MongoDB
  const user = await usersCollection.findOne({ username });
  if (!user) {
    console.error(`User ${username} not found in database`);
    return;
  }

  const profilePic = user.profilePic || '/uploads/default-avatar.png';

  // Create message object for the database
  const chatMessage = {
    username: user.username,
    message: message,
    roomName: roomName,
    timestamp: new Date(),
    profilePic: profilePic,
    image: image
  };
  // Store the message in the database
  await messagesCollection.insertOne(chatMessage);
  console.log('Storing message in DB:', chatMessage);

  // Emit the message to the room
  io.to(roomName).emit('chat message', {
    username: user.username,
    message: message,
    image: image,
    timestamp: new Date().toLocaleTimeString(),
    profilePic: profilePic
  });

  console.log(`Emitting message to room ${roomName}:`, {
    username: user.username,
    message: message,
    image: image,
    timestamp: new Date().toLocaleTimeString(),
    profilePic: profilePic
  });
});
  
// Handle disconnect
  socket.on('disconnect', () => {
    const username = users[socket.id];
    console.log(`${username || 'undefined'} has left the chat`);
    delete users[socket.id];
    io.emit('user list', Object.values(users)); // Broadcast updated user list
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
    process.exit(1);  // Exit if unable to connect to MongoDB
  }
}

connectDB();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
