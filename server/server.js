import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import paymentRoutes from './routes/payments.js';
import { scheduleReminders } from './cron/reminders.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/payments', paymentRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ message });
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    // start cron reminders
    scheduleReminders();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();


