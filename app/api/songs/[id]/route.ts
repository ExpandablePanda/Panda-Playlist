import { NextResponse } from "next/server";
import { deleteSong, saveSong } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const song = await req.json();
  saveSong({ ...song, id });
  return NextResponse.json(song);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  deleteSong(id);
  return NextResponse.json({ success: true });
}
