const { MongoClient } = require('mongodb');

// Replace with your actual MongoDB connection URI
const uri = 'mongodb+srv://travispeach:ebr4SFmM7vLTp9p@quackcluster1.hwojm.mongodb.net/';
const client = new MongoClient(uri);


async function normalizePhoneNumbers() {
  try {
    await client.connect();
    const db = client.db('chatApp');
    const usersCollection = db.collection('users');

    const users = await usersCollection.find({}).toArray();

    for (const user of users) {
      if (user.phoneNumber) {
        const normalizedPhoneNumber = user.phoneNumber.replace(/\D/g, '');
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { normalizedPhoneNumber: normalizedPhoneNumber } }
        );
      }
    }
    console.log('Phone numbers normalized successfully.');
  } catch (error) {
    console.error('Error normalizing phone numbers:', error);
  } finally {
    await client.close();
  }
}

normalizePhoneNumbers();
