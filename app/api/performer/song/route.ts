import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensurePerformerApiSession } from "@/lib/auth";
import { upsertSong } from "@/lib/db";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  alternateTitles: z.array(z.string()).optional(),
  status: z.enum(["active", "retired", "private"]).optional(),
  defaultKey: z.string().optional(),
  capo: z.number().optional(),
  tempo: z.string().optional(),
  tuning: z.string().optional(),
  durationEstimate: z.number().optional(),
  lyricsRichText: z.string().optional(),
  chordsText: z.string().optional(),
  tabText: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requestable: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid song payload." }, { status: 400 });
  }

  const song = upsertSong(parsed.data);
  return NextResponse.json(song);
}
