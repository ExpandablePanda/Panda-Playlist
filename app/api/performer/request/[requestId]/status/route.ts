import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addRequestToSetlist, setRequestStatus } from "@/lib/db";
import { ensurePerformerApiSession } from "@/lib/auth";

const schema = z.object({
  status: z.enum(["active", "fulfilled", "ignored"]),
  addToSetlist: z.boolean().optional(),
});

export async function POST(request: NextRequest, context: { params: Promise<{ requestId: string }> }) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;
  const { requestId } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  if (parsed.data.addToSetlist) {
    addRequestToSetlist(requestId);
  } else {
    setRequestStatus(requestId, parsed.data.status);
  }

  return NextResponse.json({ ok: true });
}
