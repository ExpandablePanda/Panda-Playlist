import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "http://placeholder-for-build",
  cookies: { 
    secret: process.env.NEON_AUTH_COOKIE_SECRET || "placeholder-secret-at-least-32-characters",
  },
});
