import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './models/User.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: '../.env' });

const resetPasswords = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected to DB');

    // Remove hashed passwords and set them to '123' without triggering the pre-save hook
    await User.collection.updateMany({}, { $set: { password: '123' } });
    
    console.log('Successfully reset all user passwords to "123" (plain text).');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetPasswords();
