import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI;

async function checkUsers() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({}, 'username role name');
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

checkUsers().catch(console.error);
