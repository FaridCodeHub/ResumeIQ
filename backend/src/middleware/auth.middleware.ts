import type { RequestHandler } from 'express';
import type { QueryResultRow } from 'pg';

import { pool } from '../config/db.js';
import { verifyAccessToken } from '../utils/token.js';

type UserRole = 'user' | 'admin';

export interface AuthenticatedUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UserRow extends QueryResultRow {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
}

const ACCESS_COOKIE = 'resumeiq_access';

export const authenticate: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];

    if (!token || typeof token !== 'string') {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
      return;
    }

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch {
      res.clearCookie(ACCESS_COOKIE, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite:
          (process.env.COOKIE_SAME_SITE as
            | 'strict'
            | 'lax'
            | 'none') || 'lax',
        path: '/',
      });

      res.status(401).json({
        success: false,
        message: 'Your session is invalid or expired. Please log in again.',
      });
      return;
    }

    // Verify that the access token belongs to an active database session.
    const sessionResult = await pool.query(
      `SELECT session_id
       FROM auth_sessions
       WHERE session_id = $1
         AND user_id = $2
         AND revoked_at IS NULL
         AND expires_at > CURRENT_TIMESTAMP`,
      [payload.sid, payload.sub]
    );

    if (sessionResult.rows.length === 0) {
      res.clearCookie(ACCESS_COOKIE, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite:
          (process.env.COOKIE_SAME_SITE as
            | 'strict'
            | 'lax'
            | 'none') || 'lax',
        path: '/',
      });

      res.status(401).json({
        success: false,
        message: 'Your session is no longer active. Please log in again.',
      });
      return;
    }

    // Retrieve the current user information and role.
    const result = await pool.query<UserRow>(
      `SELECT user_id, name, email, role
       FROM users
       WHERE user_id = $1`,
      [payload.sub]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
      return;
    }

    const row = result.rows[0];

    if (!row) {
      res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
      return;
    }

    const authenticatedUser: AuthenticatedUser = {
      userId: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
    };

    res.locals.authUser = authenticatedUser;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to authenticate your request.',
    });
  }
};

export function authorizeRoles(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.authUser as
      | AuthenticatedUser
      | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
}