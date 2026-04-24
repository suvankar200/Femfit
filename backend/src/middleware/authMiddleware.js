import jwt from 'jsonwebtoken';
import { findById } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Reject obviously malformed tokens early
      if (!token || token.split('.').length !== 3) {
        return res.status(401).json({ message: 'Not authorized.' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'Not authorized.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      // Log only the error type, not the full token or message
      console.error('[AUTH] Token verification failed:', error.name);
      return res.status(401).json({ message: 'Not authorized.' });
    }
  }

  return res.status(401).json({ message: 'Not authorized.' });
};
