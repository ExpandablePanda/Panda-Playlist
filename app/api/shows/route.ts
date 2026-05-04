import { NextResponse } from "next/server";
import { getShows, saveShow } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getShows());
}

export async function POST(req: Request) {
  const show = await req.json();
  saveShow(show);
  return NextResponse.json({ success: true });
}
