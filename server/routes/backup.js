import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Setting from '../models/Setting.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Receipt from '../models/Receipt.js';
import User from '../models/User.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupsDir = path.join(__dirname, '../backups');

// Ensure the backups directory exists
const ensureBackupsDir = () => {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
};

// Create a backup
export async function createBackup() {
  ensureBackupsDir();

  // Fetch all database records
  const students = await Student.find({});
  const teachers = await Teacher.find({});
  const receipts = await Receipt.find({});
  const users = await User.find({});
  const settingsDocs = await Setting.find({});

  const settings = {};
  settingsDocs.forEach(doc => {
    // Avoid backing up the backup metadata itself
    if (doc.key !== 'last_backup_time' && doc.key !== 'last_modified_time') {
      settings[doc.key] = doc.value;
    }
  });

  const backupData = {
    students,
    teachers,
    receipts,
    users,
    ...settings
  };

  // Generate filename with timestamp (YYYY-MM-DD_HH-mm-ss)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  
  const fileName = `qirtas_backup_${dateStr}.json`;
  const filePath = path.join(backupsDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  // Update last backup time in DB
  const backupTimeStr = now.toISOString();
  await Setting.findOneAndUpdate(
    { key: 'last_backup_time' },
    { value: backupTimeStr, updatedAt: new Date() },
    { upsert: true }
  );

  // Intelligent Pruning: Keep up to 100 backups, and NEVER delete non-empty student backups
  const files = fs.readdirSync(backupsDir)
    .filter(file => file.startsWith('qirtas_backup_') && file.endsWith('.json'))
    .map(file => {
      const fPath = path.join(backupsDir, file);
      const stat = fs.statSync(fPath);
      return { file, filePath: fPath, mtime: stat.mtime };
    })
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Newest first

  files.forEach(f => {
    try {
      const content = JSON.parse(fs.readFileSync(f.filePath, 'utf-8'));
      f.studentCount = content.students?.length || 0;
    } catch {
      f.studentCount = 0;
    }
  });

  // Separate backups with actual student data vs empty backups
  const backupsWithStudents = files.filter(f => f.studentCount > 0);
  const emptyBackups = files.filter(f => f.studentCount === 0);

  // Prune empty backups aggressively if total exceeds 30
  if (emptyBackups.length > 10) {
    emptyBackups.slice(10).forEach(f => {
      try {
        fs.unlinkSync(f.filePath);
        console.log(`[Backup] Pruned empty backup file: ${f.file}`);
      } catch (e) {
        // ignore
      }
    });
  }

  // Keep up to 100 valid student backups
  if (backupsWithStudents.length > 100) {
    backupsWithStudents.slice(100).forEach(f => {
      try {
        fs.unlinkSync(f.filePath);
        console.log(`[Backup] Pruned old student backup file: ${f.file}`);
      } catch (e) {
        // ignore
      }
    });
  }

  return { fileName, timestamp: backupTimeStr };
}

// Get backup status, metadata, and list of files
router.get('/status', async (req, res) => {
  try {
    ensureBackupsDir();

    // Get last backup time & last modified time from settings
    const lastBackupDoc = await Setting.findOne({ key: 'last_backup_time' });
    const lastModifiedDoc = await Setting.findOne({ key: 'last_modified_time' });

    const lastBackupTime = lastBackupDoc ? lastBackupDoc.value : null;
    const lastModifiedTime = lastModifiedDoc ? lastModifiedDoc.value : null;

    let backupPending = false;
    if (lastModifiedTime) {
      if (!lastBackupTime) {
        backupPending = true;
      } else {
        backupPending = new Date(lastModifiedTime) > new Date(lastBackupTime);
      }
    }

    // List recent backups
    const backups = fs.readdirSync(backupsDir)
      .filter(file => file.startsWith('qirtas_backup_') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stat = fs.statSync(filePath);
        return {
          fileName: file,
          size: stat.size,
          mtime: stat.mtime
        };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Newest first

    res.json({
      success: true,
      lastBackupTime,
      lastModifiedTime,
      backupPending,
      backups
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run a manual backup
router.post('/run', async (req, res) => {
  try {
    const result = await createBackup();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download a backup file
router.get('/download/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    // Prevent directory traversal attacks
    if (path.basename(fileName) !== fileName) {
      return res.status(400).json({ error: 'اسم الملف غير صالح' });
    }
    const filePath = path.join(backupsDir, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'الملف غير موجود' });
    }
    res.download(filePath, fileName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore database from a backup file on the server
router.post('/restore/:fileName', async (req, res) => {
  try {
    const fileName = req.params.fileName;
    // Prevent directory traversal attacks
    if (path.basename(fileName) !== fileName) {
      return res.status(400).json({ error: 'اسم الملف غير صالح' });
    }
    const filePath = path.join(backupsDir, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'ملف النسخة الاحتياطية غير موجود' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`Starting restore from backup: ${fileName}...`);

    // 1. Restore Students
    if (data.students) {
      await Student.deleteMany({});
      if (data.students.length > 0) await Student.insertMany(data.students);
    }
    
    // 2. Restore Teachers
    if (data.teachers) {
      await Teacher.deleteMany({});
      if (data.teachers.length > 0) await Teacher.insertMany(data.teachers);
    }

    // 3. Restore Receipts
    if (data.receipts) {
      await Receipt.deleteMany({});
      if (data.receipts.length > 0) await Receipt.insertMany(data.receipts);
    }

    // 4. Restore Users
    if (data.users) {
      await User.deleteMany({});
      if (data.users.length > 0) await User.insertMany(data.users);
    }

    // 5. Restore Settings keys
    const excludeKeys = ['students', 'teachers', 'receipts', 'users', 'last_backup_time', 'last_modified_time'];
    const settingKeys = Object.keys(data).filter(k => !excludeKeys.includes(k));
    
    // Clear other settings
    await Setting.deleteMany({ key: { $nin: ['last_backup_time', 'last_modified_time'] } });
    
    for (const key of settingKeys) {
      await Setting.findOneAndUpdate(
        { key },
        { value: data[key], updatedAt: new Date() },
        { upsert: true }
      );
    }

    // Reset status times to avoid false alarms
    const now = new Date().toISOString();
    await Setting.findOneAndUpdate(
      { key: 'last_backup_time' },
      { value: now, updatedAt: new Date() },
      { upsert: true }
    );
    await Setting.findOneAndUpdate(
      { key: 'last_modified_time' },
      { value: now, updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ success: true, message: 'تمت استعادة البيانات بنجاح' });
  } catch (error) {
    console.error('Failed to restore backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
