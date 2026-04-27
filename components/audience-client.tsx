"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Search } from "lucide-react";
import { AudienceRequest, Show, Song } from "@/lib/types";

type Props = {
  show: Show;
  songs: Song[];
  requests: AudienceRequest[];
};

export function AudienceClient({ show, songs, requests }: Props) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSongId, setSelectedSongId] = useState("");
  const [liveRequests, setLiveRequests] = useState(requests);
  const [error, setError] = useState("");
  const filteredSongs = useMemo(() => {
    const lower = query.toLowerCase().trim();
    if (!lower) return songs;
    return songs.filter((song) => [song.title, ...song.tags].join(" ").toLowerCase().includes(lower));
  }, [query, songs]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/public/show/${show.qrSlug}`, { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json()) as Props;
      setLiveRequests(next.requests);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [show.qrSlug]);

  async function submitRequest() {
    setError("");
    const response = await fetch("/api/public/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        showId: show.id,
        songId: selectedSongId,
        message,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Could not submit request.");
      return;
    }

    setMessage("");
    const refresh = await fetch(`/api/public/show/${show.qrSlug}`);
    const next = (await refresh.json()) as Props;
    setLiveRequests(next.requests);
  }

  async function vote(requestId: string) {
    const response = await fetch(`/api/public/request/${requestId}/vote`, { method: "POST" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Could not vote.");
      return;
    }

    const refresh = await fetch(`/api/public/show/${show.qrSlug}`);
    const next = (await refresh.json()) as Props;
    setLiveRequests(next.requests);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <section className="panel rounded-[32px] p-6 md:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">
          Live Requests
        </div>
        <h1 className="display text-5xl leading-none text-white md:text-6xl">{show.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-stone-300">
          Request a song from tonight&apos;s catalog and help steer the set in real time.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="panel rounded-[32px] p-6">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Search className="h-4 w-4 text-stone-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the song catalog..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-stone-500" />
          </div>
          <div className="grid max-h-[30rem] gap-3 overflow-auto pr-1">
            {filteredSongs.map((song) => (
              <button
                key={song.id}
                type="button"
                onClick={() => setSelectedSongId(song.id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  selectedSongId === song.id
                    ? "border-amber-300/40 bg-amber-300/10"
                    : "border-white/10 bg-black/20 hover:border-amber-300/20"
                }`}
              >
                <p className="display text-4xl leading-none text-white">{song.title}</p>
                <p className="mt-2 text-sm text-stone-400">{song.tags.join(" • ") || "Ready for requests tonight."}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder="Optional note to the performer" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
            {error ? <p className="text-sm text-rose-200">{error}</p> : null}
            <button type="button" disabled={!selectedSongId} onClick={submitRequest} className="w-full rounded-2xl bg-amber-300 px-5 py-4 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-50">
              Request Selected Song
            </button>
          </div>
        </div>

        <div className="panel rounded-[32px] p-6">
          <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <Heart className="h-4 w-4 text-amber-300" />
            Crowd Favorites
          </div>
          <div className="space-y-3">
            {liveRequests.map((request) => (
              <div key={request.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="display text-4xl leading-none text-white">{request.song.title}</p>
                    <p className="mt-2 text-sm text-stone-400">{request.message || "No note attached."}</p>
                  </div>
                  <div className="text-right">
                    <p className="mono text-3xl text-amber-200">{request.voteCount}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">votes</p>
                  </div>
                </div>
                <button type="button" onClick={() => vote(request.id)} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:border-amber-300/40">
                  Vote for this song
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
