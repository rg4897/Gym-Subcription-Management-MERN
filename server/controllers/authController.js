import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

function createToken(admin) {
  const payload = { id: admin._id, email: admin.email, role: admin.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });
    const admin = await Admin.create({ name, email, password });
    const token = createToken(admin);
    res.status(201).json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = createToken(admin);
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    next(err);
  }
};

export const profile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    res.json({ admin });
  } catch (err) {
    next(err);
  }
};


