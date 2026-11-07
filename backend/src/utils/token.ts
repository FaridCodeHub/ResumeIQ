import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

import { authConfig } from '../config/auth.js';

type UserRole = 'user' | 'admin';

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
  role: UserRole;
  tokenType: 'access';
}

interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
  tokenType: 'refresh';
}

const TOKEN_ISSUER = 'resumeiq-api';
const TOKEN_AUDIENCE = 'resumeiq-client';

export function generateAccessToken(
  userId: string,
  sessionId: string,
  role: UserRole
): string {
  const payload = {
    sub: userId,
    sid: sessionId,
    role,
    tokenType: 'access',
  };

  const options: SignOptions = {
    expiresIn: authConfig.accessToken.expiresIn as SignOptions['expiresIn'],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  };

  return jwt.sign(payload, authConfig.accessToken.secret, options);
}

export function generateRefreshToken(
  userId: string,
  sessionId: string
): string {
  const payload = {
    sub: userId,
    sid: sessionId,
    tokenType: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: authConfig.refreshToken.expiresIn as SignOptions['expiresIn'],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  };

  return jwt.sign(payload, authConfig.refreshToken.secret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, authConfig.accessToken.secret, {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.sid !== 'string' ||
    (decoded.role !== 'user' && decoded.role !== 'admin') ||
    decoded.tokenType !== 'access'
  ) {
    throw new Error('Invalid access token.');
  }

  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, authConfig.refreshToken.secret, {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.sid !== 'string' ||
    decoded.tokenType !== 'refresh'
  ) {
    throw new Error('Invalid refresh token.');
  }

  return decoded as RefreshTokenPayload;
}