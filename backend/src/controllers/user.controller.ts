import type { RequestHandler } from 'express';

import type {
  AuthenticatedUser,
} from '../middleware/auth.middleware.js';

export const getCurrentUser: RequestHandler = (_req, res) => {
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

  res.status(200).json({
    success: true,
    user: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

/*
### GET /api/auth/me

Returns the currently authenticated user's information:

- User ID
- Name
- Email
- Role
*/