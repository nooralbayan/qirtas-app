import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  phone: { type: String, required: true },
  salary: { type: Number, required: true },
  hireDate: { type: String, required: true },
  isAbsent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Teacher', teacherSchema);
