import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { findById, updateProfile } from '../models/User.js';

const router = express.Router();

// GET /api/user/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/user/profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, dateOfBirth } = req.body;
    if (name && name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }
    const updated = await updateProfile(req.user._id, {
      name: name?.trim(),
      dateOfBirth: dateOfBirth || null,
    });
    const { password, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
