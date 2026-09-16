import express from 'express';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Receipt from '../models/Receipt.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';

const router = express.Router();

function sanitizeStudent(s) {
  const obj = s && s.toObject ? s.toObject() : { ...s };
  
  let cleanStatus = 'غير مسدد';
  if (obj.paymentStatus === 'مسدد' || String(obj.paymentStatus).includes('مسدد')) {
    cleanStatus = 'مسدد';
  } else if (obj.paymentStatus === 'جزئي' || String(obj.paymentStatus).includes('جزئي')) {
    cleanStatus = 'جزئي';
  }

  let cleanGender = obj.gender || 'غير محدد';
  if (cleanGender !== 'ذكر' && cleanGender !== 'أنثى') {
    if (obj.nationalId && String(obj.nationalId).startsWith('1')) cleanGender = 'ذكر';
    else if (obj.nationalId && String(obj.nationalId).startsWith('2')) cleanGender = 'أنثى';
  }

  return {
    ...obj,
    nationalId: obj.nationalId || '',
    paymentStatus: cleanStatus,
    gender: cleanGender,
    enrollmentNumber: obj.enrollmentNumber || '',
  };
}

// Fetch all application state
router.get('/', async (req, res) => {
  try {
    const rawStudents = await Student.find({});
    const students = rawStudents.map(sanitizeStudent);
    const teachers = await Teacher.find({});
    const receipts = await Receipt.find({});
    const rawUsers = await User.find({});
    
    // Normalize users: ensure 'id' field exists and password is included
    const users = rawUsers.map(u => {
      const obj = u.toObject ? u.toObject() : { ...u };
      return {
        id: obj.id || (obj._id ? obj._id.toString() : undefined),
        username: obj.username,
        name: obj.name,
        password: obj.password,
        role: obj.role,
      };
    });
    
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
      const currentCount = await Student.countDocuments({});
      const incoming = Array.isArray(value) ? value : [];
      const newCount = incoming.length;

      // 🛑 SAFETY GUARD: Prevent accidental data wipes
      if (currentCount > 0 && newCount === 0 && !req.body.confirmWipe) {
        console.warn(`⚠️ [SAFETY GUARD] Blocked wipe of ${currentCount} students!`);
        return res.status(400).json({
          success: false,
          error: `حماية النظام: تم منع محاولة مسح ${currentCount} طالب عن طريق الخطأ.`
        });
      }

      if (newCount === 0) {
        // Only wipe if explicitly confirmed
        await Student.deleteMany({});
      } else {
        // ✅ SAFE ATOMIC UPSERT: Never delete-then-insert (race condition risk)
        const cleanStudents = incoming.map(sanitizeStudent);

        // bulkWrite with upsert: updates existing, inserts new, never deletes first
        const bulkOps = cleanStudents.map(s => ({
          updateOne: {
            filter: { id: s.id },
            update: { $set: s },
            upsert: true,
          }
        }));

        await Student.bulkWrite(bulkOps, { ordered: false });

        // Remove students that are no longer in the new list
        const incomingIds = cleanStudents.map(s => s.id);
        const removeResult = await Student.deleteMany({ id: { $nin: incomingIds } });
        if (removeResult.deletedCount > 0) {
          console.log(`[State] Removed ${removeResult.deletedCount} stale students from DB`);
        }
      }

    } else if (key === 'teachers') {
      await Teacher.deleteMany({});
      if (value && value.length > 0) await Teacher.insertMany(value);
    } else if (key === 'receipts') {
      await Receipt.deleteMany({});
      if (value && value.length > 0) await Receipt.insertMany(value);
    } else if (key === 'users') {
      if (value && value.length > 0) {
        // Use upsert by 'id' field to preserve passwords and avoid data loss
        const bulkOps = value.map(u => ({
          updateOne: {
            filter: { id: u.id },
            update: { $set: { id: u.id, username: u.username, name: u.name, password: u.password, role: u.role } },
            upsert: true,
          }
        }));
        await User.bulkWrite(bulkOps, { ordered: false });
        // Remove users not in the new list
        const incomingIds = value.map(u => u.id);
        await User.deleteMany({ id: { $nin: incomingIds } });
      }
    } else {
      // Generic setting (expenses, timetables, classRooms, etc.)
      await Setting.findOneAndUpdate(
        { key },
        { value, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    if (key !== 'last_backup_time' && key !== 'last_modified_time') {
      await Setting.findOneAndUpdate(
        { key: 'last_modified_time' },
        { value: new Date().toISOString(), updatedAt: new Date() },
        { upsert: true }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(`Error updating state for ${req.body?.key}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
