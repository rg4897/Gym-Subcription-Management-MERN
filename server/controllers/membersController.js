import Member from '../models/Member.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';

export const listMembers = async (req, res, next) => {
  try {
    const members = await Member.find().populate('subscription');

    // Compute pending amount: subscription.price - sum(payments since subscription.startDate)
    const enriched = await Promise.all(
      members.map(async (m) => {
        let pendingAmount = 0;
        let lastPaymentDate = null;

        if (m.subscription) {
          const now = new Date();
          const startDateOrig = m.subscription.startDate || new Date(0);
          const endDate = m.subscription.endDate || startDateOrig;
          // If subscription expired, start a new pending cycle from endDate
          const cycleStart = now > endDate ? endDate : startDateOrig;
          const payments = await Payment.find({
            member: m._id,
            status: 'success',
            date: { $gte: cycleStart },
          })
            .sort({ date: -1 })
            .lean();

          const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
          pendingAmount = Math.max((m.subscription.price || 0) - totalPaid, 0);
          lastPaymentDate = payments[0]?.date || null;
        }

        const obj = m.toObject();
        obj.pendingAmount = pendingAmount;
        obj.lastPayment = lastPaymentDate;
        return obj;
      })
    );

    res.json({ members: enriched });
  } catch (err) {
    next(err);
  }
};

export const createMember = async (req, res, next) => {
  try {
    const exists = await Member.findOne({ phone: req.body.phone });
    if (exists) return res.status(409).json({ message: 'Member with this phone already exists' });
    const member = await Member.create(req.body);
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
};

export const getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id).populate('subscription');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json({ member });
  } catch (err) {
    next(err);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    if (req.body.phone) {
      const exists = await Member.findOne({ phone: req.body.phone, _id: { $ne: req.params.id } });
      if (exists) return res.status(409).json({ message: 'Member with this phone already exists' });
    }
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json({ member });
  } catch (err) {
    next(err);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    await Subscription.deleteMany({ member: member._id });
    res.json({ message: 'Member deleted' });
  } catch (err) {
    next(err);
  }
};

export const setSubscription = async (req, res, next) => {
  try {
    const { planName, price, durationDays, startDate } = req.body;
    const memberId = req.params.id;
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + Number(durationDays));

    const subscription = await Subscription.create({
      planName,
      price,
      durationDays,
      startDate: start,
      endDate: end,
      member: memberId,
    });

    await Member.findByIdAndUpdate(memberId, { subscription: subscription._id });
    res.status(201).json({ subscription });
  } catch (err) {
    next(err);
  }
};


