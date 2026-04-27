import { NextResponse } from "next/server";
import { getAudienceShowBySlug } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ qrSlug: string }> }) {
  const { qrSlug } = await context.params;
  const show = getAudienceShowBySlug(qrSlug);
  if (!show) return NextResponse.json({ error: "Show not found." }, { status: 404 });
  return NextResponse.json(show);
}
