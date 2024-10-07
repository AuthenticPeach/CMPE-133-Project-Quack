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
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const defaultProfilePicUrl = 'https://res.cloudinary.com/dzify5sdy/image/upload/v1728276760/profile_pics/default-avatar.png';
const sanitizeFilename = require('sanitize-filename');



require('dotenv').config();

app.get('/img/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../img', req.params.filename); // Adjusted path
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status).end();
    }
  });
});

app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename); // Adjusted path
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

// Create a temporary directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Serve the /uploads folder to make images publicly accessible
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

let usersCollection, messagesCollection;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true })); // For URL-encoded form data
app.use(bodyParser.json()); // For JSON data
app.use(express.static('client', {
  index: false // Disable automatic serving of index.html
}));


// Error handling middleware for Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.startsWith('Invalid file type')) {
    console.error('Multer error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

// Serve the profile image from the uploads folder
app.use('/uploads', express.static('uploads'));

// Route for uploading a profile picture
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

app.post('/upload-chat', upload.single('image'), async (req, res) => {
  const message = req.body.message || '';
  const username = req.body.username || 'Unknown User';
  const roomName = req.body.roomName;

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
      fileName: fileName, // Include the sanitized file name
      timestamp: new Date()
    };
  
    try {
      // Store the message in the database
      await messagesCollection.insertOne(chatMessage);
      console.log('Storing message in DB:', chatMessage);
  
      // Fetch user profile from MongoDB
      const user = await usersCollection.findOne({ username });
      const profilePic = user ? user.profilePic || defaultProfilePicUrl : defaultProfilePicUrl;
  
      // Prepare the message to be sent to clients
      const messageToSend = {
        username: username,
        message: message,
        fileUrl: fileUrl,
        fileType: fileType,
        fileName: fileName, // Include the file name
        timestamp: new Date().toISOString(), // Full date-time
        profilePic: profilePic
      };    
  
      // Emit the message to the room
      io.to(roomName).emit('chat message', messageToSend);
      console.log(`Emitting message to room ${roomName}:`, messageToSend);
  
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
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      profilePic: user.profilePic || defaultProfilePicUrl,
      bio: user.bio || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || ''
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
///Inbox system

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

// Server-side: Return the user's contact list along with profile pictures
// server.js

app.get('/get-contacts', async (req, res) => {
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

    res.json({ success: true, message: `Removed ${contactUsername} from your contacts.` });
  } catch (error) {
    console.error('Error removing contact:', error);
    res.status(500).json({ success: false, message: 'An error occurred while removing the contact.' });
  }
});


app.post('/send-message', async (req, res) => {
  const { fromUser, toUser, message } = req.body;

  try {
    await inboxCollection.insertOne({
      fromUser: fromUser,
      toUser: toUser,
      message: message,
      timestamp: new Date(),
      isRead: false
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Error sending message.' });
  }
});

app.get('/inbox', async (req, res) => {
  const { username } = req.query;

  try {
    const messages = await inboxCollection.find({ toUser: username, isRead: false }).toArray();
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ success: false, message: 'Error fetching inbox.' });
  }
});

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

const users = {}; // Track users by socket ID
const rooms = {}; // Track rooms by room name
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);



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

    // Attach profilePic to each message
    messages.forEach(msg => {
      msg.profilePic = userProfilePicMap[msg.username] || defaultProfilePicUrl;
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
  
    // Send the messages to the client
    socket.emit('more chat history', messages);
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
      profilePic: user.profilePic || defaultProfilePicUrl
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
  
    const sanitizedMessage = DOMPurify.sanitize(msg.message); // Sanitize input

  // Emit sanitized message to all clients
  io.to(roomName).emit('chat message', {
    username: msg.username,
    message: sanitizedMessage
  });
    
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
  await messagesCollection.createIndex({ timestamp: -1 });
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
    //console.log(`${username || 'undefined'} has left the chat`);
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
