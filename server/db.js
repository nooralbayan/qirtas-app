import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix for Windows DNS resolution of MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qirtas';
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
