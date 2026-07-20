import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true }, // For login
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'teacher', 'parent', 'accountant', 'hr', 'student_affairs', 'viewer'], 
    required: true 
  },
  phone: { type: String }, // Useful for WhatsApp & Parents
  // For teachers: list of classes/subjects they teach (optional, can be inferred from timetable)
  // For parents: list of student IDs they are related to
  childrenIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
