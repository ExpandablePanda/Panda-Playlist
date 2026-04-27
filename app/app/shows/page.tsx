import { ShowsManager } from "@/components/shows-manager";
import { getShows, getSongs } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ShowsPage() {
  return <ShowsManager shows={getShows()} songs={getSongs()} />;
}
