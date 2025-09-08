import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    status: { type: String, enum: ['active', 'expired', 'pending'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Subscription', subscriptionSchema);


