import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAudienceSession } from "@/lib/auth";
import { submitAudienceRequest } from "@/lib/db";

const schema = z.object({
  showId: z.string().min(1),
  songId: z.string().min(1),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  try {
    const sessionId = await getOrCreateAudienceSession();
    const requestId = submitAudienceRequest({
      showId: parsed.data.showId,
      songId: parsed.data.songId,
      sessionId,
      message: parsed.data.message,
    });
    return NextResponse.json({ requestId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit request." }, { status: 400 });
  }
}
