"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarDays, Plus, Radio, ScrollText } from "lucide-react";
import { ShowSummary, Song } from "@/lib/types";

export function ShowsManager({ shows }: { shows: ShowSummary[]; songs: Song[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function createShow(formData: FormData) {
    setError("");
    const payload = {
      title: String(formData.get("title") || ""),
      venueName: String(formData.get("venueName") || ""),
      city: String(formData.get("city") || ""),
      showDate: String(formData.get("showDate") || ""),
      startTime: String(formData.get("startTime") || ""),
      notes: String(formData.get("notes") || ""),
    };

    const response = await fetch("/api/performer/show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Could not create show.");
      return;
    }

    const data = (await response.json()) as { id: string };
    window.location.href = `/app/shows/${data.id}`;
  }

  return (
    <main className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="panel rounded-[28px] p-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">
          <Plus className="h-3.5 w-3.5" />
          New Show
        </div>
        <h1 className="display text-5xl leading-none text-white">Shape the night before the room hears it.</h1>
        <p className="mt-3 max-w-xl text-base leading-8 text-stone-300">
          Draft your set, assign a QR slug, and move into stage mode once the audience is in the room.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await createShow(new FormData(e.currentTarget));
            });
          }}
          className="mt-8 grid gap-4 md:grid-cols-2"
        >
          <label className="space-y-2 text-sm text-stone-300 md:col-span-2">
            <span>Show title</span>
            <input name="title" required className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" placeholder="Friday Rooftop Set" />
          </label>
          <label className="space-y-2 text-sm text-stone-300">
            <span>Venue</span>
            <input name="venueName" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-stone-300">
            <span>City</span>
            <input name="city" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-stone-300">
            <span>Date</span>
            <input name="showDate" type="date" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-stone-300">
            <span>Start time</span>
            <input name="startTime" type="time" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-stone-300 md:col-span-2">
            <span>Show notes</span>
            <textarea name="notes" rows={4} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" placeholder="Open gentle. Leave room for crowd calls in the middle." />
          </label>
          {error ? <p className="text-sm text-rose-200 md:col-span-2">{error}</p> : null}
          <button type="submit" disabled={pending} className="rounded-2xl bg-amber-300 px-5 py-4 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60 md:col-span-2">
            {pending ? "Creating..." : "Create Show"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="panel rounded-[28px] p-6">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
            <ScrollText className="h-4 w-4 text-amber-300" />
            Show Library
          </div>
          <div className="space-y-3">
            {shows.map((show) => (
              <Link
                key={show.id}
                href={show.status === "locked" ? `/app/reports/${show.id}` : `/app/shows/${show.id}`}
                className="panel block rounded-[24px] p-5 transition hover:border-amber-300/35"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="display text-4xl leading-none text-white">{show.title}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-400">
                      {show.venueName || "Venue TBD"} • {show.city || "City TBD"} • {show.showDate || "Date TBD"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-300">
                    {show.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-stone-300">{show.totalSongs} setlist slots</div>
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-stone-300">{show.totalRequests} request votes</div>
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-stone-300">{show.playedSongs} songs marked played</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {show.startTime || "Time TBD"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Radio className="h-3.5 w-3.5" />
                    /r/{show.qrSlug}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
