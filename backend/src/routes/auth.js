import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';
import { findByEmail, createUser, findById } from '../models/User.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Email validation helper
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, language } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (!isValidEmail(email.trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (name.trim().length < 2 || name.trim().length > 60) {
    return res.status(400).json({ message: 'Name must be between 2 and 60 characters.' });
  }
  if (password.length < 6 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be between 6 and 128 characters.' });
  }

  try {
    const userExists = await findByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    const salt = await bcrypt.genSalt(12); // 12 rounds for production security
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      language: ['en', 'hi', 'bn'].includes(language) ? language : 'en',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Registration failed. Please try again.' });
    }
  } catch (error) {
    console.error('[REGISTER ERROR]', error.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        language: user.language || 'en',
        token: generateToken(user._id),
      });
    } else {
      // Same message for wrong email OR wrong password (prevents user enumeration)
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('[LOGIN ERROR]', error.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('[PROFILE ERROR]', error.message);
    res.status(500).json({ message: 'Could not fetch profile.' });
  }
});

export default router;
