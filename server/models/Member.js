import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: false, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    address: { type: String, trim: true },
    joinedAt: { type: Date, default: Date.now },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

memberSchema.index({ phone: 1 }, { unique: true });

export default mongoose.model('Member', memberSchema);


