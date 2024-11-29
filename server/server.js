const express = require('express');
const bodyParser = require('body-parser'); // For parsing form data
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const sanitizeFilename = require('sanitize-filename');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);



// Environment variables configuration
require('dotenv').config();

const defaultProfilePicUrl = 'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/p8ogcgmilh9cwcegzfdk.png';

// MongoDB connection string from MongoDB Atlas
const uri = 'mongodb+srv://travispeach:ebr4SFmM7vLTp9p@quackcluster1.hwojm.mongodb.net/';
const client = new MongoClient(uri);

// Create a temporary directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dxseoqcpb', 
  api_key: '847592284682929', 
  api_secret: 'yiTBh8MGmd2SxuX9fNWNUuuCUhA' 
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, text files, and PDFs are allowed.'));
  }
};

let usersCollection, messagesCollection, inboxCollection, reportsCollection;

// Multer upload middleware
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true })); // For URL-encoded form data
app.use(bodyParser.json()); // For JSON data
app.use(express.static('client', {
  index: false // Disable automatic serving of index.html
}));

// Serve the /uploads folder to make images publicly accessible
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(express.static(path.join(__dirname, '../client')));


// Error handling middleware for Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.startsWith('Invalid file type')) {
    console.error('Multer error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

// Create a route after defining 'upload' to prevent ReferenceError
app.post('/upload-chat', upload.single('image'), async (req, res) => {
  const message = req.body.message || '';
  const username = req.body.username || 'Unknown User';
  const roomName = req.body.roomName;
  const replyToId = req.body.replyTo; // Get the ID of the message being replied to

  let fileUrl = null;
  let fileType = null;
  let fileName = null;

  if (req.isMuted) {
    return res.status(403).json({
      success: false,
      message: `You are muted until ${new Date(req.muteUntil).toLocaleString()}. Reason: ${req.muteReason}`,
    });
  }

  if (req.file) {
    try {
      // Sanitize the original file name
      fileName = sanitizeFilename(req.file.originalname);

      // Determine resource_type based on file mimetype
      let resourceType = 'auto';
      if (req.file.mimetype === 'application/pdf' || req.file.mimetype === 'text/plain') {
        resourceType = 'raw';
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: resourceType,
        folder: 'chat_files', // Optional: organize files
        use_filename: true, // Use the original filename
        unique_filename: false, // Prevent Cloudinary from appending random characters
      });

      fileUrl = result.secure_url;
      fileType = req.file.mimetype;

      // Delete the temporary file
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return res.status(500).json({ success: false, message: 'File upload failed.' });
    }
  }

  // Create a message object
  const chatMessage = {
    username: username,
    message: message,
    roomName: roomName,
    fileUrl: fileUrl,
    fileType: fileType,
    fileName: fileName,
    replyTo: replyToId ? new ObjectId(replyToId) : null, // Convert to ObjectId if exists
    timestamp: new Date()
  };

  try {
    const user = await usersCollection.findOne({ username });
    chatMessage.firstName = user.firstName;
    chatMessage.lastName = user.lastName;

    // Store the message in the database
    const result = await messagesCollection.insertOne(chatMessage);
    console.log('Storing message in DB:', chatMessage);

    // Fetch user profile from MongoDB
    const profilePic = user ? user.profilePic || defaultProfilePicUrl : defaultProfilePicUrl;

    // Prepare the message to be sent to clients
    const messageToSend = {
      _id: result.insertedId, // Include the ID of the new message
      username: username,
      firstName: user.firstName,
      lastName: user.lastName,
      message: message,
      fileUrl: fileUrl,
      fileType: fileType,
      fileName: fileName,
      replyTo: replyToId,
      timestamp: new Date().toISOString(),
      profilePic: profilePic
    };

    // If there's a replyTo, fetch the original message content
    if (replyToId) {
      const originalMessage = await messagesCollection.findOne({ _id: new ObjectId(replyToId) });
      if (originalMessage) {
        messageToSend.replyToMessage = {
          username: originalMessage.username,
          firstName: originalMessage.firstName,
          lastName: originalMessage.lastName,
          message: originalMessage.message || originalMessage.fileName || '[File]',
          fileType: originalMessage.fileType
        };
      }
    }

    // Emit the message to the room
    io.to(roomName).emit('chat message', messageToSend);
    console.log(`Emitting message to000 room ${roomName}:`, messageToSend);

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling /upload-chat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Define other routes here, e.g. uploading a profile picture
app.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
  const username = req.body.username;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'image',
      folder: 'profile_pics' // Optional: organize files
    });

    const profilePicUrl = result.secure_url;

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    // Update the user's profile picture in MongoDB
    await usersCollection.updateOne(
      { username: username },
      { $set: { profilePic: profilePicUrl } }
    );

    res.json({ success: true, profilePic: profilePicUrl });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile picture.' });
  }
});

