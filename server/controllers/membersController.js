import Member from '../models/Member.js';
import Subscription from '../models/Subscription.js';

export const listMembers = async (req, res, next) => {
  try {
    const members = await Member.find().populate('subscription');
    res.json({ members });
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


