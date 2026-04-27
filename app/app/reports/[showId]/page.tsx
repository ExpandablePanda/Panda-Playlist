import { notFound } from "next/navigation";
import { ShowReport } from "@/components/show-report";
import { getShowReport } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const report = getShowReport(showId);
  if (!report) notFound();
  return <ShowReport report={report} />;
}
