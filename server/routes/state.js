import express from 'express';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Receipt from '../models/Receipt.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';

const router = express.Router();

// Fetch all application state
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({});
    const teachers = await Teacher.find({});
    const receipts = await Receipt.find({});
    const users = await User.find({});
    
    const settingsDocs = await Setting.find({});
    const settings = {};
    settingsDocs.forEach(doc => {
      settings[doc.key] = doc.value;
    });

    res.json({
      success: true,
      data: {
        students,
        teachers,
        receipts,
        users,
        ...settings
      }
    });
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a specific piece of state (collections or settings)
router.post('/update', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (key === 'students') {
      await Student.deleteMany({});
      if (value && value.length > 0) await Student.insertMany(value);
    } else if (key === 'teachers') {
      await Teacher.deleteMany({});
      if (value && value.length > 0) await Teacher.insertMany(value);
    } else if (key === 'receipts') {
      await Receipt.deleteMany({});
      if (value && value.length > 0) await Receipt.insertMany(value);
    } else if (key === 'users') {
      await User.deleteMany({});
      // Users are not re-hashed here to avoid double-hashing, 
      // but in a production app they should be handled properly via an auth API.
      // For this simple sync, we just save them as is.
      if (value && value.length > 0) await User.insertMany(value);
    } else {
      // It's a generic setting (e.g., expenses, timetables, classRooms, etc.)
      await Setting.findOneAndUpdate(
        { key },
        { value, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(`Error updating state for ${req.body?.key}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
