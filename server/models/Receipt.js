import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Legacy ID like REC-0001
  studentId: { type: Number, required: true },
  studentName: { type: String, required: true },
  grade: { type: String, required: true },
  installmentNo: { type: Number, required: true },
  totalDue: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  remaining: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['نقدي', 'بطاقة مصرفية', 'حوالة مصرفية'], required: true },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Receipt', receiptSchema);
