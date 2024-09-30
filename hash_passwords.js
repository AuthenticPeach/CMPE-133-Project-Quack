const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

// Replace with your actual MongoDB connection URI
const uri = 'mongodb+srv://travispeach:ebr4SFmM7vLTp9p@quackcluster1.hwojm.mongodb.net/';
const client = new MongoClient(uri);

async function hashPasswords() {
  try {
    await client.connect();
    const db = client.db('chatApp');
    const usersCollection = db.collection('users');

    // Find all users
    const users = await usersCollection.find({}).toArray();

    for (const user of users) {
      // Check if the password is already hashed
      if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
        // Hash the plaintext password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Update the user's password in the database
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );

        console.log(`Updated password for user: ${user.username}`);
      } else {
        console.log(`Password for user ${user.username} is already hashed.`);
      }
    }
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    await client.close();
  }
}

// Corrected function call
hashPasswords();
