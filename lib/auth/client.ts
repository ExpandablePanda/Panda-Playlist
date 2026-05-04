import { createAuthClient } from "@better-auth/client";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_NEON_AUTH_URL
});
