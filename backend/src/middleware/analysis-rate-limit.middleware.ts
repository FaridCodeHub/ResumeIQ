import { rateLimit } from 'express-rate-limit';

export const analysisRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  limit: 8,

  // Identify users by their authenticated user ID.
  keyGenerator: (req, res) => {
    const user = res.locals.authUser as
      | { userId: string }
      | undefined;

    return user?.userId ?? 'unauthenticated';
  },

  // Don't expose detailed rate-limit information.
  standardHeaders: 'draft-8',
  legacyHeaders: false,

  message: {
    success: false,
    message:
      'You have reached the analysis request limit. Please try again after 15 minutes.',
  },

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        'You have reached the analysis request limit. Please try again after 15 minutes.',
    });
  },
});