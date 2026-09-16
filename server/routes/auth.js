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

// Parent Login (Enrollment Number / ID / National ID / Name + Phone / Any Password)
router.post('/parent-login', async (req, res) => {
  try {
    const { enrollmentNumber, phone } = req.body;
    
    const cleanNum = (enrollmentNumber || '').trim();
    const cleanPhone = (phone || '').trim();
    const numAsInt = parseInt(cleanNum, 10);
    
    // Find student by enrollment number, ID, nationalId, or student name
    const query = {
      $or: [
        { enrollmentNumber: cleanNum },
        { enrollmentNumber: cleanNum.replace(/^0+/, '') },
        { enrollmentNumber: String(numAsInt) },
        { id: isNaN(numAsInt) ? -1 : numAsInt },
        { nationalId: cleanNum },
        { name: { $regex: cleanNum, $options: 'i' } }
      ]
    };
    let student = await Student.findOne(query);
    
    if (!student) {
      // Broad fallback scan across all students
      const allStudents = await Student.find({});
      student = allStudents.find(s => 
        (s.enrollmentNumber || '').trim() === cleanNum ||
        (s.enrollmentNumber || '').trim().replace(/^0+/, '') === cleanNum ||
        (s.nationalId || '').trim() === cleanNum ||
        String(s.id) === cleanNum ||
        (s.name || '').includes(cleanNum)
      );
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
