import { NextResponse } from "next/server";
import { ensurePerformerApiSession } from "@/lib/auth";
import { getShowReport, toCsv } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ showId: string }> }) {
  const unauthorized = await ensurePerformerApiSession();
  if (unauthorized) return unauthorized;
  const { showId } = await context.params;
  const report = getShowReport(showId);
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  return new NextResponse(toCsv(report), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stagevault-${showId}.csv"`,
    },
  });
}
