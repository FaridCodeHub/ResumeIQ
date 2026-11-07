import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Name must contain at least 3 characters.')
      .max(150, 'Name cannot exceed 150 characters.'),

    email: z
      .string()
      .trim()
      .email('Please enter a valid email address.')
      .max(255, 'Email cannot exceed 255 characters.')
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(8, 'Password must contain at least 8 characters.')
      .max(72, 'Password cannot exceed 72 bytes.')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
      .regex(/[a-z]/, 'Password must contain a lowercase letter.')
      .regex(/[0-9]/, 'Password must contain a number.'),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .max(255)
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, 'Password is required.')
    .max(72, 'Invalid password.'),
});

export const refreshTokenSchema = z.object({});

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;