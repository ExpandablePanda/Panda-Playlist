import Link from "next/link";
import { getShows } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ReportsIndexPage() {
  const lockedShows = getShows().filter((show) => show.status === "locked");

  return (
    <main className="space-y-4">
      <div className="panel rounded-[28px] p-6">
        <h1 className="display text-5xl leading-none text-white">Locked show reports</h1>
        <p className="mt-3 text-base leading-8 text-stone-300">Every completed performance, frozen and searchable.</p>
      </div>
      {lockedShows.length === 0 ? (
        <div className="panel rounded-[28px] p-6 text-stone-300">No locked shows yet. Lock a live set to generate its report.</div>
      ) : (
        lockedShows.map((show) => (
          <Link key={show.id} href={`/app/reports/${show.id}`} className="panel block rounded-[28px] p-6 transition hover:border-amber-300/35">
            <p className="display text-4xl leading-none text-white">{show.title}</p>
            <p className="mt-2 text-sm text-stone-400">
              {show.showDate} • {show.venueName} • {show.city}
            </p>
          </Link>
        ))
      )}
    </main>
  );
}
