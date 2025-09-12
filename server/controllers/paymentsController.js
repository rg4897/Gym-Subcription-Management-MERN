import Payment from '../models/Payment.js';
import Member from '../models/Member.js';
import Subscription from '../models/Subscription.js';

export const listPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().populate('member');
    res.json({ payments });
  } catch (err) {
    next(err);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const { memberId, amount, method, status, notes, receivedByRole } = req.body;
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    const payment = await Payment.create({ member: memberId, amount, method, status, notes, receivedByRole });

    // Determine if fully paid for current cycle only, without mutating subscription here
    let fullyPaid = false;
    if (member.subscription) {
      const subscription = await Subscription.findById(member.subscription);
      if (subscription) {
        const payments = await Payment.find({
          member: memberId,
          status: 'success',
          date: { $gte: subscription.startDate },
        }).lean();
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const pending = Math.max((subscription.price || 0) - totalPaid, 0);
        fullyPaid = pending === 0;
      }
    }

    res.status(201).json({ payment, fullyPaid });
  } catch (err) {
    next(err);
  }
};


