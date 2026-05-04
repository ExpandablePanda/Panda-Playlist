import { createNeonAuth } from '@neondatabase/auth/next/server';

if (!process.env.NEXT_PUBLIC_NEON_AUTH_URL) {
  throw new Error('NEXT_PUBLIC_NEON_AUTH_URL is not set');
}

export const auth = createNeonAuth({
  baseUrl: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
  // secret is used for cookie encryption
  // In production, this should be a long random string
  cookies: { 
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'a-very-secret-string-at-least-32-chars-long' 
  },
});
