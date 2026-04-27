import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensurePerformerApiSession } from "@/lib/auth";
import {
  addRequestToSetlist,
  getShow,
  markSongCompleted,
  markSongStarted,
  moveCurrentEntry,
  setCurrentEntry,
  setRequestStatus,
  setShowStatus,
} from "@/lib/db";

const schema = z.object({
  action: z.enum([
    "start-show",
    "set-current",
    "mark-started",
    "mark-completed",
    "next-song",
    "previous-song",
    "dismiss-request",
    "fulfill-request",
  ]),
  entryId: z.string().optional(),
  requestId: z.string().optional(),
});

export async function GET(_: NextRequest, context: { params: Promise<{ showId: string }> }) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;
  const { showId } = await context.params;
  return NextResponse.json(getShow(showId));
}

export async function POST(request: NextRequest, context: { params: Promise<{ showId: string }> }) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;
  const { showId } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  switch (parsed.data.action) {
    case "start-show":
      setShowStatus(showId, "live");
      break;
    case "set-current":
      if (parsed.data.entryId) setCurrentEntry(showId, parsed.data.entryId);
      break;
    case "mark-started":
      if (parsed.data.entryId) markSongStarted(showId, parsed.data.entryId);
      break;
    case "mark-completed":
      if (parsed.data.entryId) markSongCompleted(showId, parsed.data.entryId);
      break;
    case "next-song":
      moveCurrentEntry(showId, "next");
      break;
    case "previous-song":
      moveCurrentEntry(showId, "previous");
      break;
    case "dismiss-request":
      if (parsed.data.requestId) setRequestStatus(parsed.data.requestId, "ignored");
      break;
    case "fulfill-request":
      if (parsed.data.requestId) addRequestToSetlist(parsed.data.requestId);
      break;
  }

  return NextResponse.json(getShow(showId));
}