// Uploading a background image
app.post('/upload-background', upload.single('backgroundImg'), async (req, res) => {
  const username = req.body.username;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'image',
      folder: 'backgroundImg' // Optional: organize files
    });

    const backgroundImgUrl = result.secure_url;

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    // Update the user's profile picture in MongoDB
    await usersCollection.updateOne(
      { username: username },
      { $set: { backgroundImg: backgroundImgUrl } }
    );

    res.json({ success: true, backgroundImg: backgroundImgUrl });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile picture.' });
  }
});

// Reset background image
app.post('/reset-background', async (req, res) => {
  const { username, backgroundImg } = req.body;

  try {
    const result = await usersCollection.updateOne(
      { username },
      { $set: { backgroundImg: backgroundImg } }
    );

    if (result.modifiedCount === 1 || result.upsertedCount === 1) {
      console.log(`Background image has been reset: ${username}`);
      res.json({ success: true });
    } else {
      console.error(`Failed to reset background image for user: ${username}`);
      res.json({ success: false, message: 'Failed to reset background image.' });
    }
  } catch (error) {
    console.error('Error reseting background image:', error);
    res.status(500).json({ success: false, message: 'An error occurred while reseting background image.' });
  }
});

app.post('/upload-chat', upload.single('image'), async (req, res) => {
  const message = req.body.message || '';
  const username = req.body.username || 'Unknown User';
  const roomName = req.body.roomName;
  const replyToId = req.body.replyTo; // Get the ID of the message being replied to

  let fileUrl = null;
  let fileType = null;
  let fileName = null;
  
    if (req.file) {
      try {
        // Sanitize the original file name
        fileName = sanitizeFilename(req.file.originalname);
  
        // Determine resource_type based on file mimetype
        let resourceType = 'auto';
        if (req.file.mimetype === 'application/pdf' || req.file.mimetype === 'text/plain') {
          resourceType = 'raw';
        }
  
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: resourceType,
          folder: 'chat_files', // Optional: organize files
          use_filename: true, // Use the original filename
          unique_filename: false, // Prevent Cloudinary from appending random characters
        });
  
        const publicId = result.public_id;

        fileUrl = cloudinary.url(publicId, {
          resource_type: 'raw',
          secure: true,
          // flags: 'attachment', // Uncomment to force download
        });
        fileUrl = result.secure_url;
        fileType = req.file.mimetype;
  
        // Delete the temporary file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ success: false, message: 'File upload failed.' });
      }
    }
  
  // Create a message object
  const chatMessage = {
    username: username,
    message: message,
    roomName: roomName,
    fileUrl: fileUrl,
    fileType: fileType,
    fileName: fileName,
    replyTo: replyToId ? new ObjectId(replyToId) : null, // Convert to ObjectId if exists
    timestamp: new Date()
  };

  try {
    // Store the message in the database
    const result = await messagesCollection.insertOne(chatMessage);
    console.log('Storing message in DB:', chatMessage);

    // Fetch user profile from MongoDB
    const user = await usersCollection.findOne({ username });
    const profilePic = user ? user.profilePic || defaultProfilePicUrl : defaultProfilePicUrl;

    // Prepare the message to be sent to clients
    const messageToSend = {
      _id: result.insertedId, // Include the ID of the new message
      username: username,
      message: message,
      fileUrl: fileUrl,
      fileType: fileType,
      fileName: fileName,
      replyTo: replyToId,
      timestamp: new Date().toISOString(),
      profilePic: profilePic
    };

    // If there's a replyTo, fetch the original message content
    if (replyToId) {
      const originalMessage = await messagesCollection.findOne({ _id: new ObjectId(replyToId) });
      if (originalMessage) {
        messageToSend.replyToMessage = {
          username: originalMessage.username,
          message: originalMessage.message || originalMessage.fileName || '[File]',
          fileType: originalMessage.fileType
        };
      }
    }

    // Emit the message to the room
    io.to(roomName).emit('chat message', messageToSend);
    console.log(`Emitting message tooo room ${roomName}:`, messageToSend);

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling /upload-chat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route to serve signin.html as the default page
app.get('/', (req, res) => {
  res.redirect('/signin');
});

// Route for the signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/SignupPage/signup.html')); // Serve signup.html from client folder
});

app.get('/favicon.ico', (req, res) => res.status(204));

// Serve the chat page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/ChatPage/chat.html'));
});

app.get('/messages', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/MessagesPage/messages.html'));
});


// Serve the user view page
app.get('/user-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/UserDashboard/user-dashboard.html'));
});


// Serve the admin dashboard page
app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/AdminDashboard/admin-dashboard.html'));
});


