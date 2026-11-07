import { randomUUID, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { PoolClient } from 'pg';

import { pool } from '../config/db.js';
import { authConfig } from '../config/auth.js';

import { hashPassword, verifyPassword } from '../utils/password.js';

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';

import type {
  RegisterInput,
  LoginInput,
} from '../validators/auth.validator.js';

type UserRole = 'user' | 'admin';

interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

interface SessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function hashRefreshToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

function getTokenExpiry(token: string): Date {
  const decoded = verifyRefreshToken(token);

  if (!decoded.exp) {
    throw new AuthServiceError('Invalid refresh token.', 401);
  }

  return new Date(decoded.exp * 1000);
}

async function createSession(
  client: PoolClient,
  userId: string,
  user: AuthUser,
  metadata: SessionMetadata
): Promise<AuthResult> {
  const sessionId = randomUUID();

  const refreshToken = generateRefreshToken(
    userId,
    sessionId
  );

  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getTokenExpiry(refreshToken);

  await client.query(
    `INSERT INTO auth_sessions (
      session_id,
      user_id,
      refresh_token_hash,
      expires_at,
      user_agent,
      ip_address
    )
    VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      sessionId,
      userId,
      refreshTokenHash,
      expiresAt,
      metadata.userAgent || null,
      metadata.ipAddress || null,
    ]
  );

  const accessToken = generateAccessToken(
    userId,
    sessionId,
    user.role
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
}

function isDuplicateEmailError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

export async function registerUser(
  input: RegisterInput,
  metadata: SessionMetadata
): Promise<AuthResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = await hashPassword(input.password);

    const userResult = await client.query(
      `INSERT INTO users (
        name,
        email,
        password_hash,
        role
      )
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, name, email, role`,
      [
        input.name,
        input.email,
        passwordHash,
        'user',
      ]
    );

    const row = userResult.rows[0];

    const user: AuthUser = {
      userId: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
    };

    const authResult = await createSession(
      client,
      user.userId,
      user,
      metadata
    );

    await client.query('COMMIT');

    return authResult;

  } catch (error) {
    await client.query('ROLLBACK');

    if (isDuplicateEmailError(error)) {
      throw new AuthServiceError(
        'An account with this email already exists.',
        409
      );
    }

    throw error;

  } finally {
    client.release();
  }
}

export async function loginUser(
  input: LoginInput,
  metadata: SessionMetadata
): Promise<AuthResult> {
  const userResult = await pool.query(
    `SELECT
      user_id,
      name,
      email,
      password_hash,
      role
    FROM users
    WHERE email = $1`,
    [input.email]
  );

  if (userResult.rows.length === 0) {
    throw new AuthServiceError(
      'Invalid email or password.',
      401
    );
  }

  const row = userResult.rows[0];

  const passwordMatches = await verifyPassword(
    input.password,
    row.password_hash
  );

  if (!passwordMatches) {
    throw new AuthServiceError(
      'Invalid email or password.',
      401
    );
  }

  const user: AuthUser = {
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
  };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const authResult = await createSession(
      client,
      user.userId,
      user,
      metadata
    );

    await client.query('COMMIT');

    return authResult;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
}

export async function refreshUserSession(
  refreshToken: string
): Promise<AuthResult> {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthServiceError(
      'Invalid or expired refresh token.',
      401
    );
  }

  const client = await pool.connect();

  let tokenReuseDetected = false;

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `SELECT
        s.session_id,
        s.user_id,
        s.refresh_token_hash,
        s.expires_at,
        s.revoked_at,
        u.name,
        u.email,
        u.role
      FROM auth_sessions s
      INNER JOIN users u ON u.user_id = s.user_id
      WHERE s.session_id = $1
        AND s.user_id = $2
      FOR UPDATE OF s`,
      [payload.sid, payload.sub]
    );

    if (sessionResult.rows.length === 0) {
      throw new AuthServiceError(
        'Session not found.',
        401
      );
    }

    const row = sessionResult.rows[0];

    if (row.revoked_at || new Date(row.expires_at) <= new Date()) {
      throw new AuthServiceError(
        'Session has expired or been revoked.',
        401
      );
    }

    const providedHash = hashRefreshToken(refreshToken);

    if (providedHash !== row.refresh_token_hash.trim()) {
      await client.query(
        `UPDATE auth_sessions
         SET revoked_at = CURRENT_TIMESTAMP
         WHERE session_id = $1`,
        [row.session_id]
      );

      await client.query('COMMIT');

      tokenReuseDetected = true;

    } else {
      const user: AuthUser = {
        userId: row.user_id,
        name: row.name,
        email: row.email,
        role: row.role,
      };

      const newRefreshToken = generateRefreshToken(
        user.userId,
        row.session_id
      );

      const newRefreshTokenHash = hashRefreshToken(
        newRefreshToken
      );

      const newExpiresAt = getTokenExpiry(newRefreshToken);

      await client.query(
        `UPDATE auth_sessions
         SET
           refresh_token_hash = $1,
           expires_at = $2,
           last_used_at = CURRENT_TIMESTAMP
         WHERE session_id = $3`,
        [
          newRefreshTokenHash,
          newExpiresAt,
          row.session_id,
        ]
      );

      const accessToken = generateAccessToken(
        user.userId,
        row.session_id,
        user.role
      );

      await client.query('COMMIT');

      return {
        user,
        accessToken,
        refreshToken: newRefreshToken,
      };
    }

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }

  if (tokenReuseDetected) {
    throw new AuthServiceError(
      'Refresh token reuse detected. Please log in again.',
      401
    );
  }

  throw new AuthServiceError(
    'Unable to refresh session.',
    401
  );
}

export async function logoutUserSession(
  refreshToken: string
): Promise<void> {
  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(
      refreshToken,
      authConfig.refreshToken.secret,
      {
        issuer: 'resumeiq-api',
        audience: 'resumeiq-client',
        ignoreExpiration: true,
      }
    );
  } catch {
    return;
  }

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.sid !== 'string' ||
    decoded.tokenType !== 'refresh'
  ) {
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  await pool.query(
    `UPDATE auth_sessions
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE session_id = $1
       AND user_id = $2
       AND refresh_token_hash = $3
       AND revoked_at IS NULL`,
    [
      decoded.sid,
      decoded.sub,
      tokenHash,
    ]
  );
}

/*
registerUser() -> Creates a user and session

loginUser() -> Verifies credentials and creates a session

refreshUserSession() -> Rotates refresh tokens

logoutUserSession() ->Revokes the current session

createSession() -> Creates a database-backed session

hashRefreshToken() -> Hashes refresh tokens using SHA-256
*/