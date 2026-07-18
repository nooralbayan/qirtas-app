import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  id: { type: Number, required: true }, // Legacy ID from local storage
  enrollmentNumber: { type: String, required: true, unique: true },
  nationalId: { type: String, required: true },
  name: { type: String, required: true },
  photo: { type: String, default: null },
  birthDate: { type: String },
  grade: { type: String, required: true },
  classRoom: { type: String, required: true },
  address: { type: String },
  fatherName: { type: String },
  fatherPhone: { type: String },
  motherName: { type: String },
  motherPhone: { type: String },
  gender: { type: String, enum: ['ذكر', 'أنثى', 'غير محدد'], default: 'غير محدد' },
  specialNeeds: { type: String },
  medicalCondition: { type: String },
  medication: { type: String },
  missingItems: { type: String },
  notes: { type: String },
  totalFees: { type: Number, required: true, default: 0 },
  installmentsCount: { type: Number, default: 1 },
  paymentStatus: { type: String, enum: ['مسدد', 'جزئي', 'غير مسدد'], default: 'غير مسدد' },
  wasWithdrawn: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Student', studentSchema);
