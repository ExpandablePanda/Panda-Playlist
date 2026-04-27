import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const passcode = String(formData.get("passcode") || "");
  const expected = process.env.PERFORMER_PASSCODE || "stagevault";

  if (passcode !== expected) {
    return NextResponse.redirect(new URL("/sign-in?error=1", request.url));
  }

  const response = NextResponse.redirect(new URL("/app", request.url));
  response.cookies.set(SESSION_COOKIE, "performer", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
