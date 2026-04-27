import Link from "next/link";
import { Activity, BarChart3, Music4, Radio, ScrollText } from "lucide-react";
import { getDashboardSnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { songs, songStats, shows, liveShow } = getDashboardSnapshot();
  const mostRequested = [...songStats].sort((a, b) => b.requestCount - a.requestCount).slice(0, 4);

  return (
    <main className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel rounded-[28px] p-6 md:p-8">
          <div className="flex flex-col gap-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs tracking-[0.2em] text-amber-200 uppercase">
              <Activity className="h-3.5 w-3.5" />
              Performer Dashboard
            </div>
            <div className="space-y-3">
              <h1 className="display text-5xl leading-none text-white md:text-6xl">Build the room as you play it.</h1>
              <p className="max-w-2xl text-base leading-8 text-stone-300 md:text-lg">
                Run your set from an iPad, keep your song catalog tight, and watch audience energy surface in live
                requests while the show is still happening.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/app/library" className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/40">
                <p className="text-sm text-stone-400">Catalog</p>
                <p className="mt-2 text-2xl font-semibold text-white">{songs.length} songs</p>
              </Link>
              <Link href="/app/shows" className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/40">
                <p className="text-sm text-stone-400">Shows</p>
                <p className="mt-2 text-2xl font-semibold text-white">{shows.length} archived + live builds</p>
              </Link>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-stone-400">Stage Link</p>
                <p className="mt-2 text-2xl font-semibold text-white">{liveShow ? "Live now" : "Standby"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="panel rounded-[28px] p-6">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <Radio className="h-4 w-4 text-amber-300" />
            Live Focus
          </div>
          {liveShow ? (
            <div className="space-y-4">
              <div>
                <p className="display text-3xl text-white">{liveShow.title}</p>
                <p className="text-sm text-stone-400">
                  {liveShow.venueName} • {liveShow.city}
                </p>
              </div>
              <div className="grid gap-3">
                <Link
                  href={`/app/stage/${liveShow.id}`}
                  className="rounded-2xl bg-amber-300 px-4 py-4 text-center font-semibold text-stone-950 transition hover:bg-amber-200"
                >
                  Open Stage Mode
                </Link>
                <Link
                  href={`/app/shows/${liveShow.id}`}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-center text-stone-200 transition hover:border-amber-300/40"
                >
                  Edit Live Show
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-stone-200">No show is live yet.</p>
              <Link
                href="/app/shows"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 font-semibold text-stone-950"
              >
                Create a Show
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <Music4 className="h-4 w-4 text-amber-300" />
            Most Requested
          </div>
          <div className="space-y-3">
            {mostRequested.map((song) => (
              <div key={song.songId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="text-white">{song.title}</p>
                  <p className="text-sm text-stone-400">Played {song.playCount} times</p>
                </div>
                <div className="text-right">
                  <p className="mono text-xl text-amber-200">{song.requestCount}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">votes</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <ScrollText className="h-4 w-4 text-amber-300" />
            Recent Shows
          </div>
          <div className="grid gap-3">
            {shows.slice(0, 4).map((show) => (
              <Link
                key={show.id}
                href={show.status === "locked" ? `/app/reports/${show.id}` : `/app/shows/${show.id}`}
                className="rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="display text-3xl text-white">{show.title}</p>
                    <p className="text-sm text-stone-400">
                      {show.showDate || "TBD"} • {show.venueName || "Unscheduled"} • {show.city || "Location TBD"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-300">
                    {show.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-stone-300">{show.totalSongs} songs</div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-stone-300">{show.totalRequests} request votes</div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-stone-300">{show.playedSongs} marked played</div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/app/shows" className="mt-5 inline-flex items-center gap-2 text-sm text-amber-200 transition hover:text-amber-100">
            <BarChart3 className="h-4 w-4" />
            Open the full show manager
          </Link>
        </div>
      </section>
    </main>
  );
}
