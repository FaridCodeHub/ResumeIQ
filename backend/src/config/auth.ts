import { z } from 'zod';

const authEnvironmentSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),

  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsedEnvironment = authEnvironmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error('Invalid authentication environment configuration:');
  console.error(z.treeifyError(parsedEnvironment.error));
  throw new Error('Authentication configuration is invalid.');
}

const environment = parsedEnvironment.data;

export const authConfig = {
  accessToken: {
    secret: environment.JWT_ACCESS_SECRET,
    expiresIn: environment.JWT_ACCESS_EXPIRES_IN,
  },

  refreshToken: {
    secret: environment.JWT_REFRESH_SECRET,
    expiresIn: environment.JWT_REFRESH_EXPIRES_IN,
  },

  cookie: {
    httpOnly: true,
    secure: environment.COOKIE_SECURE === 'true',
    sameSite: environment.COOKIE_SAME_SITE,
    path: '/',
  },

  isProduction: environment.NODE_ENV === 'production',
};