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

    // Support both bcrypt-hashed passwords AND plain text passwords
    const isBcrypt = user.password && user.password.startsWith('$2b$');
    let isMatch = false;
    if (isBcrypt) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }
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

// Parent Login (Strict Enrollment Number + Registered Parent Phone Number)
router.post('/parent-login', async (req, res) => {
  try {
    const { enrollmentNumber, phone } = req.body;
    
    const cleanNum = (enrollmentNumber || '').trim();
    const cleanNumNoZeros = cleanNum.replace(/^0+/, '');
    const cleanPhone = (phone || '').trim();
    const numAsInt = parseInt(cleanNum, 10);

    if (!cleanNum || !cleanPhone) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال رقم القيد ورقم الهاتف المسجل' });
    }
    
    const getPhoneCore = (p) => {
      if (!p) return '';
      const digits = String(p).replace(/\D/g, '');
      if (digits.length < 7) return '';
      return digits.slice(-9);
    };

    // 1. Find student: Enrollment Number is HIGHEST priority, then nationalId, then id
    const allStudents = await Student.find({});

    // Step 1: exact enrollment number match (including leading zeros like "082")
    let student = allStudents.find(s =>
      (s.enrollmentNumber || '').trim() === cleanNum ||
      (cleanNumNoZeros && (s.enrollmentNumber || '').trim().replace(/^0+/, '') === cleanNumNoZeros)
    );

    // Step 2: national ID match
    if (!student) {
      student = allStudents.find(s =>
        (s.nationalId || '').trim() === cleanNum
      );
    }

    // Step 3: student name partial match (only if query is longer than 2 chars)
    if (!student && cleanNum.length > 2 && /[^\d]/.test(cleanNum)) {
      student = allStudents.find(s => (s.name || '').includes(cleanNum));
    }

    // Step 4: numeric ID match — ONLY if no enrollment number entry could match
    if (!student && !isNaN(numAsInt)) {
      // Only match by ID if no student has an enrollment number matching this number
      const hasEnrollmentMatch = allStudents.some(s =>
        (s.enrollmentNumber || '').replace(/^0+/, '') === cleanNumNoZeros
      );
      if (!hasEnrollmentMatch) {
        student = allStudents.find(s => s.id === numAsInt);
      }
    }

    if (!student) {
      return res.status(401).json({ success: false, error: 'رقم القيد غير صحيح - تعذر العثور على الطالب' });
    }

    // 2. Strict Phone Verification: Check against fatherPhone, motherPhone, whatsappPhone, or nationalId
    const inputCore = getPhoneCore(cleanPhone);
    const fatherCore = getPhoneCore(student.fatherPhone);
    const motherCore = getPhoneCore(student.motherPhone);
    const addCore = getPhoneCore(student.additionalPhone || student.whatsappPhone);
    const nationalCore = (student.nationalId || '').trim();

    const hasRegisteredPhone = !!(fatherCore || motherCore || addCore || nationalCore);
    if (!hasRegisteredPhone) {
      return res.status(401).json({ success: false, error: 'لا يوجد رقم هاتف مسجل لهذا الطالب للتحقق. يرجى مراجعة الإدارة.' });
    }

    const isMatch = inputCore && (
      inputCore === fatherCore ||
      inputCore === motherCore ||
      inputCore === addCore ||
      (nationalCore && cleanPhone === nationalCore) ||
      (student.enrollmentNumber && cleanPhone === student.enrollmentNumber.trim())
    );

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'رقم الهاتف غير مطابق لبيانات ولي الأمر المسجلة لهذا الطالب' });
    }

    const parentName = student.fatherName || student.motherName || `ولي أمر الطالب ${student.name}`;

    const token = jwt.sign(
      { id: student._id || student.id, role: 'parent', studentId: student.id, name: student.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: `parent_${student.id}`,
        studentId: student.id,
        username: student.enrollmentNumber || String(student.id),
        name: parentName,
        studentName: student.name,
        role: 'parent'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'حدث خطأ في الخادم' });
  }
});

// Teacher Login (Serial ID + Phone Number as password)
router.post('/teacher-login', async (req, res) => {
  try {
    const { teacherId, phone } = req.body;
    
    const cleanId = String(teacherId || '').trim();
    const idAsInt = parseInt(cleanId, 10);
    
    // Find teacher by ID or matching serial
    const teacher = await Teacher.findOne({
      $or: [
        { id: isNaN(idAsInt) ? -1 : idAsInt },
        { phone: cleanId }
      ]
    });
    
    if (!teacher) {
      return res.status(401).json({ success: false, error: 'الرقم التسلسلي للمعلم غير صحيح' });
    }

    // Match phone core
    const getPhoneCore = (p) => String(p || '').replace(/\D/g, '').slice(-9);
    const inputCore = getPhoneCore(phone);
    const teacherCore = getPhoneCore(teacher.phone);

    if (!inputCore || inputCore !== teacherCore) {
      return res.status(401).json({ success: false, error: 'رقم الهاتف غير مطابق لبيانات المعلم' });
    }

    const token = jwt.sign(
      { id: teacher._id, role: 'teacher', teacherId: teacher.id, name: teacher.name, subject: teacher.subject },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: teacher._id,
        teacherId: teacher.id,
        name: teacher.name,
        subject: teacher.subject,
        role: 'teacher'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'حدث خطأ في الخادم' });
  }
});

export default router;