// Route to get all users for admin dashboard
app.get('/admin/get-users', async (req, res) => {
  try {
    // Fetch users
    const users = await usersCollection.find({}).toArray();

    // Fetch messages count per user
    const messagesCounts = await messagesCollection.aggregate([
      { $group: { _id: '$username', count: { $sum: 1 } } }
    ]).toArray();

    // Create a map of username to messages count
    const messagesCountMap = {};
    messagesCounts.forEach(item => {
      messagesCountMap[item._id] = item.count;
    });

    // Fetch reports count per user (Assuming you have a 'reports' collection)
    const reportsCounts = await reportsCollection.aggregate([
      { $group: { _id: '$reportedUser', count: { $sum: 1 } } }
    ]).toArray();

    // Create a map of username to reports count
    const reportsCountMap = {};
    reportsCounts.forEach(item => {
      reportsCountMap[item._id] = item.count;
    });

    // Sanitize and prepare the user data
    const sanitizedUsers = users.map(user => ({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      messagesCount: messagesCountMap[user.username] || 0,
      reportsCount: reportsCountMap[user.username] || 0,
      isBanned: user.isBanned || false,
      muteUntil: user.muteUntil || null,
      // Exclude or include other fields as needed
    }));

    res.json({ success: true, users: sanitizedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching users.' });
  }
});

app.get('/get-conversations', (req, res) => {
  const username = req.query.username;

  inboxCollection.aggregate([
    {
      $match: {
        $or: [
          { fromUser: username },
          { toUser: username }
        ]
      }
    },
    {
      $project: {
        fromUser: 1,
        toUser: 1,
        message: 1,
        isFriendRequest: 1,
        isResolved: 1, // Include the resolved state
        timestamp: 1,
        participant: {
          $cond: [
            { $eq: ["$fromUser", username] },
            "$toUser",
            "$fromUser"
          ]
        }
      }
    },
    {
      $group: {
        _id: "$participant",
        lastMessage: { $last: "$message" },
        isFriendRequest: { $last: "$isFriendRequest" },
        isResolved: { $last: "$isResolved" }, // Include the latest resolved state
        lastTimestamp: { $last: "$timestamp" }
      }
    },
    {
      $lookup: {
        from: 'users', // The name of the users collection
        localField: '_id', // Field from the previous stage (participant)
        foreignField: 'username', // Field in users collection
        as: 'participantInfo'
      }
    },
    {
      $unwind: "$participantInfo"
    },
    {
      $sort: { lastTimestamp: -1 }
    },
    {
      $project: {
        participant: "$_id",
        lastMessage: 1,
        isFriendRequest: 1,
        isResolved: 1, // Include resolved status in response
        lastTimestamp: 1,
        profilePic: { $ifNull: ["$participantInfo.profilePic", "/uploads/default-avatar.png"] }
      }
    }
  ])
    .toArray()
    .then(results => {
      const conversations = results.map(result => ({
        participant: result.participant,
        lastMessage: result.lastMessage,
        isFriendRequest: result.isFriendRequest || false,
        isResolved: result.isResolved || false, // Default to false if not present
        lastTimestamp: result.lastTimestamp,
        profilePic: result.profilePic
      }));
      res.json({ success: true, conversations });
    })
    .catch(error => {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ success: false, message: 'Error fetching conversations' });
    });
});

// server.js

