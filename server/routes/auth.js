import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import bcrypt from 'bcrypt';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_qirtas_key_2025';

// Admin / Staff Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'اسم المستخدم غير صحيح' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'حدث خطأ في الخادم' });
  }
});

// Parent Login (Enrollment Number + Phone Number)
router.post('/parent-login', async (req, res) => {
  try {
    const { enrollmentNumber, phone } = req.body;
    
    // Find student by enrollment number
    const student = await Student.findOne({ enrollmentNumber });
    
    if (!student) {
      return res.status(401).json({ success: false, error: 'رقم القيد غير صحيح' });
    }

    // Check if phone matches fatherPhone or motherPhone
    const cleanInputPhone = phone.replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
    const cleanFatherPhone = (student.fatherPhone || '').replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
    const cleanMotherPhone = (student.motherPhone || '').replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');

    // Allow login if it matches father's or mother's phone, or if the phone stored includes the input phone (e.g. ignoring country code)
    const isFatherMatch = cleanFatherPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(cleanFatherPhone);
    const isMotherMatch = cleanMotherPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(cleanMotherPhone);

    if (!isFatherMatch && !isMotherMatch) {
      return res.status(401).json({ success: false, error: 'رقم الهاتف غير مطابق لبيانات الطالب' });
    }

    const token = jwt.sign(
      { id: student._id, role: 'parent', studentId: student.id, name: student.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: student._id,
        studentId: student.id, // Legacy ID
        name: student.fatherName || 'ولي أمر الطالب ' + student.name,
        studentName: student.name,
        role: 'parent'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'حدث خطأ في الخادم' });
  }
});

// One-time setup: Create viewer user (run once then remove)
router.post('/setup-viewer', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== 'qirtas_setup_2025') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const existing = await User.findOne({ username: 'user' });
    if (existing) {
      existing.role = 'viewer';
      existing.name = 'مشاهد';
      await User.updateOne({ username: 'user' }, {
        role: 'viewer',
        name: 'مشاهد',
        password: await bcrypt.hash('user', 10)
      });
      return res.json({ success: true, message: 'User "user" updated to viewer role.' });
    }

    await User.create({
      username: 'user',
      password: await bcrypt.hash('user', 10),
      name: 'مشاهد',
      role: 'viewer',
    });

    res.json({ success: true, message: 'Viewer user "user" created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
