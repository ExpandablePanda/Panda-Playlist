import { NextResponse } from "next/server";
import { ensurePerformerApiSession } from "@/lib/auth";
import { lockShow } from "@/lib/db";

export async function POST(_: Request, context: { params: Promise<{ showId: string }> }) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;
  const { showId } = await context.params;
  lockShow(showId);
  return NextResponse.json({ ok: true });
}
