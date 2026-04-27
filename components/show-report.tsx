import Link from "next/link";
import { BarChart3, Download } from "lucide-react";
import { ShowReport as Report } from "@/lib/types";

export function ShowReport({ report }: { report: Report }) {
  return (
    <main className="space-y-6">
      <section className="panel rounded-[32px] p-6 md:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">
          <BarChart3 className="h-3.5 w-3.5" />
          Locked Show Report
        </div>
        <h1 className="display text-5xl leading-none text-white md:text-6xl">{report.show.title}</h1>
        <p className="mt-3 text-base leading-8 text-stone-300">
          {report.show.venueName} • {report.show.city} • {report.show.showDate}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Songs in set" value={String(report.metrics.totalSongs)} />
          <Metric label="Marked played" value={String(report.metrics.playedSongs)} />
          <Metric label="Request votes" value={String(report.metrics.totalRequests)} />
          <Metric label="Request conversion" value={`${Math.round(report.metrics.requestConversionRate * 100)}%`} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`/api/performer/report/${report.show.id}/csv`} className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 font-semibold text-stone-950 transition hover:bg-amber-200">
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <Link href={`/app/stage/${report.show.id}`} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-stone-200 transition hover:border-amber-300/40">
            Reopen Stage View
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[32px] p-6">
          <h2 className="display text-4xl text-white">Setlist Archive</h2>
          <div className="mt-5 space-y-3">
            {report.entries.map((entry) => (
              <div key={entry.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="display text-4xl leading-none text-white">{entry.song.title}</p>
                    <p className="mt-2 text-sm text-stone-400">
                      Slot {entry.position} • {entry.source} • {entry.plannedKey || entry.song.defaultKey || "N/A"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-300">
                    {entry.performed ? "played" : "queued"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">{entry.plannedNotes || entry.song.notes || "No note saved."}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel rounded-[32px] p-6">
            <h2 className="display text-4xl text-white">Performance Timing</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Estimated length" value={`${report.metrics.estimatedMinutes} min`} />
              <Metric label="Captured length" value={`${report.metrics.capturedMinutes} min`} />
              <Metric label="Fulfilled requests" value={String(report.metrics.fulfilledRequests)} />
              <Metric label="Locked at" value={report.show.lockedAt ? new Date(report.show.lockedAt).toLocaleTimeString() : "N/A"} />
            </div>
          </div>

          <div className="panel rounded-[32px] p-6">
            <h2 className="display text-4xl text-white">Audience Request Ledger</h2>
            <div className="mt-5 space-y-3">
              {report.requests.map((request) => (
                <div key={request.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="display text-3xl leading-none text-white">{request.song.title}</p>
                      <p className="mt-2 text-sm text-stone-400">{request.message || "No note attached."}</p>
                    </div>
                    <div className="text-right">
                      <p className="mono text-2xl text-amber-200">{request.voteCount}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{request.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
