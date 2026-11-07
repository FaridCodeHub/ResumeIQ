import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { authConfig } from '../config/auth.js';

import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUserSession,
  AuthServiceError,
} from '../services/auth.service.js';

import {
  registerSchema,
  loginSchema,
} from '../validators/auth.validator.js';

const ACCESS_COOKIE = 'resumeiq_access';
const REFRESH_COOKIE = 'resumeiq_refresh';

function getCookieOptions(path: string) {
  return {
    httpOnly: true,
    secure: authConfig.cookie.secure,
    sameSite: authConfig.cookie.sameSite,
    path,
  } as const;
}

function getTokenMaxAge(token: string): number {
  const decoded = jwt.decode(token);

  if (
    typeof decoded !== 'string' &&
    decoded !== null &&
    typeof decoded.exp === 'number'
  ) {
    return Math.max(0, decoded.exp * 1000 - Date.now());
  }

  return 0;
}

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...getCookieOptions('/'),
    maxAge: getTokenMaxAge(accessToken),
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...getCookieOptions('/api/auth'),
    maxAge: getTokenMaxAge(refreshToken),
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(
    ACCESS_COOKIE,
    getCookieOptions('/')
  );

  res.clearCookie(
    REFRESH_COOKIE,
    getCookieOptions('/api/auth')
  );
}

function getSessionMetadata(req: Request) {
  return {
    userAgent: req.get('user-agent') || null,
    ipAddress: req.ip || null,
  };
}

function handleControllerError(
  res: Response,
  error: unknown
): void {
  if (error instanceof AuthServiceError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  console.error('Authentication controller error:', error);

  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
  });
}

export async function register(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.error.issues,
      });

      return;
    }

    const result = await registerUser(
      validation.data,
      getSessionMetadata(req)
    );

    setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: result.user,
    });

  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function login(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.error.issues,
      });

      return;
    }

    const result = await loginUser(
      validation.data,
      getSessionMetadata(req)
    );

    setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: result.user,
    });

  } catch (error) {
    handleControllerError(res, error);
  }
}

export async function refresh(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken || typeof refreshToken !== 'string') {
      res.status(401).json({
        success: false,
        message: 'Refresh token is required.',
      });

      return;
    }

    const result = await refreshUserSession(refreshToken);

    setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken
    );

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully.',
      user: result.user,
    });

  } catch (error) {
    clearAuthCookies(res);
    handleControllerError(res, error);
  }
}

export async function logout(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (typeof refreshToken === 'string') {
      await logoutUserSession(refreshToken);
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });

  } catch (error) {
    handleControllerError(res, error);
  }
}

/*
Registration

* Validates registration information.
* Calls the registration service.
* Creates authentication cookies.
* Returns the registered user.

Login

* Validates credentials.
* Authenticates the user.
* Creates access and refresh cookies.

Refresh

* Reads the refresh token from the HTTP-only cookie.
* Rotates the refresh token.
* Updates authentication cookies.

Logout

* Revokes the current database session.
* Clears authentication cookies.

*/