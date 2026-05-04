import { NextResponse } from "next/server";
import { getShow, saveSetlist } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(getShow(id));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { entries } = await req.json();
  saveSetlist(id, entries);
  return NextResponse.json({ success: true });
}
