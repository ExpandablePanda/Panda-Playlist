import { notFound } from "next/navigation";
import { StageClient } from "@/components/stage-client";
import { getShow } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StagePage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const show = getShow(showId);
  if (!show) notFound();

  return <StageClient initial={show} />;
}
