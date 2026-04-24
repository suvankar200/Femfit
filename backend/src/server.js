import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import cycleRoutes from './routes/cycle.js';
import assessRoutes from './routes/assess.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();

// ── Trust Render's proxy so rate limiting works correctly ─────────────────────
app.set('trust proxy', 1);

// ── Security Headers (no helmet needed) ───────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Powered-By', ''); // Remove Express fingerprint
  res.removeHeader('X-Powered-By');
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, Vercel proxy, mobile apps)
    if (!origin) return cb(null, true);
    // Allow localhost in dev and the deployed Vercel frontend
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') // covers all Vercel preview URLs
    ) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin not allowed`));
  },
  credentials: true,
}));

// ── Body parser — limit size to prevent large payload attacks ─────────────────
app.use(express.json({ limit: '10kb' }));

// ── NoSQL Injection Sanitizer ─────────────────────────────────────────────────
// Strips keys that start with '$' or contain '.' to block MongoDB operator injection
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue; // drop dangerous keys
    const val = obj[key];
    clean[key] = typeof val === 'object' ? sanitizeObject(val) : val;
  }
  return clean;
};
app.use((req, res, next) => {
  if (req.body)  req.body  = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────

// Auth: max 10 attempts per IP per 15 min (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Chat: max 30 messages per IP per 10 min (protects AI API quota)
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { message: 'Too many chat requests. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: max 200 requests per IP per 15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cycle', cycleRoutes);
app.use('/api/assess', assessRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/user', userRoutes);

// ── Health check (for Render/UptimeRobot ping) ────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler — never expose stack traces ─────────────────────────
app.use((err, req, res, next) => {
  // Log internally but never send details to client
  console.error(`[ERROR] ${req.method} ${req.path} —`, err.message);
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} — connected to MongoDB Atlas`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
