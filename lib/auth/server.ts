import { createNeonAuth } from '@neondatabase/auth/next/server';

if (!process.env.NEON_AUTH_BASE_URL) {
  throw new Error('NEON_AUTH_BASE_URL is not set');
}

const isDev = process.env.NODE_ENV === 'development';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL,
  cookies: { 
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    secure: !isDev,
    sameSite: isDev ? 'lax' : 'lax',
  },
});
