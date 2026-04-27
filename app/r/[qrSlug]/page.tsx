import { notFound } from "next/navigation";
import { AudienceClient } from "@/components/audience-client";
import { getAudienceShowBySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AudiencePage({
  params,
}: {
  params: Promise<{ qrSlug: string }>;
}) {
  const { qrSlug } = await params;
  const data = getAudienceShowBySlug(qrSlug);
  if (!data) notFound();

  return <AudienceClient show={data.show} songs={data.songs} requests={data.requests} />;
}