app.get('/get-messages', async (req, res) => {
  const { username, participant } = req.query;

  try {
    // Fetch messages between the two users
    const messages = await inboxCollection.find({
      $or: [
        { fromUser: username, toUser: participant },
        { fromUser: participant, toUser: username }
      ]
    }).sort({ timestamp: 1 }).toArray();

    // Extract unique usernames from the messages
    const usernames = Array.from(new Set(messages.map(msg => msg.fromUser)));

    // Fetch profile pictures for these users
    const users = await usersCollection.find({
      username: { $in: usernames }
    }, { projection: { username: 1, profilePic: 1 } }).toArray();

    // Create a mapping of username to profilePic
    const userProfilePics = {};
    users.forEach(user => {
      userProfilePics[user.username] = user.profilePic || '/uploads/default-avatar.png';
    });

    // Attach profilePic to each message
    const messagesWithProfilePics = messages.map(message => ({
      ...message,
      profilePic: userProfilePics[message.fromUser] || '/uploads/default-avatar.png'
    }));

    res.json({ success: true, messages: messagesWithProfilePics });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
});

function getMessages(username, participant) {
  return Message.find({
    $or: [
      { fromUser: username, toUser: participant },
      { fromUser: participant, toUser: username }
    ]
  })
  .sort({ timestamp: 1 }); // Sort messages by timestamp
}

// Route to handle signup form POST request
app.post('/signup', async (req, res) => {
  console.log('Received data:', req.body);

  const { firstName, lastName, username, email, phoneNumber, password, confirmPassword } = req.body;

  // Simple validation
  if (password !== confirmPassword) {
    return res.json({ success: false, message: 'Passwords do not match' });
  }

  try {
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
    // Normalize the phone number by removing non-digit characters
    const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');
        // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Inserting new user:', { firstName, lastName, username, email, phoneNumber, password });

  // Assign a random default profile picture
  const defaultProfilePics = [
    'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/p4szwxh3wzbfzq2bx9op.png',
    'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/zhzxuj1nsoar8ufqlvgn.png',
    'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/p8ogcgmilh9cwcegzfdk.png',
    'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/teuavi81io1mpomonulm.png',
    'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/rwn57mlxu05h14jghllg.png',
    'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/d62dajduqseghmhuqqui.png',
    'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/jm0u0vephzkbgq2yadjc.png',
  ];
  const randomIndex = Math.floor(Math.random() * defaultProfilePics.length);
  const profilePic = defaultProfilePics[randomIndex];

  // Create a new user and insert into the database
  await usersCollection.insertOne({
    firstName,
    lastName,
    username,
    email,
    phoneNumber,
    password: hashedPassword,
    profilePic: profilePic
  });

    console.log('New user created:', username);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error signing up:', err);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

app.post('/assign-default-profile-pics', async (req, res) => {
  try {
    const defaultProfilePics = [
      'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/p4szwxh3wzbfzq2bx9op.png',
      'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/zhzxuj1nsoar8ufqlvgn.png',
      'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/p8ogcgmilh9cwcegzfdk.png',
      'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/teuavi81io1mpomonulm.png',
      'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/rwn57mlxu05h14jghllg.png',
      'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/d62dajduqseghmhuqqui.png',
      'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/jm0u0vephzkbgq2yadjc.png',
    ];

    const usersWithoutProfilePic = await usersCollection.find({ profilePic: { $exists: false } }).toArray();

    for (const user of usersWithoutProfilePic) {
      const randomIndex = Math.floor(Math.random() * defaultProfilePics.length);
      const profilePic = defaultProfilePics[randomIndex];

      await usersCollection.updateOne({ _id: user._id }, { $set: { profilePic } });
    }

    res.json({ success: true, message: 'Assigned default profile pictures to users without profile pictures.' });
  } catch (error) {
    console.error('Error assigning default profile pictures:', error);
    res.status(500).json({ success: false, message: 'An error occurred while assigning default profile pictures.' });
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
  res.sendFile(path.join(__dirname, '../client/pages/SigninPage/signin.html'));
});

// Serve the profile page
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/ProfilePage/profile.html'));
});

// Route to fetch user profile including bio and profile picture w/ middleware
app.get('/get-user-profile', checkUserStatus, async (req, res) => {
  const username = req.query.username;
  
  try {
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      profilePic: user.profilePic || '/uploads/default-avatar.png',
      connectedAccounts: user.connectedAccounts || {},
      backgroundImg: user.backgroundImg || 'https://res.cloudinary.com/dxseoqcpb/image/upload/v1729122093/base/t2laawx0hmk39czdqqgk.png'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// Route to update phone number
app.post('/update-profile', async (req, res) => {
  const { username, firstName, lastName, phoneNumber } = req.body;

  // Check if username is provided, as it's required
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  // Prepare the fields to update
  const updateFields = {};
  if (firstName) updateFields.firstName = firstName;
  if (lastName) updateFields.lastName = lastName;
  if (phoneNumber) updateFields.phoneNumber = phoneNumber;

  // If no fields are provided to update, return an error
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  try {

    // Normalize the phone number by removing non-digit characters
    const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');

    const result = await usersCollection.updateOne(
      { username: username },
      {
        $set: {
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
          normalizedPhoneNumber: normalizedPhoneNumber // Update the normalized phone number
        }
      }

    );

    // Check if any document was modified (i.e., user was found)
    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found or no changes made' });
    }

    // Success response
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});


// Route to change password
app.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  try {
    const user = await usersCollection.findOne({ username: username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Compare current password with stored password
    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    const result = await usersCollection.updateOne(
      { username: username },
      { $set: { password: hashedPassword } }
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// Route to delete account
app.delete("/delete-account", async (req, res) => {
  const { username, currentPassword } = req.body;

  try {
    const user = await usersCollection.findOne({ username: username });

     // Compare current password with stored password
     const match = await bcrypt.compare(currentPassword, user.password);

     if (!match) {
       return res.status(401).json({ success: false, message: 'Current password is incorrect' });
     }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const result = await usersCollection.deleteOne({ username: username });

    if (result.deletedCount === 1) {
      res.json({ success: true, message: "Account deleted successfully" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to delete account" });
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
});

app.delete('/delete-message/:id', async (req, res) => {
  const messageId = req.params.id;

  try {
    const result = await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });

    if (result.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Message not found' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search users endpoint
app.get('/search-users', async (req, res) => {
  const query = req.query.query;
  const type = req.query.type || 'username';

  try {
    let users;

    if (type === 'phoneNumber') {
      // Normalize the phone number by removing non-digit characters
      const normalizedQuery = query.replace(/\D/g, '');

      if (normalizedQuery.length === 10 || normalizedQuery.length === 11) {
        // Search for an exact match in normalized phone numbers
        users = await usersCollection.find({
          normalizedPhoneNumber: normalizedQuery
        }).toArray();
      } else {
        // If the phone number is not the expected length, return an empty array
        users = [];
      }
    } else {
      // Search by username with case-insensitive partial match
      users = await usersCollection.find({
        username: { $regex: `^${query}`, $options: 'i' }
      }).toArray();
    }

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Error searching users' });
  }
});

// Add contact endpoint
app.post('/add-contact', async (req, res) => {
  const { username, contact } = req.body;

  try {
    await usersCollection.updateOne(
      { username: username },
      { $addToSet: { contacts: { username: contact, isFavorite: false } } } // Avoid duplicates
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ success: false, message: 'Error adding contact' });
  }
});

// Route to send a friend request
app.post('/send-friend-request', async (req, res) => {
  const { fromUser, toUser } = req.body;

  try {
    // Insert friend request message into the inbox collection
    await inboxCollection.insertOne({
      fromUser: fromUser,
      toUser: toUser,
      message: `${fromUser} sent you a friend request.`,
      isFriendRequest: true,
      isRead: false,
      timestamp: new Date(),
    });

    res.json({ success: true, message: 'Friend request sent!' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ success: false, message: 'Failed to send friend request.' });
  }
});

// Route to handle friend request response
app.post('/respond-to-friend-request', async (req, res) => {
  const { fromUser, toUser, accepted } = req.body;

  try {
    // Mark the friend request as resolved
    await inboxCollection.updateOne(
      { fromUser, toUser, isFriendRequest: true },
      { $set: { isResolved: true } }
    );

    if (accepted) {
      // Add each user to the other's contact list
      await usersCollection.updateOne(
        { username: toUser },
        { $addToSet: { contacts: { username: fromUser, isFavorite: false } } }
      );
      await usersCollection.updateOne(
        { username: fromUser },
        { $addToSet: { contacts: { username: toUser, isFavorite: false } } }
      );
    } else {
      // Remove the friend request from the inbox
      await inboxCollection.deleteOne({ fromUser, toUser, isFriendRequest: true });
    }

    res.json({
      success: true,
      message: accepted ? 'Friend request accepted!' : 'Friend request declined.',
    });
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ success: false, message: 'Error responding to friend request.' });
  }
});




// Server-side: Return the user's contact list along with profile pictures
// server.js

app.get('/get-contacts', checkUserStatus, async (req, res) => {
  const username = req.query.username;

  try {
    // Fetch the user from the database
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get the user's contacts array (array of objects with username and isFavorite)
    const contactsInfo = user.contacts || [];

    // Extract usernames to fetch detailed info from users collection
    const contactsUsernames = contactsInfo.map(contact => contact.username);

    // Fetch contact details from the users collection
    const contacts = await usersCollection
      .find({ username: { $in: contactsUsernames } })
      .toArray();

    // Map contacts to include isFavorite status
    const contactsWithFavorites = contacts.map(contact => {
      // Find the corresponding contact in contactsInfo to get isFavorite
      const contactInfo = contactsInfo.find(c => c.username === contact.username);

      return {
        username: contact.username,
        profilePic: contact.profilePic || '/uploads/default-avatar.png',
        isFavorite: contactInfo ? contactInfo.isFavorite : false
      };
    });

    res.json({ success: true, contacts: contactsWithFavorites });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

app.get('/check-user-status', async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  try {
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isBanned = user.isBanned || false;
    const isMuted = user.muteUntil && new Date(user.muteUntil) > new Date();

    res.json({ success: true, isBanned, isMuted, muteUntil: user.muteUntil, muteReason: user.muteReason });
  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});

// Add a contact to favorites
app.post('/add-favorite', async (req, res) => {
  const { username, contactUsername } = req.body;

  try {
    await usersCollection.updateOne(
      { username, 'contacts.username': contactUsername },
      { $set: { 'contacts.$.isFavorite': true } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// Remove a contact from favorites
app.post('/remove-favorite', async (req, res) => {
  const { username, contactUsername } = req.body;

  try {
    await usersCollection.updateOne(
      { username, 'contacts.username': contactUsername },
      { $set: { 'contacts.$.isFavorite': false } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

app.post('/add-field-to-users', async (req, res) => {
  try {
    await usersCollection.updateMany(
      {},
      {
        $set: {
          contacts: [], // Add empty contacts array
          favorites: [] // Add empty favorites array
        }
      }
    );
    res.json({ success: true, message: 'Fields added to all users' });
  } catch (error) {
    console.error('Error updating users:', error);
    res.status(500).json({ success: false, message: 'Error updating users' });
  }
});

// Server-side: Remove a contact from the user's contact list
app.post('/remove-contact', async (req, res) => {
  const { username, contactUsername } = req.body;

  try {
    // Find the user in the database
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove the contact from the user's contacts list
    await usersCollection.updateOne(
      { username: username },
      { $pull: { contacts: { username: contactUsername } } } // Pull removes the matching contact
    );

    // Delete conversations between the two users
    const deleteMessagesResult = await inboxCollection.deleteMany({
      $or: [
        { fromUser: username, toUser: contactUsername },
        { fromUser: contactUsername, toUser: username }
      ]
    });

    const deleteChatMessagesResult = await messagesCollection.deleteMany({
      $or: [
        { fromUser: username, toUser: contactUsername },
        { fromUser: contactUsername, toUser: username }
      ]
    });

    res.json({
      success: true,
      message: `Removed ${contactUsername} from your contacts and deleted ${deleteMessagesResult.deletedCount + deleteChatMessagesResult.deletedCount} messages.`,
    });
  } catch (error) {
    console.error('Error removing contact:', error);
    res.status(500).json({ success: false, message: 'An error occurred while removing the contact.' });
  }
});


// Modify the /inbox route to return all messages grouped by sender
app.get('/inbox', async (req, res) => {
  const { username } = req.query;

  try {
    // Fetch all messages sent to the user
    const messages = await inboxCollection.find({ toUser: username }).toArray();

    // Group messages by sender
    const threads = {};
    for (const message of messages) {
      if (!threads[message.fromUser]) {
        threads[message.fromUser] = [];
      }
      threads[message.fromUser].push(message);
    }

    res.json({ success: true, threads });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ success: false, message: 'Error fetching inbox.' });
  }
});

app.post('/send-message', async (req, res) => {
  const { fromUser, toUser, message } = req.body;

  try {
    // Save the message to the database
    const newMessage = {
      fromUser,
      toUser,
      message,
      timestamp: new Date()
    };
    const result = await inboxCollection.insertOne(newMessage);
    newMessage._id = result.insertedId;

    // Fetch the sender's profile picture
    const user = await usersCollection.findOne(
      { username: fromUser },
      { projection: { profilePic: 1 } }
    );
    newMessage.profilePic = user?.profilePic || '/uploads/default-avatar.png';

    // Emit the new message to the recipient via Socket.io
    io.to(users[fromUser]).emit('new inbox message', newMessage);
    io.to(users[toUser]).emit('new inbox message', newMessage);

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
});

function saveMessage(fromUser, toUser, message) {
  const newMessage = {
    fromUser,
    toUser,
    message,
    timestamp: new Date(),
  };
  return messagesCollection.insertOne(newMessage);
}



app.post('/mark-as-read', async (req, res) => {
  const { messageId } = req.body;

  try {
    await inboxCollection.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ success: false, message: 'Error marking message as read.' });
  }
});

app.post('/toggle-read-status', async (req, res) => {
  const { messageId, isRead } = req.body;

  try {
    await inboxCollection.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { isRead: isRead } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating message read status:', error);
    res.status(500).json({ success: false, message: 'Error updating message read status.' });
  }
});

app.post('/delete-thread', async (req, res) => {
  const { username, fromUser } = req.body;

  try {
    await inboxCollection.deleteMany({
      toUser: username,
      fromUser: fromUser
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({ success: false, message: 'Error deleting thread.' });
  }
});

// Route to update phone number
app.post('/update-phone-number', async (req, res) => {
  const { username, phoneNumber } = req.body;

  if (!username || !phoneNumber) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  try {
    const result = await usersCollection.updateOne(
      { username: username },
      { $set: { phoneNumber: phoneNumber } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'Phone number updated successfully' });
  } catch (error) {
    console.error('Error updating phone number:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// Route to change password
app.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  try {
    const user = await usersCollection.findOne({ username: username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Compare current password with stored password
    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    const result = await usersCollection.updateOne(
      { username: username },
      { $set: { password: hashedPassword } }
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

app.post('/save-connected-accounts', async (req, res) => {
  const { username, connectedAccounts } = req.body;

  try {
    // Sanitize inputs
    const sanitizedAccounts = {};
    for (const [key, value] of Object.entries(connectedAccounts)) {
      sanitizedAccounts[key] = DOMPurify.sanitize(value.trim());
    }

    const result = await usersCollection.updateOne(
      { username },
      { $set: { connectedAccounts: sanitizedAccounts } }
    );

    if (result.modifiedCount === 1 || result.upsertedCount === 1) {
      console.log(`Connected accounts updated for user: ${username}`);
      res.json({ success: true });
    } else {
      console.error(`Failed to update connected accounts for user: ${username}`);
      res.json({ success: false, message: 'Failed to update connected accounts.' });
    }
  } catch (error) {
    console.error('Error saving connected accounts:', error);
    res.status(500).json({ success: false, message: 'An error occurred while saving connected accounts.' });
  }
});

app.post('/admin/ban-user', async (req, res) => {
  const { username, reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ success: false, message: 'Reason is required.' });
  }

  try {
    const result = await usersCollection.updateOne(
      { username },
      { $set: { isBanned: true, banReason: reason } }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'User not found or already banned.' });
    }
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});

// Route to delete all messages from a specific user
app.post('/admin/delete-user-messages', async (req, res) => {
  const { username } = req.body;

  try {
    // TODO: Implement proper admin authentication and authorization checks here

    // Delete messages from the messagesCollection
    const messagesResult = await messagesCollection.deleteMany({ username });

    // Delete messages from the inboxCollection where fromUser is the username
    const inboxResult = await inboxCollection.deleteMany({ fromUser: username });

    // Optionally, delete messages sent to the user (if needed)
    // const inboxReceivedResult = await inboxCollection.deleteMany({ toUser: username });

    res.json({
      success: true,
      message: `Deleted ${messagesResult.deletedCount} messages from messagesCollection and ${inboxResult.deletedCount} messages from inboxCollection.`,
    });
  } catch (error) {
    console.error('Error deleting user messages:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting user messages.' });
  }
});


app.post('/admin/mute-user', async (req, res) => {
  const { username, days, hours, minutes, reason } = req.body;

  try {
    // Parse and validate inputs
    const daysInt = parseInt(days);
    const hoursInt = parseInt(hours);
    const minutesInt = parseInt(minutes);

    if (
      isNaN(daysInt) ||
      isNaN(hoursInt) ||
      isNaN(minutesInt) ||
      (daysInt === 0 && hoursInt === 0 && minutesInt === 0) ||
      daysInt < 0 ||
      hoursInt < 0 ||
      minutesInt < 0
    ) {
      return res.status(400).json({ success: false, message: 'Invalid duration values.' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Reason is required.' });
    }

    // Calculate muteUntil timestamp
    const muteUntil = new Date();
    const totalMilliseconds = ((daysInt * 24 + hoursInt) * 60 + minutesInt) * 60 * 1000;
    muteUntil.setTime(muteUntil.getTime() + totalMilliseconds);

    // Update the user's mute status in the database
    const result = await usersCollection.updateOne(
      { username },
      { $set: { muteUntil, muteReason: reason } }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error muting user:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});

app.post('/admin/unban-user', async (req, res) => {
  const { username } = req.body;

  try {
    const result = await usersCollection.updateOne(
      { username },
      { $set: { isBanned: false } }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'User not found or not banned.' });
    }
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});

app.post('/admin/unmute-user', async (req, res) => {
  const { username } = req.body;

  try {
    const result = await usersCollection.updateOne(
      { username },
      { $set: { muteUntil: null } }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'User not found or not muted.' });
    }
  } catch (error) {
    console.error('Error unmuting user:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
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
  socket.on('edit message', async ({ messageId, newContent, roomName }) => {
    console.log('Received edit message event:', { messageId, newContent, roomName });
  
    try {
      const result = await messagesCollection.updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { message: newContent, edited: true } }
      );
  
      if (result.modifiedCount === 1) {
        // Emit 'message edited' event back to clients in the room
        io.to(roomName).emit('message edited', { messageId, newContent });
      } else {
        console.error('Failed to update message in database');
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  });
  
   
  socket.on('add reaction', async ({ messageId, emoji, roomName }) => {
    try {
      // Find the message and update reactions
      const message = await messagesCollection.findOne({ _id: new ObjectId(messageId) });
  
      if (message) {
        const reactions = message.reactions || [];
        const reactionIndex = reactions.findIndex((r) => r.emoji === emoji);
  
        if (reactionIndex >= 0) {
          // Increment the count for existing reaction
          reactions[reactionIndex].count += 1;
        } else {
          // Add new reaction
          reactions.push({ emoji, count: 1 });
        }
  
        // Update the message in the database
        await messagesCollection.updateOne(
          { _id: new ObjectId(messageId) },
          { $set: { reactions: reactions } }
        );
  
        // Emit 'reaction added' event back to clients in the room
        io.to(roomName).emit('reaction added', { messageId, emoji, count: reactions.find((r) => r.emoji === emoji).count });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  });  

  // Handle when a user joins a group chat room
  socket.on('join room', async (roomName, username) => {
    // Log when a user joins a room
    console.log(`${users[socket.id]?.username || 'Unknown User'} is joining room ${roomName}`);
    socket.join(roomName);
  
    // Fetch the most recent 25 messages from the database
    const messages = await messagesCollection.find({ roomName: roomName })
      .sort({ timestamp: -1 }) // Sort by newest first
      .limit(25)
      .toArray();

    // Reverse the array to display messages in chronological order
    messages.reverse();
    // Log the messages being sent as chat history
    console.log('Sending chat history:', messages);

    // **Define 'usernames' before using it**
    const usernames = [...new Set(messages.map(msg => msg.username))];    

    // Fetch profilePics for these usernames
    const usersData = await usersCollection.find({ username: { $in: usernames } }).toArray();

    // Create a map of username to profilePic
    const userProfilePicMap = {};
    usersData.forEach(user => {
      userProfilePicMap[user.username] = user.profilePic || defaultProfilePicUrl;
    });

  // Fetch replyTo messages
  const replyToIds = messages
    .filter(msg => msg.replyTo)
    .map(msg => new ObjectId(msg.replyTo));
  const replyToMessages = await messagesCollection.find({ _id: { $in: replyToIds } }).toArray();

  const replyToMap = {};
  replyToMessages.forEach(msg => {
    replyToMap[msg._id.toString()] = {
      username: msg.username,
      message: msg.message || msg.fileName || '[File]',
      fileType: msg.fileType
    };
  });

  // Attach profilePic and replyToMessage to each message
  messages.forEach(msg => {
    msg.profilePic = userProfilePicMap[msg.username] || defaultProfilePicUrl;
    if (msg.replyTo) {
      msg.replyToMessage = replyToMap[msg.replyTo];
    }
  });

    // Send the chat history to the client
    socket.emit('chat history', messages);

    // Notify the room that a user has joined
    io.to(roomName).emit('room message', `${users[socket.id]?.username || 'Unknown User'} has joined the room.`);

  });

  // Handle 'load more messages' event
  socket.on('load more messages', async ({ roomName, lastTimestamp }) => {
    // Fetch the next 25 older messages
    const messages = await messagesCollection.find({
      roomName: roomName,
      timestamp: { $lt: new Date(lastTimestamp) }
    })
    .sort({ timestamp: -1 }) // Sort by newest first
    .limit(25)
    .toArray();
  
    // Reverse the messages to display in chronological order
    messages.reverse();
  
    // **Define 'usernames' before using it**
    const usernames = [...new Set(messages.map(msg => msg.username))];
  
    // Fetch profilePics for these usernames
    const usersData = await usersCollection.find({ username: { $in: usernames } }).toArray();
  
    // Create a map of username to profilePic
    const userProfilePicMap = {};
    usersData.forEach(user => {
      userProfilePicMap[user.username] = user.profilePic || defaultProfilePicUrl;
    });
  
    // Attach profilePic to each message
    messages.forEach(msg => {
      msg.profilePic = userProfilePicMap[msg.username] || defaultProfilePicUrl;
    });

    if (messages.length === 0) {
      socket.emit("no more history");  // Signal that no more messages are available
    } else {
      socket.emit("more chat history", messages); // Send the messages to the client
    }
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
  
    if (!user) {
      socket.emit('signin response', { success: false, message: 'Invalid username or password' });
      return;
    }
  
    // Compare the plaintext password with the hashed password
    const match = await bcrypt.compare(password, user.password);
  
    if (!match) {
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
      firstName: user.firstName,
      lastName: user.lastName,
      profilePic: user.profilePic || defaultProfilePicUrl,
      socketId: socket.id // Store socket ID for real-time notifications     
    };
  
    // Emit updated user list
    io.emit('user list', Object.values(users));
  });
  
  // Handle inbox notifications
  socket.on('check inbox', async (username) => {
    try {
      const messages = await inboxCollection.find({ toUser: username, isRead: false }).toArray();
      if (messages.length > 0) {
        socket.emit('new inbox messages', messages.length);
      }
    } catch (error) {
      console.error('Error checking inbox:', error);
    }
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

  // Emit sanitized message to all clients
  io.to(roomName).emit('chat message', {
    username: msg.username,
    message: sanitizedMessage
  });
    
  const { username, firstName, lastName, message, roomName, image } = data;

  console.log(`Message from ${username} to room ${roomName}: ${message}`);

  // Fetch user profile from MongoDB
  const user = await usersCollection.findOne({ username });
  if (!user) {
    console.error(`User ${username} not found in database`);
    return;
  }

  // Check if the user is muted
  if (user.muteUntil && new Date(user.muteUntil) > new Date()) {
    // User is muted
    socket.emit('mute notification', {
      message: `You are muted until ${new Date(user.muteUntil).toLocaleString()}. Reason: ${user.muteReason || 'No reason provided.'}`,
    });
    return; // Prevent the message from being sent
  }

  const sanitizedMessage = DOMPurify.sanitize(msg.message); // Sanitize input  

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
  await messagesCollection.createIndex({ timestamp: -1 });
  console.log('Storing message in DB:', chatMessage);

    // Emit the message to the room
    io.to(roomName).emit('chat message', {
      username: user.username,
      message: sanitizedMessage,
      image: image,
      timestamp: new Date().toLocaleTimeString(),
      profilePic: user.profilePic || '/uploads/default-avatar.png',
    });

    console.log(`Emitting message to room ${roomName}:`, {
      username: user.username,
      message: sanitizedMessage,
      image: image,
      timestamp: new Date().toLocaleTimeString(),
      profilePic: user.profilePic || '/uploads/default-avatar.png',
    });
  });
  
// Handle disconnect
  socket.on('disconnect', () => {
    const username = users[socket.id];
    //console.log(`${username || 'undefined'} has left the chat`);
    delete users[socket.id];
    io.emit('user list', Object.values(users)); // Broadcast updated user list
});

});

// Route to initialize user statuses
app.post('/admin/initialize-user-status', async (req, res) => {
  try {
    const result = await usersCollection.updateMany(
      {},
      {
        $set: {
          isBanned: false,
          muteUntil: null
        }
      }
    );
    res.json({ success: true, message: 'User statuses initialized.', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error initializing user statuses:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});


// Middleware to check if user is banned or muted
async function checkUserStatus(req, res, next) {
  const username = req.query.username || req.body.username;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  try {
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been banned. Reason: ${user.banReason || 'No reason provided'}`,
      });
    }

    // Instead of returning 403 for muted users, set req.isMuted
    if (user.muteUntil && new Date(user.muteUntil) > new Date()) {
      req.isMuted = true;
      req.muteUntil = user.muteUntil;
      req.muteReason = user.muteReason || 'No reason provided';
    } else {
      req.isMuted = false;
    }

    req.user = user; // Store user info for later use
    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
}


// Connect to MongoDB once when the server starts
async function connectDB() {
  try {
    await client.connect();
    const db = client.db('chatApp');
    usersCollection = db.collection('users');
    messagesCollection = db.collection('messages');
    inboxCollection = db.collection('inbox');
    reportsCollection = db.collection('reports'); // Initialize reports collection
    console.log('Connected to MongoDB and collections initialized');

    // Start the server after the database is connected
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);  // Exit if unable to connect to MongoDB
  }
}

connectDB();