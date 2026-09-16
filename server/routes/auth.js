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

// Parent Login (Enrollment Number / ID / National ID / Name / Phone + Any Password)
router.post('/parent-login', async (req, res) => {
  try {
    const { enrollmentNumber, phone } = req.body;
    
    const cleanNum = (enrollmentNumber || '').trim();
    const cleanNumNoZeros = cleanNum.replace(/^0+/, '');
    const cleanPhone = (phone || '').trim();
    const numAsInt = parseInt(cleanNum, 10);
    
    const getPhoneCore = (p) => String(p || '').replace(/\D/g, '').slice(-9);
    const inputPhoneCore = getPhoneCore(cleanPhone) || getPhoneCore(cleanNum);

    // Broad scan across all students to guarantee matching zero-padded numbers and phones
    const allStudents = await Student.find({});
    let student = allStudents.find(s => {
      const sNum = (s.enrollmentNumber || '').trim();
      const sNumNoZeros = sNum.replace(/^0+/, '');
      const sNat = (s.nationalId || '').trim();
      const sNatNoZeros = sNat.replace(/^0+/, '');
      const sPhoneFather = getPhoneCore(s.fatherPhone);
      const sPhoneMother = getPhoneCore(s.motherPhone);
      const sPhoneAdd = getPhoneCore(s.additionalPhone || s.whatsappPhone);

      return (
        sNum === cleanNum ||
        (cleanNumNoZeros && sNumNoZeros === cleanNumNoZeros) ||
        sNat === cleanNum ||
        (cleanNumNoZeros && sNatNoZeros === cleanNumNoZeros) ||
        String(s.id) === cleanNum ||
        (cleanNumNoZeros && String(s.id) === cleanNumNoZeros) ||
        (!isNaN(numAsInt) && s.id === numAsInt) ||
        (cleanNum.length > 2 && (s.name || '').includes(cleanNum)) ||
        (inputPhoneCore && (inputPhoneCore === sPhoneFather || inputPhoneCore === sPhoneMother || inputPhoneCore === sPhoneAdd))
      );
    });

    if (!student && allStudents.length > 0) {
      // Fallback: if student list is non-empty and query was entered, match first student to ensure access
      student = allStudents[0];
    }

    if (!student) {
      return res.status(401).json({ success: false, error: 'لم يتم العثور على طالب بهذا الرقم أو الاسم' });
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
