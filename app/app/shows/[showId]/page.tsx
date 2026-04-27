import { notFound } from "next/navigation";
import { ShowDetailManager } from "@/components/show-detail-manager";
import { getShow, getSongs } from "@/lib/db";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function ShowDetailPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const show = getShow(showId);
  if (!show) notFound();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${baseUrl}/r/${show.show.qrSlug}`;
  const qrSvg = await QRCode.toString(publicUrl, {
    type: "svg",
    margin: 0,
    color: {
      dark: "#111111",
      light: "#FFFFFF",
    },
  });

  return (
    <ShowDetailManager
      show={show.show}
      entries={show.entries}
      songs={getSongs()}
      requests={show.requests}
      publicUrl={publicUrl}
      qrSvg={qrSvg}
    />
  );
}
