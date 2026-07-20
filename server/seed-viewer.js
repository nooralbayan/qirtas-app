import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qirtas';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const existing = await User.findOne({ username: 'user' });
  if (existing) {
    console.log('ℹ️  User "user" already exists. Updating role to viewer...');
    existing.role = 'viewer';
    existing.name = 'مشاهد';
    const salt = await bcrypt.genSalt(10);
    existing.password = await bcrypt.hash('user', salt);
    await existing.save({ validateBeforeSave: false });
    // bypass pre-save hash by setting directly
    await User.updateOne({ username: 'user' }, { password: await bcrypt.hash('user', 10) });
    console.log('✅ Updated successfully.');
  } else {
    const hashed = await bcrypt.hash('user', 10);
    await User.create({
      username: 'user',
      password: hashed,
      name: 'مشاهد',
      role: 'viewer',
    });
    console.log('✅ Viewer user "user" created successfully.');
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected.');
}

seed().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
