import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  register,
  login,
  refresh,
  logout,
} from '../controllers/auth.controller.js';

import { getCurrentUser } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// Registration
router.post('/register', authLimiter, register);

// Login
router.post('/login', authLimiter, login);

// Refresh authentication tokens
router.post('/refresh', authLimiter, refresh);

// Logout
router.post('/logout', logout);

// Get currently authenticated user
router.get('/me', authenticate, getCurrentUser);

export default router;


/*
| Method | Endpoint             | Purpose                        |
|--------|----------------------|--------------------------------|
| POST   | /api/auth/register   | Create an account              |
| POST   | /api/auth/login      | Authenticate a user            |
| POST   | /api/auth/refresh    | Refresh authentication tokens  |
| POST   | /api/auth/logout     | Revoke the current session     |
The rate limiter allows a maximum of 10 requests per IP address within 15 minutes to these authentication endpoints.
*/