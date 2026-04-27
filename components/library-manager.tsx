"use client";

import { useMemo, useState, useTransition } from "react";
import { Music2, Search, Sparkles } from "lucide-react";
import { Song, SongStats } from "@/lib/types";

type Props = {
  songs: Song[];
  stats: SongStats[];
};

const emptySong = {
  id: "",
  title: "",
  alternateTitles: "",
  status: "active",
  defaultKey: "",
  capo: 0,
  tempo: "",
  tuning: "",
  durationEstimate: 4,
  lyricsRichText: "",
  chordsText: "",
  tabText: "",
  notes: "",
  tags: "",
  requestable: true,
};

export function LibraryManager({ songs, stats }: Props) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<(typeof emptySong) | null>(emptySong);
  const [pending, startTransition] = useTransition();

  const filteredSongs = useMemo(() => {
    const lower = query.toLowerCase().trim();
    if (!lower) return songs;

    return songs.filter((song) =>
      [
        song.title,
        song.defaultKey,
        song.tuning,
        ...song.tags,
        ...song.alternateTitles,
      ]
        .join(" ")
        .toLowerCase()
        .includes(lower),
    );
  }, [query, songs]);

  async function submitSong(formData: FormData) {
    const payload = {
      id: String(formData.get("id") || ""),
      title: String(formData.get("title") || ""),
      alternateTitles: String(formData.get("alternateTitles") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      status: String(formData.get("status") || "active"),
      defaultKey: String(formData.get("defaultKey") || ""),
      capo: Number(formData.get("capo") || 0),
      tempo: String(formData.get("tempo") || ""),
      tuning: String(formData.get("tuning") || ""),
      durationEstimate: Number(formData.get("durationEstimate") || 0),
      lyricsRichText: String(formData.get("lyricsRichText") || ""),
      chordsText: String(formData.get("chordsText") || ""),
      tabText: String(formData.get("tabText") || ""),
      notes: String(formData.get("notes") || ""),
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      requestable: formData.get("requestable") === "on",
    };

    const response = await fetch("/api/performer/song", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert("Could not save song.");
      return;
    }

    window.location.reload();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div className="panel rounded-[28px] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">
                <Music2 className="h-3.5 w-3.5" />
                Song Library
              </div>
              <h1 className="display text-5xl leading-none text-white">Every song in one vault.</h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-stone-300">
                Search by mood, tuning, or key, then jump straight from writing mode into stage mode.
              </p>
            </div>
            <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 md:max-w-sm">
              <Search className="h-4 w-4 text-stone-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search songs, tags, keys..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-stone-500"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="panel rounded-[24px] p-5">
            <p className="text-sm text-stone-400">Total songs</p>
            <p className="mt-2 text-3xl font-semibold text-white">{songs.length}</p>
          </div>
          <div className="panel rounded-[24px] p-5">
            <p className="text-sm text-stone-400">Requestable</p>
            <p className="mt-2 text-3xl font-semibold text-white">{songs.filter((song) => song.requestable).length}</p>
          </div>
          <div className="panel rounded-[24px] p-5">
            <p className="text-sm text-stone-400">Most played</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats[0]?.title || "No history yet"}</p>
          </div>
        </div>

        <div className="space-y-3">
          {filteredSongs.map((song) => {
            const stat = stats.find((item) => item.songId === song.id);
            return (
              <button
                key={song.id}
                type="button"
                onClick={() =>
                  setEditing({
                    id: song.id,
                    title: song.title,
                    alternateTitles: song.alternateTitles.join(", "),
                    status: song.status,
                    defaultKey: song.defaultKey,
                    capo: song.capo,
                    tempo: song.tempo,
                    tuning: song.tuning,
                    durationEstimate: song.durationEstimate,
                    lyricsRichText: song.lyricsRichText,
                    chordsText: song.chordsText,
                    tabText: song.tabText,
                    notes: song.notes,
                    tags: song.tags.join(", "),
                    requestable: song.requestable,
                  })
                }
                className="panel flex w-full flex-col gap-4 rounded-[24px] p-5 text-left transition hover:border-amber-300/35"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="display text-4xl leading-none text-white">{song.title}</p>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                        {song.status}
                      </span>
                      {song.requestable ? (
                        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200">
                          Requestable
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-stone-400">
                      {song.tags.join(" • ") || "No tags yet"}{song.alternateTitles.length ? ` • aka ${song.alternateTitles.join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="grid min-w-[220px] grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-stone-300">Key {song.defaultKey || "N/A"}</div>
                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-stone-300">{song.tuning || "Standard"}</div>
                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-stone-300">{song.durationEstimate} min est.</div>
                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-stone-300">{stat?.requestCount ?? 0} request votes</div>
                  </div>
                </div>
                <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-stone-300">
                  {song.notes || song.lyricsRichText.slice(0, 180) || "Tap to edit lyrics, chords, tabs, and notes."}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="panel sticky top-28 h-fit rounded-[28px] p-6">
        <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-stone-400">
          <Sparkles className="h-4 w-4 text-amber-300" />
          {editing?.id ? "Edit Song" : "Add Song"}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await submitSong(new FormData(e.currentTarget));
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={editing?.id || ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-stone-300 md:col-span-2">
              <span>Title</span>
              <input name="title" required defaultValue={editing?.title} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300 md:col-span-2">
              <span>Alternate titles</span>
              <input name="alternateTitles" defaultValue={editing?.alternateTitles} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300">
              <span>Default key</span>
              <input name="defaultKey" defaultValue={editing?.defaultKey} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300">
              <span>Capo</span>
              <input name="capo" type="number" min="0" defaultValue={editing?.capo} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300">
              <span>Tempo</span>
              <input name="tempo" defaultValue={editing?.tempo} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300">
              <span>Tuning</span>
              <input name="tuning" defaultValue={editing?.tuning} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300">
              <span>Duration (minutes)</span>
              <input name="durationEstimate" type="number" min="1" defaultValue={editing?.durationEstimate} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300">
              <span>Status</span>
              <select name="status" defaultValue={editing?.status} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none">
                <option value="active">Active</option>
                <option value="retired">Retired</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300 md:col-span-2">
              <input name="requestable" type="checkbox" defaultChecked={editing?.requestable} className="h-4 w-4 accent-amber-300" />
              Audience can request this song
            </label>
            <label className="space-y-2 text-sm text-stone-300 md:col-span-2">
              <span>Tags</span>
              <input name="tags" defaultValue={editing?.tags} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300 md:col-span-2">
              <span>Lyrics</span>
              <textarea name="lyricsRichText" rows={7} defaultValue={editing?.lyricsRichText} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300">
              <span>Chords</span>
              <textarea name="chordsText" rows={6} defaultValue={editing?.chordsText} className="mono w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300">
              <span>Tabs</span>
              <textarea name="tabText" rows={6} defaultValue={editing?.tabText} className="mono w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-stone-300 md:col-span-2">
              <span>Performance notes</span>
              <textarea name="notes" rows={5} defaultValue={editing?.notes} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" />
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={pending} className="flex-1 rounded-2xl bg-amber-300 px-5 py-4 font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60">
              {pending ? "Saving..." : editing?.id ? "Update Song" : "Add Song"}
            </button>
            <button type="button" onClick={() => setEditing(emptySong)} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-stone-200 transition hover:border-white/20">
              New
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
