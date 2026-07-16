import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qirtas';
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed: ${error.message}`);
      if (i < retries - 1) {
        console.log('⏳ Retrying in 5 seconds...');
        await new Promise(r => setTimeout(r, 5000));
      } else {
        console.error('❌ All MongoDB connection attempts failed. Server running without DB.');
      }
    }
  }
};


export default connectDB;
