import { getSongStats, getSongs } from "@/lib/db";
import { LibraryManager } from "@/components/library-manager";

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return <LibraryManager songs={getSongs()} stats={getSongStats()} />;
}
