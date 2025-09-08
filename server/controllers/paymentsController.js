import Payment from '../models/Payment.js';
import Member from '../models/Member.js';

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
    const { memberId, amount, method, status, notes } = req.body;
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    const payment = await Payment.create({ member: memberId, amount, method, status, notes });
    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
};


