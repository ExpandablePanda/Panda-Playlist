import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensurePerformerApiSession } from "@/lib/auth";
import { setShowStatus } from "@/lib/db";

const schema = z.object({
  status: z.enum(["draft", "live", "locked"]),
});

export async function POST(request: NextRequest, context: { params: Promise<{ showId: string }> }) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;
  const { showId } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  setShowStatus(showId, parsed.data.status);
  return NextResponse.json({ ok: true });
}
