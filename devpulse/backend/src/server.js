require('dotenv').config();
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const githubRoutes = require('./routes/github');
const teamRoutes = require('./routes/team');

const app = express();

// Trust proxy for Vercel/reverse proxies (required for express-rate-limit)
app.set('trust proxy', 1);

// --- Security & core middleware ---
app.use(helmet());
app.use(express.json({ limit: '5mb' }));

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limit to reduce brute-force risk on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// Database connection middleware for Serverless (Vercel)
if (process.env.VERCEL) {
  let cachedConnection = null;
  app.use(async (req, res, next) => {
    try {
      if (!cachedConnection) {
        cachedConnection = connectDB().catch((err) => {
          cachedConnection = null; // Reset cache on failure so next request retries
          throw err;
        });
      }
      await cachedConnection;
      next();
    } catch (err) {
      next(err);
    }
  });
}

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/team', teamRoutes);

// --- 404 & error handlers ---
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`DevPulse API running on port ${PORT}`));
  });
}

module.exports = app;
