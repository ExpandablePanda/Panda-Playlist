"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Radio, Square, Star } from "lucide-react";
import { AudienceRequest, SetlistEntry, Show } from "@/lib/types";

type Snapshot = {
  show: Show;
  entries: SetlistEntry[];
  requests: AudienceRequest[];
};

export function StageClient({ initial }: { initial: Snapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const currentEntry = useMemo(
    () => snapshot.entries.find((entry) => entry.id === snapshot.show.currentEntryId) ?? snapshot.entries[0] ?? null,
    [snapshot],
  );

  useEffect(() => {
    localStorage.setItem(`stage-cache:${initial.show.id}`, JSON.stringify(initial));
  }, [initial]);

  useEffect(() => {
    const cacheKey = `stage-cache:${initial.show.id}`;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/performer/stage/${initial.show.id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Network");
        const next = (await response.json()) as Snapshot;
        setSnapshot(next);
        localStorage.setItem(cacheKey, JSON.stringify(next));
      } catch {
        const cached = localStorage.getItem(cacheKey);
        if (cached) setSnapshot(JSON.parse(cached) as Snapshot);
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [initial.show.id]);

  async function act(action: string, payload: Record<string, string> = {}) {
    const response = await fetch(`/api/performer/stage/${initial.show.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });

    if (response.ok) {
      const next = (await response.json()) as Snapshot;
      setSnapshot(next);
      localStorage.setItem(`stage-cache:${initial.show.id}`, JSON.stringify(next));
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-9rem)] gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <section className="panel rounded-[32px] p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-stone-400">{snapshot.show.title}</p>
            <h1 className="display text-6xl leading-none text-white md:text-7xl">{currentEntry?.song.title || "No song queued"}</h1>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => act("previous-song")} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-stone-200 transition hover:border-amber-300/40">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" onClick={() => currentEntry && act("mark-started", { entryId: currentEntry.id })} className="rounded-2xl bg-amber-300 p-4 text-stone-950 transition hover:bg-amber-200">
              <Play className="h-6 w-6" />
            </button>
            <button type="button" onClick={() => currentEntry && act("mark-completed", { entryId: currentEntry.id })} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-stone-200 transition hover:border-amber-300/40">
              <Square className="h-6 w-6" />
            </button>
            <button type="button" onClick={() => act("next-song")} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-stone-200 transition hover:border-amber-300/40">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {currentEntry ? (
          <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
              <div className="mb-4 flex flex-wrap gap-3 text-sm text-stone-400">
                <span className="rounded-full border border-white/10 px-3 py-1">Key {currentEntry.plannedKey || currentEntry.song.defaultKey || "N/A"}</span>
                <span className="rounded-full border border-white/10 px-3 py-1">{currentEntry.song.tuning || "Standard"}</span>
                <span className="rounded-full border border-white/10 px-3 py-1">{currentEntry.song.durationEstimate} min est.</span>
              </div>
              <pre className="whitespace-pre-wrap text-lg leading-8 text-stone-100">{currentEntry.song.lyricsRichText || "Add lyrics in the library to see them here."}</pre>
            </div>
            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="mb-3 text-sm uppercase tracking-[0.18em] text-stone-400">Chords</p>
                <pre className="mono whitespace-pre-wrap text-sm leading-7 text-amber-100">{currentEntry.song.chordsText || "No chords yet."}</pre>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="mb-3 text-sm uppercase tracking-[0.18em] text-stone-400">Tabs</p>
                <pre className="mono whitespace-pre-wrap text-sm leading-7 text-stone-200">{currentEntry.song.tabText || "No tabs yet."}</pre>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="mb-3 text-sm uppercase tracking-[0.18em] text-stone-400">Slot Notes</p>
                <p className="text-sm leading-7 text-stone-300">{currentEntry.plannedNotes || currentEntry.song.notes || "No notes for this moment."}</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <aside className="space-y-6">
        <div className="panel rounded-[32px] p-6">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <Star className="h-4 w-4 text-amber-300" />
            Up Next
          </div>
          <div className="space-y-3">
            {snapshot.entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => act("set-current", { entryId: entry.id })}
                className={`block w-full rounded-[22px] border p-4 text-left transition ${
                  entry.id === currentEntry?.id
                    ? "border-amber-300/40 bg-amber-300/10"
                    : "border-white/10 bg-black/20 hover:border-amber-300/20"
                }`}
              >
                <p className="display text-3xl leading-none text-white">{entry.song.title}</p>
                <p className="mt-2 text-sm text-stone-400">
                  Slot {entry.position} • {entry.plannedKey || entry.song.defaultKey || "N/A"} • {entry.source}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="panel rounded-[32px] p-6">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <Radio className="h-4 w-4 text-amber-300" />
            Live Requests
          </div>
          <div className="space-y-3">
            {snapshot.requests.map((request) => (
              <div key={request.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="display text-3xl leading-none text-white">{request.song.title}</p>
                    <p className="mt-2 text-sm text-stone-400">{request.message || "No note attached."}</p>
                  </div>
                  <div className="mono text-2xl text-amber-200">{request.voteCount}</div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button type="button" onClick={() => act("fulfill-request", { requestId: request.id })} className="flex-1 rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-stone-950 transition hover:bg-amber-200">
                    Add to Set
                  </button>
                  <button type="button" onClick={() => act("dismiss-request", { requestId: request.id })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-200 transition hover:border-white/20">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
