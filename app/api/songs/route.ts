import { NextResponse } from "next/server";
import { getSongs, saveSong } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getSongs());
}

export async function POST(req: Request) {
  const song = await req.json();
  saveSong(song);
  return NextResponse.json({ success: true });
}
