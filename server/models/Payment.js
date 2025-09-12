import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'card', 'upi', 'bank'], default: 'cash' },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    date: { type: Date, default: Date.now },
    receivedByRole: { type: String, enum: ['Admin', 'Trainer', 'Others'], default: 'Admin' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);


