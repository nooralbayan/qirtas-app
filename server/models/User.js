import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  id: { type: String },  // Custom app-level ID (from frontend)
  name: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'teacher', 'parent', 'accountant', 'hr', 'student_affairs'], 
    required: true 
  },
  phone: { type: String },
  childrenIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
