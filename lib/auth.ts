import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "stagevault_session";
export const AUDIENCE_COOKIE = "stagevault_audience_session";

export async function hasPerformerSession() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === "performer";
}

export async function requirePerformerPageSession() {
  const authenticated = await hasPerformerSession();
  if (!authenticated) {
    redirect("/sign-in");
  }
}

export async function ensurePerformerApiSession() {
  const authenticated = await hasPerformerSession();
  if (!authenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function getOrCreateAudienceSession() {
  const store = await cookies();
  const existing = store.get(AUDIENCE_COOKIE)?.value;

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  store.set(AUDIENCE_COOKIE, sessionId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  return sessionId;
}
