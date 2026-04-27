import { NextResponse } from "next/server";
import { getOrCreateAudienceSession } from "@/lib/auth";
import { upvoteAudienceRequest } from "@/lib/db";

export async function POST(_: Request, context: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await context.params;
  try {
    const sessionId = await getOrCreateAudienceSession();
    upvoteAudienceRequest(requestId, sessionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not vote." }, { status: 400 });
  }
}
