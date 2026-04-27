"use client";

import Link from "next/link";
import { DragEvent, useMemo, useState, useTransition } from "react";
import { Copy, GripVertical, QrCode, Radio, Save, Sparkles } from "lucide-react";
import { AudienceRequest, SetlistEntry, Show, Song } from "@/lib/types";

type Props = {
  show: Show;
  entries: SetlistEntry[];
  songs: Song[];
  requests: AudienceRequest[];
  publicUrl: string;
  qrSvg: string;
};

export function ShowDetailManager({ show, entries, songs, requests, publicUrl, qrSvg }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const requestableSongs = useMemo(() => songs.filter((song) => song.status === "active"), [songs]);

  async function addSong(formData: FormData) {
    const response = await fetch(`/api/performer/show/${show.id}/setlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        songId: String(formData.get("songId") || ""),
        plannedNotes: String(formData.get("plannedNotes") || ""),
      }),
    });

    if (response.ok) {
      window.location.reload();
    }
  }

  async function saveEntry(entryId: string, plannedNotes: string, plannedKey: string) {
    const response = await fetch(`/api/performer/show/${show.id}/setlist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId, plannedNotes, plannedKey }),
    });
    if (response.ok) window.location.reload();
  }

  async function startLive() {
    await fetch(`/api/performer/show/${show.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "live" }),
    });
    window.location.reload();
  }

  async function lockShow() {
    await fetch(`/api/performer/show/${show.id}/lock`, { method: "POST" });
    window.location.href = `/app/reports/${show.id}`;
  }

  async function reorder(entryIds: string[]) {
    await fetch(`/api/performer/show/${show.id}/setlist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryIds }),
    });
    window.location.reload();
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const reordered = [...entries];
    const from = reordered.findIndex((entry) => entry.id === draggingId);
    const to = reordered.findIndex((entry) => entry.id === targetId);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    startTransition(async () => {
      await reorder(reordered.map((entry) => entry.id));
    });
  }

  async function actOnRequest(requestId: string, status: "ignored" | "fulfilled", addToSetlist: boolean) {
    await fetch(`/api/performer/request/${requestId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, addToSetlist }),
    });
    window.location.reload();
  }

  return (
    <main className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <div className="panel rounded-[28px] p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">
                <Sparkles className="h-3.5 w-3.5" />
                Show Builder
              </div>
              <h1 className="display text-5xl leading-none text-white">{show.title}</h1>
              <p className="mt-3 text-base leading-8 text-stone-300">
                {show.venueName || "Venue TBD"} • {show.city || "City TBD"} • {show.showDate || "Date TBD"} • {show.startTime || "Time TBD"}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-400">{show.notes || "No show notes yet."}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {show.status !== "locked" ? (
                <>
                  <button type="button" onClick={startLive} className="rounded-2xl bg-amber-300 px-5 py-4 font-semibold text-stone-950 transition hover:bg-amber-200">
                    {show.status === "live" ? "Refresh Live State" : "Start Live Show"}
                  </button>
                  <Link href={`/app/stage/${show.id}`} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center text-stone-200 transition hover:border-amber-300/40">
                    Open Stage Mode
                  </Link>
                  <button type="button" onClick={lockShow} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-stone-200 transition hover:border-rose-300/35 sm:col-span-2">
                    Lock Show and Generate Report
                  </button>
                </>
              ) : (
                <Link href={`/app/reports/${show.id}`} className="rounded-2xl bg-amber-300 px-5 py-4 text-center font-semibold text-stone-950">
                  View Locked Report
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <QrCode className="h-4 w-4 text-amber-300" />
            Audience Link
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mono text-lg text-white">{publicUrl}</p>
              <p className="mt-2 text-sm text-stone-400">Audience phones can request songs and upvote live from this page.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="h-40 w-40" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/r/${show.qrSlug}`} target="_blank" className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-stone-200 transition hover:border-amber-300/40">
                Open Audience Page
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(publicUrl);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-stone-200 transition hover:border-amber-300/40"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>

        <div className="panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <Radio className="h-4 w-4 text-amber-300" />
            Setlist
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await addSong(new FormData(e.currentTarget));
              });
            }}
            className="mb-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <select name="songId" required className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none">
              <option value="">Add a song...</option>
              {requestableSongs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
            <input name="plannedNotes" placeholder="Slot notes" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
            <button type="submit" disabled={pending} className="rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60">
              Add
            </button>
          </form>

          <div className="space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                draggable
                onDragStart={() => setDraggingId(entry.id)}
                onDragOver={(event: DragEvent<HTMLElement>) => event.preventDefault()}
                onDrop={() => handleDrop(entry.id)}
                className="rounded-[24px] border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex items-start gap-3 lg:min-w-[320px]">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-stone-400">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Slot {entry.position}</p>
                      <p className="display text-4xl leading-none text-white">{entry.song.title}</p>
                      <p className="mt-2 text-sm text-stone-400">
                        {entry.song.defaultKey || "No key"} • {entry.song.tuning || "Standard"} • source: {entry.source}
                      </p>
                    </div>
                  </div>

                  <EntryEditor entry={entry} onSave={saveEntry} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <Radio className="h-4 w-4 text-amber-300" />
            Live Requests
          </div>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-stone-400">No requests yet.</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="display text-3xl leading-none text-white">{request.song.title}</p>
                      <p className="mt-2 text-sm text-stone-400">{request.message || "No note attached."}</p>
                    </div>
                    <div className="text-right">
                      <p className="mono text-3xl text-amber-200">{request.voteCount}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">votes</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button type="button" onClick={() => actOnRequest(request.id, "fulfilled", true)} className="flex-1 rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-stone-950 transition hover:bg-amber-200">
                      Add to Set
                    </button>
                    <button type="button" onClick={() => actOnRequest(request.id, "ignored", false)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-200 transition hover:border-white/20">
                      Ignore
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}

function EntryEditor({
  entry,
  onSave,
}: {
  entry: SetlistEntry;
  onSave: (entryId: string, plannedNotes: string, plannedKey: string) => Promise<void>;
}) {
  const [plannedKey, setPlannedKey] = useState(entry.plannedKey);
  const [plannedNotes, setPlannedNotes] = useState(entry.plannedNotes);
  const [saving, startTransition] = useTransition();

  return (
    <div className="grid flex-1 gap-3 md:grid-cols-[140px_1fr_auto]">
      <input value={plannedKey} onChange={(event) => setPlannedKey(event.target.value)} placeholder="Key" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
      <input value={plannedNotes} onChange={(event) => setPlannedNotes(event.target.value)} placeholder="Performer note for this slot" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
      <button type="button" onClick={() => startTransition(async () => onSave(entry.id, plannedNotes, plannedKey))} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-stone-200 transition hover:border-amber-300/40 disabled:opacity-60">
        <Save className="h-4 w-4" />
        Save
      </button>
    </div>
  );
}
