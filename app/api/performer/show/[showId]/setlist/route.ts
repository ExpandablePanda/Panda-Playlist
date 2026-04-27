import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensurePerformerApiSession } from "@/lib/auth";
import { addSetlistEntry, reorderSetlist, updateSetlistEntry } from "@/lib/db";

const addSchema = z.object({
  songId: z.string().min(1),
  plannedNotes: z.string().optional(),
});

const patchSchema = z.union([
  z.object({
    entryIds: z.array(z.string()).min(1),
  }),
  z.object({
    entryId: z.string(),
    plannedNotes: z.string().optional(),
    plannedKey: z.string().optional(),
  }),
]);

export async function POST(request: NextRequest, context: { params: Promise<{ showId: string }> }) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;
  const { showId } = await context.params;
  const parsed = addSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  addSetlistEntry({ showId, songId: parsed.data.songId, plannedNotes: parsed.data.plannedNotes });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ showId: string }> }) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;
  const { showId } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  if ("entryIds" in parsed.data) {
    reorderSetlist(showId, parsed.data.entryIds);
  } else {
    updateSetlistEntry({
      showId,
      entryId: parsed.data.entryId,
      plannedNotes: parsed.data.plannedNotes,
      plannedKey: parsed.data.plannedKey,
    });
  }

  return NextResponse.json({ ok: true });
}
