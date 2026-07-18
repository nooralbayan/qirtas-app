import express from 'express';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Receipt from '../models/Receipt.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/migrate', async (req, res) => {
  try {
    const { students, teachers, receipts, users, settings } = req.body;
    
    console.log('Starting data migration...');

    // 1. Migrate Students
    if (students && students.length > 0) {
      await Student.deleteMany({});
      await Student.insertMany(students);
      console.log(`Migrated ${students.length} students`);
    }

    // 2. Migrate Teachers
    if (teachers && teachers.length > 0) {
      await Teacher.deleteMany({});
      await Teacher.insertMany(teachers);
      console.log(`Migrated ${teachers.length} teachers`);
    }

    // 3. Migrate Receipts
    if (receipts && receipts.length > 0) {
      await Receipt.deleteMany({});
      await Receipt.insertMany(receipts);
      console.log(`Migrated ${receipts.length} receipts`);
    }

    // 4. Migrate Users (Passwords need hashing if not already done)
    if (users && users.length > 0) {
      await User.deleteMany({});
      const hashedUsers = await Promise.all(users.map(async (u) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password || '123456', salt);
        return {
          name: u.name,
          username: u.username,
          password: hashedPassword,
          role: u.role
        };
      }));
      await User.insertMany(hashedUsers);
      console.log(`Migrated ${users.length} users`);
    }

    // 5. Migrate Settings
    if (settings) {
      await Setting.deleteMany({});
      const settingsArray = Object.keys(settings).map(key => ({
        key,
        value: settings[key]
      }));
      await Setting.insertMany(settingsArray);
      console.log(`Migrated ${settingsArray.length} settings`);
    }

    res.json({ success: true, message: 'Data migration completed successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
