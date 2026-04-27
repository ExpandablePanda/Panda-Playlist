import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensurePerformerApiSession } from "@/lib/auth";
import { createShow } from "@/lib/db";

const schema = z.object({
  title: z.string().min(1),
  venueName: z.string().optional(),
  city: z.string().optional(),
  showDate: z.string().optional(),
  startTime: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid show payload." }, { status: 400 });
  }

  return NextResponse.json({ id: createShow(parsed.data) });
}
