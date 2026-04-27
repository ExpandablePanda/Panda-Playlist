import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  AudienceRequest,
  SetlistEntry,
  Show,
  ShowReport,
  ShowSummary,
  Song,
  SongStats,
} from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "stagevault.sqlite"));
db.pragma("journal_mode = WAL");

function now() {
  return new Date().toISOString();
}

function jsonArray(input: string | null) {
  return input ? (JSON.parse(input) as string[]) : [];
}

function boolFromInt(value: number) {
  return Boolean(value);
}

function minutesBetween(startedAt: string | null, endedAt: string | null) {
  if (!startedAt || !endedAt) return 0;
  return Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 60000));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function mapSong(row: Record<string, unknown>): Song {
  return {
    id: row.id as string,
    title: row.title as string,
    alternateTitles: jsonArray(row.alternate_titles as string),
    status: row.status as Song["status"],
    defaultKey: (row.default_key as string) || "",
    capo: Number(row.capo || 0),
    tempo: (row.tempo as string) || "",
    tuning: (row.tuning as string) || "",
    durationEstimate: Number(row.duration_estimate || 0),
    lyricsRichText: (row.lyrics_rich_text as string) || "",
    chordsText: (row.chords_text as string) || "",
    tabText: (row.tab_text as string) || "",
    notes: (row.notes as string) || "",
    tags: jsonArray(row.tags as string),
    requestable: boolFromInt(Number(row.requestable || 0)),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapShow(row: Record<string, unknown>): Show {
  return {
    id: row.id as string,
    title: row.title as string,
    venueName: (row.venue_name as string) || "",
    city: (row.city as string) || "",
    showDate: (row.show_date as string) || "",
    startTime: (row.start_time as string) || "",
    status: row.status as Show["status"],
    qrSlug: row.qr_slug as string,
    currentEntryId: (row.current_entry_id as string) || null,
    startedAt: (row.started_at as string) || null,
    lockedAt: (row.locked_at as string) || null,
    notes: (row.notes as string) || "",
    createdAt: row.created_at as string,
  };
}

function logShowEvent(showId: string, type: string, entityId: string, metadata: Record<string, unknown> = {}) {
  db.prepare(
    `insert into show_events (id, show_id, type, entity_id, metadata, created_at)
     values (@id, @show_id, @type, @entity_id, @metadata, @created_at)`,
  ).run({
    id: crypto.randomUUID(),
    show_id: showId,
    type,
    entity_id: entityId,
    metadata: JSON.stringify(metadata),
    created_at: now(),
  });
}

function init() {
  db.exec(`
    create table if not exists songs (
      id text primary key,
      title text not null,
      alternate_titles text not null default '[]',
      status text not null default 'active',
      default_key text not null default '',
      capo integer not null default 0,
      tempo text not null default '',
      tuning text not null default '',
      duration_estimate integer not null default 0,
      lyrics_rich_text text not null default '',
      chords_text text not null default '',
      tab_text text not null default '',
      notes text not null default '',
      tags text not null default '[]',
      requestable integer not null default 1,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists shows (
      id text primary key,
      title text not null,
      venue_name text not null default '',
      city text not null default '',
      show_date text not null default '',
      start_time text not null default '',
      status text not null default 'draft',
      qr_slug text not null unique,
      current_entry_id text,
      started_at text,
      locked_at text,
      notes text not null default '',
      created_at text not null
    );

    create table if not exists setlist_entries (
      id text primary key,
      show_id text not null,
      song_id text not null,
      position integer not null,
      planned_key text not null default '',
      planned_notes text not null default '',
      performed integer not null default 0,
      started_at text,
      ended_at text,
      transition_notes text not null default '',
      source text not null default 'manual'
    );

    create table if not exists audience_requests (
      id text primary key,
      show_id text not null,
      song_id text not null,
      submitted_at text not null,
      vote_count integer not null default 1,
      status text not null default 'active',
      requester_session_id text not null,
      message text not null default ''
    );

    create table if not exists request_votes (
      id text primary key,
      request_id text not null,
      show_id text not null,
      session_id text not null,
      created_at text not null,
      unique(request_id, session_id)
    );

    create table if not exists show_events (
      id text primary key,
      show_id text not null,
      type text not null,
      entity_id text not null,
      metadata text not null default '{}',
      created_at text not null
    );
  `);

  const songCount = db.prepare("select count(*) as count from songs").get() as { count: number };
  if (songCount.count > 0) return;

  const timestamp = now();
  const songs = [
    {
      id: "song-city-lights",
      title: "City Lights",
      alternateTitles: ["Late Train"],
      defaultKey: "G",
      capo: 0,
      tempo: "92 BPM",
      tuning: "Standard",
      durationEstimate: 5,
      lyricsRichText: "Streetlight halo on the avenue...\nEverybody moving like a midnight choir.",
      chordsText: "G  D  Em  C\nG  D  C",
      tabText: "e|--3---2---0---0--\nB|--3---3---0---1--",
      notes: "Stretch intro if the room is still settling.",
      tags: ["opener", "anthem", "electric"],
      requestable: 1,
    },
    {
      id: "song-borrowed-summer",
      title: "Borrowed Summer",
      alternateTitles: [],
      defaultKey: "D",
      capo: 2,
      tempo: "76 BPM",
      tuning: "Standard",
      durationEstimate: 4,
      lyricsRichText: "We were young enough to think July would wait...",
      chordsText: "D  A  Bm  G",
      tabText: "Acoustic fingerpicked verse.",
      notes: "Works well after a high-energy opener.",
      tags: ["acoustic", "warm", "midtempo"],
      requestable: 1,
    },
    {
      id: "song-static-gold",
      title: "Static & Gold",
      alternateTitles: [],
      defaultKey: "A",
      capo: 0,
      tempo: "118 BPM",
      tuning: "Drop D",
      durationEstimate: 6,
      lyricsRichText: "Static in the speakers, gold in the teeth of the night...",
      chordsText: "A5  G5  D5",
      tabText: "Drive the riff hard in the first chorus.",
      notes: "Great for late-set energy spike.",
      tags: ["rock", "loud", "late-set"],
      requestable: 1,
    },
    {
      id: "song-northbound",
      title: "Northbound",
      alternateTitles: ["Interstate Song"],
      defaultKey: "E",
      capo: 0,
      tempo: "104 BPM",
      tuning: "Standard",
      durationEstimate: 5,
      lyricsRichText: "Northbound windows down, singing to the guardrail...",
      chordsText: "E  B  C#m  A",
      tabText: "Use palm-muted verse chugs.",
      notes: "Audience usually sings the last chorus.",
      tags: ["road", "singalong", "peak"],
      requestable: 1,
    },
    {
      id: "song-house-fireflies",
      title: "House on Fireflies",
      alternateTitles: [],
      defaultKey: "C",
      capo: 0,
      tempo: "68 BPM",
      tuning: "Standard",
      durationEstimate: 4,
      lyricsRichText: "Every porch light is a lighthouse if you're lonely enough...",
      chordsText: "C  G  Am  F",
      tabText: "Keep the bridge sparse.",
      notes: "Best in quieter rooms.",
      tags: ["ballad", "quiet", "night"],
      requestable: 1,
    },
    {
      id: "song-mercury-hotel",
      title: "Mercury Hotel",
      alternateTitles: [],
      defaultKey: "Bm",
      capo: 0,
      tempo: "110 BPM",
      tuning: "Standard",
      durationEstimate: 5,
      lyricsRichText: "Checked into the Mercury with a melody and a bruise...",
      chordsText: "Bm  G  D  A",
      tabText: "Single-note intro hook.",
      notes: "Nice transition into request section.",
      tags: ["groove", "hotel", "story"],
      requestable: 1,
    },
    {
      id: "song-paper-satellites",
      title: "Paper Satellites",
      alternateTitles: [],
      defaultKey: "F",
      capo: 1,
      tempo: "84 BPM",
      tuning: "Standard",
      durationEstimate: 5,
      lyricsRichText: "Paper satellites in a backyard sky...",
      chordsText: "F  C  Dm  Bb",
      tabText: "Slow arpeggio intro.",
      notes: "Save for intimate section.",
      tags: ["acoustic", "story", "encore"],
      requestable: 1,
    },
    {
      id: "song-velvet-thunder",
      title: "Velvet Thunder",
      alternateTitles: [],
      defaultKey: "Am",
      capo: 0,
      tempo: "124 BPM",
      tuning: "Half-step down",
      durationEstimate: 6,
      lyricsRichText: "Velvet thunder in the parking lot...",
      chordsText: "Am  F  C  G",
      tabText: "Big open-string chorus.",
      notes: "Strong closer.",
      tags: ["closer", "big", "electric"],
      requestable: 1,
    },
  ];

  const insertSong = db.prepare(`
    insert or ignore into songs (
      id, title, alternate_titles, status, default_key, capo, tempo, tuning, duration_estimate,
      lyrics_rich_text, chords_text, tab_text, notes, tags, requestable, created_at, updated_at
    ) values (
      @id, @title, @alternate_titles, 'active', @default_key, @capo, @tempo, @tuning, @duration_estimate,
      @lyrics_rich_text, @chords_text, @tab_text, @notes, @tags, @requestable, @created_at, @updated_at
    )
  `);

  for (const song of songs) {
    insertSong.run({
      id: song.id,
      title: song.title,
      alternate_titles: JSON.stringify(song.alternateTitles),
      default_key: song.defaultKey,
      capo: song.capo,
      tempo: song.tempo,
      tuning: song.tuning,
      duration_estimate: song.durationEstimate,
      lyrics_rich_text: song.lyricsRichText,
      chords_text: song.chordsText,
      tab_text: song.tabText,
      notes: song.notes,
      tags: JSON.stringify(song.tags),
      requestable: song.requestable,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }

  const draftShowId = "show-lantern-late-set";
  const liveShowId = "show-rooftop-night-4";
  const insertShow = db.prepare(`
    insert or ignore into shows (
      id, title, venue_name, city, show_date, start_time, status, qr_slug, current_entry_id, started_at, locked_at, notes, created_at
    ) values (
      @id, @title, @venue_name, @city, @show_date, @start_time, @status, @qr_slug, null, @started_at, @locked_at, @notes, @created_at
    )
  `);

  insertShow.run({
    id: draftShowId,
    title: "Late Set at The Lantern",
    venue_name: "The Lantern",
    city: "Brooklyn, NY",
    show_date: "2026-05-08",
    start_time: "21:00",
    status: "draft",
    qr_slug: "lantern-late-set",
    started_at: null,
    locked_at: null,
    notes: "Lean cinematic in the middle section.",
    created_at: timestamp,
  });

  insertShow.run({
    id: liveShowId,
    title: "Rooftop Residency Night 4",
    venue_name: "Skyline Room",
    city: "New York, NY",
    show_date: "2026-04-26",
    start_time: "20:30",
    status: "live",
    qr_slug: "rooftop-night-4",
    started_at: timestamp,
    locked_at: null,
    notes: "Tonight's active demo show.",
    created_at: timestamp,
  });

  const insertEntry = db.prepare(`
    insert or ignore into setlist_entries (
      id, show_id, song_id, position, planned_key, planned_notes, performed, started_at, ended_at, transition_notes, source
    ) values (
      @id, @show_id, @song_id, @position, @planned_key, @planned_notes, @performed, @started_at, @ended_at, @transition_notes, @source
    )
  `);

  const draftOrder = [songs[0], songs[1], songs[5], songs[7]];
  draftOrder.forEach((song, index) =>
    insertEntry.run({
      id: `draft-entry-${index + 1}`,
      show_id: draftShowId,
      song_id: song.id,
      position: index + 1,
      planned_key: song.defaultKey,
      planned_notes: index === 0 ? "Open with the long intro if room is buzzing." : "",
      performed: 0,
      started_at: null,
      ended_at: null,
      transition_notes: "",
      source: "manual",
    }),
  );

  const liveEntries = [songs[2], songs[3], songs[4], songs[6]];
  liveEntries.forEach((song, index) =>
    insertEntry.run({
      id: `live-entry-${index + 1}`,
      show_id: liveShowId,
      song_id: song.id,
      position: index + 1,
      planned_key: song.defaultKey,
      planned_notes: index === 1 ? "Invite crowd singback on last chorus." : "",
      performed: index === 0 ? 1 : 0,
      started_at: index === 0 ? timestamp : null,
      ended_at: index === 0 ? timestamp : null,
      transition_notes: "",
      source: "manual",
    }),
  );

  const currentEntry = db
    .prepare("select id from setlist_entries where show_id = ? order by position limit 1 offset 1")
    .get(liveShowId) as { id: string };
  db.prepare("update shows set current_entry_id = ? where id = ?").run(currentEntry.id, liveShowId);

  const requestId = "request-rooftop-borrowed-summer";
  db.prepare(`
    insert or ignore into audience_requests (id, show_id, song_id, submitted_at, vote_count, status, requester_session_id, message)
    values (?, ?, ?, ?, 3, 'active', ?, ?)
  `).run(requestId, liveShowId, songs[1].id, timestamp, "demo-session-1", "Would love this one before sunset.");

  for (const sessionId of ["demo-session-1", "demo-session-2", "demo-session-3"]) {
    db.prepare(`
      insert or ignore into request_votes (id, request_id, show_id, session_id, created_at)
      values (?, ?, ?, ?, ?)
    `).run(`vote-${sessionId}`, requestId, liveShowId, sessionId, timestamp);
  }
}

init();

type SongInput = {
  id?: string;
  title: string;
  alternateTitles?: string[];
  status?: Song["status"];
  defaultKey?: string;
  capo?: number;
  tempo?: string;
  tuning?: string;
  durationEstimate?: number;
  lyricsRichText?: string;
  chordsText?: string;
  tabText?: string;
  notes?: string;
  tags?: string[];
  requestable?: boolean;
};

export function getSongs() {
  const rows = db.prepare("select * from songs order by updated_at desc, title asc").all() as Record<string, unknown>[];
  return rows.map(mapSong);
}

export function upsertSong(input: SongInput) {
  const timestamp = now();
  const payload = {
    id: input.id ?? crypto.randomUUID(),
    title: input.title.trim(),
    alternate_titles: JSON.stringify(input.alternateTitles ?? []),
    status: input.status ?? "active",
    default_key: input.defaultKey ?? "",
    capo: input.capo ?? 0,
    tempo: input.tempo ?? "",
    tuning: input.tuning ?? "",
    duration_estimate: input.durationEstimate ?? 0,
    lyrics_rich_text: input.lyricsRichText ?? "",
    chords_text: input.chordsText ?? "",
    tab_text: input.tabText ?? "",
    notes: input.notes ?? "",
    tags: JSON.stringify(input.tags ?? []),
    requestable: input.requestable ? 1 : 0,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const existing = input.id
    ? db.prepare("select id, created_at from songs where id = ?").get(input.id)
    : null;

  if (existing) {
    db.prepare(`
      update songs
      set title = @title,
          alternate_titles = @alternate_titles,
          status = @status,
          default_key = @default_key,
          capo = @capo,
          tempo = @tempo,
          tuning = @tuning,
          duration_estimate = @duration_estimate,
          lyrics_rich_text = @lyrics_rich_text,
          chords_text = @chords_text,
          tab_text = @tab_text,
          notes = @notes,
          tags = @tags,
          requestable = @requestable,
          updated_at = @updated_at
      where id = @id
    `).run({
      ...payload,
      created_at: (existing as { created_at: string }).created_at,
    });
  } else {
    db.prepare(`
      insert into songs (
        id, title, alternate_titles, status, default_key, capo, tempo, tuning, duration_estimate,
        lyrics_rich_text, chords_text, tab_text, notes, tags, requestable, created_at, updated_at
      ) values (
        @id, @title, @alternate_titles, @status, @default_key, @capo, @tempo, @tuning, @duration_estimate,
        @lyrics_rich_text, @chords_text, @tab_text, @notes, @tags, @requestable, @created_at, @updated_at
      )
    `).run(payload);
  }

  return getSongById(payload.id);
}

export function getSongById(id: string) {
  const row = db.prepare("select * from songs where id = ?").get(id) as Record<string, unknown>;
  return mapSong(row);
}

export function getSongStats(): SongStats[] {
  const rows = db
    .prepare(`
      select
        s.id as song_id,
        s.title,
        coalesce(sum(case when se.performed = 1 then 1 else 0 end), 0) as play_count,
        coalesce(sum(ar.vote_count), 0) as request_count,
        max(case when se.performed = 1 then sh.show_date else null end) as last_played
      from songs s
      left join setlist_entries se on se.song_id = s.id
      left join shows sh on sh.id = se.show_id and sh.status = 'locked'
      left join audience_requests ar on ar.song_id = s.id
      group by s.id
      order by play_count desc, request_count desc, s.title asc
    `)
    .all() as {
    song_id: string;
    title: string;
    play_count: number;
    request_count: number;
    last_played: string | null;
  }[];

  return rows.map((row) => ({
    songId: row.song_id,
    title: row.title,
    playCount: row.play_count,
    requestCount: row.request_count,
    requestToPlayRate: row.request_count > 0 ? Number((row.play_count / row.request_count).toFixed(2)) : 0,
    lastPlayed: row.last_played,
  }));
}

export function getShows(): ShowSummary[] {
  const rows = db
    .prepare(`
      select
        sh.*,
        count(distinct se.id) as total_songs,
        coalesce(sum(case when se.performed = 1 then 1 else 0 end), 0) as played_songs,
        coalesce(sum(distinct ar.vote_count), 0) as total_requests
      from shows sh
      left join setlist_entries se on se.show_id = sh.id
      left join audience_requests ar on ar.show_id = sh.id
      group by sh.id
      order by sh.show_date desc, sh.created_at desc
    `)
    .all() as (Record<string, unknown> & {
    total_songs: number;
    played_songs: number;
    total_requests: number;
  })[];

  return rows.map((row) => ({
    ...mapShow(row),
    totalSongs: Number(row.total_songs || 0),
    totalRequests: Number(row.total_requests || 0),
    playedSongs: Number(row.played_songs || 0),
  }));
}

export function createShow(input: {
  title: string;
  venueName?: string;
  city?: string;
  showDate?: string;
  startTime?: string;
  notes?: string;
}) {
  const id = crypto.randomUUID();
  const timestamp = now();
  const baseSlug = slugify(`${input.title}-${input.showDate || timestamp.slice(0, 10)}`) || `show-${timestamp.slice(0, 10)}`;
  let slug = baseSlug;
  let suffix = 2;

  while (db.prepare("select 1 from shows where qr_slug = ?").get(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  db.prepare(`
    insert into shows (
      id, title, venue_name, city, show_date, start_time, status, qr_slug, current_entry_id, started_at, locked_at, notes, created_at
    ) values (?, ?, ?, ?, ?, ?, 'draft', ?, null, null, null, ?, ?)
  `).run(
    id,
    input.title.trim(),
    input.venueName?.trim() || "",
    input.city?.trim() || "",
    input.showDate || "",
    input.startTime || "",
    slug,
    input.notes?.trim() || "",
    timestamp,
  );

  return id;
}

export function getShow(showId: string) {
  const showRow = db.prepare("select * from shows where id = ?").get(showId) as Record<string, unknown> | undefined;
  if (!showRow) return null;

  const show = mapShow(showRow);
  const entries = db
    .prepare(`
      select se.*, s.*
      from setlist_entries se
      join songs s on s.id = se.song_id
      where se.show_id = ?
      order by se.position asc
    `)
    .all(showId) as (Record<string, unknown> & { position: number })[];

  const requests = db
    .prepare(`
      select ar.*, s.*
      from audience_requests ar
      join songs s on s.id = ar.song_id
      where ar.show_id = ?
      order by
        case ar.status when 'active' then 0 when 'fulfilled' then 1 else 2 end,
        ar.vote_count desc,
        ar.submitted_at desc
    `)
    .all(showId) as Record<string, unknown>[];

  return {
    show,
    entries: entries.map((row) => ({
      id: row.id as string,
      showId: row.show_id as string,
      songId: row.song_id as string,
      position: Number(row.position),
      plannedKey: (row.planned_key as string) || "",
      plannedNotes: (row.planned_notes as string) || "",
      performed: boolFromInt(Number(row.performed || 0)),
      startedAt: (row.started_at as string) || null,
      endedAt: (row.ended_at as string) || null,
      transitionNotes: (row.transition_notes as string) || "",
      source: row.source as SetlistEntry["source"],
      song: mapSong(row),
    })),
    requests: requests.map((row) => ({
      id: row.id as string,
      showId: row.show_id as string,
      songId: row.song_id as string,
      submittedAt: row.submitted_at as string,
      voteCount: Number(row.vote_count || 0),
      status: row.status as AudienceRequest["status"],
      requesterSessionId: row.requester_session_id as string,
      message: (row.message as string) || "",
      song: mapSong(row),
    })),
  };
}

export function addSetlistEntry(input: {
  showId: string;
  songId: string;
  source?: SetlistEntry["source"];
  plannedNotes?: string;
  plannedKey?: string;
}) {
  const positionRow = db
    .prepare("select coalesce(max(position), 0) as max_position from setlist_entries where show_id = ?")
    .get(input.showId) as { max_position: number };

  const song = getSongById(input.songId);
  db.prepare(`
    insert into setlist_entries (
      id, show_id, song_id, position, planned_key, planned_notes, performed, started_at, ended_at, transition_notes, source
    ) values (?, ?, ?, ?, ?, ?, 0, null, null, '', ?)
  `).run(
    crypto.randomUUID(),
    input.showId,
    input.songId,
    positionRow.max_position + 1,
    input.plannedKey ?? song.defaultKey,
    input.plannedNotes ?? "",
    input.source ?? "manual",
  );
}

export function reorderSetlist(showId: string, entryIds: string[]) {
  const update = db.prepare("update setlist_entries set position = ? where id = ? and show_id = ?");
  const transaction = db.transaction(() => {
    entryIds.forEach((entryId, index) => update.run(index + 1, entryId, showId));
  });
  transaction();
}

export function updateSetlistEntry(input: {
  showId: string;
  entryId: string;
  plannedNotes?: string;
  plannedKey?: string;
}) {
  db.prepare(`
    update setlist_entries
    set planned_notes = coalesce(?, planned_notes),
        planned_key = coalesce(?, planned_key)
    where id = ? and show_id = ?
  `).run(input.plannedNotes ?? null, input.plannedKey ?? null, input.entryId, input.showId);
}

export function setShowStatus(showId: string, status: Show["status"]) {
  const timestamp = now();
  if (status === "live") {
    db.prepare("update shows set status = 'live', started_at = coalesce(started_at, ?) where id = ?").run(
      timestamp,
      showId,
    );
    logShowEvent(showId, "show_started", showId);
  } else {
    db.prepare("update shows set status = ? where id = ?").run(status, showId);
  }
}

export function setCurrentEntry(showId: string, entryId: string) {
  db.prepare("update shows set current_entry_id = ? where id = ?").run(entryId, showId);
}

export function markSongStarted(showId: string, entryId: string) {
  const timestamp = now();
  db.prepare(`
    update setlist_entries
    set started_at = coalesce(started_at, ?)
    where id = ? and show_id = ?
  `).run(timestamp, entryId, showId);
  setCurrentEntry(showId, entryId);
  logShowEvent(showId, "song_started", entryId);
}

export function markSongCompleted(showId: string, entryId: string) {
  const timestamp = now();
  db.prepare(`
    update setlist_entries
    set ended_at = coalesce(ended_at, ?),
        performed = 1
    where id = ? and show_id = ?
  `).run(timestamp, entryId, showId);
  logShowEvent(showId, "song_completed", entryId);
}

export function moveCurrentEntry(showId: string, direction: "next" | "previous") {
  const show = getShow(showId);
  if (!show || show.entries.length === 0) return;

  const currentIndex = show.entries.findIndex((entry) => entry.id === show.show.currentEntryId);
  const nextIndex =
    currentIndex === -1
      ? 0
      : direction === "next"
        ? Math.min(show.entries.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
  setCurrentEntry(showId, show.entries[nextIndex].id);
}

function latestAudienceAction(showId: string, sessionId: string) {
  const latestRequest = db
    .prepare("select submitted_at as created_at from audience_requests where show_id = ? and requester_session_id = ? order by submitted_at desc limit 1")
    .get(showId, sessionId) as { created_at?: string } | undefined;
  const latestVote = db
    .prepare("select created_at from request_votes where show_id = ? and session_id = ? order by created_at desc limit 1")
    .get(showId, sessionId) as { created_at?: string } | undefined;

  return [latestRequest?.created_at, latestVote?.created_at].filter(Boolean).sort().at(-1) ?? null;
}

function assertAudienceCooldown(showId: string, sessionId: string) {
  const latest = latestAudienceAction(showId, sessionId);
  if (!latest) return;
  const elapsed = Date.now() - Date.parse(latest);
  if (elapsed < 15000) {
    throw new Error("Please wait a moment before interacting again.");
  }
}

export function submitAudienceRequest(input: {
  showId: string;
  songId: string;
  sessionId: string;
  message?: string;
}) {
  const show = getShow(input.showId);
  if (!show || show.show.status !== "live") {
    throw new Error("This show is not currently taking requests.");
  }

  const song = getSongById(input.songId);
  if (!song.requestable || song.status !== "active") {
    throw new Error("That song is not available for requests right now.");
  }

  assertAudienceCooldown(input.showId, input.sessionId);

  const existing = db
    .prepare(`
      select * from audience_requests
      where show_id = ? and song_id = ? and status = 'active'
      limit 1
    `)
    .get(input.showId, input.songId) as { id: string } | undefined;

  if (existing) {
    return upvoteAudienceRequest(existing.id, input.sessionId);
  }

  const timestamp = now();
  const requestId = crypto.randomUUID();
  db.prepare(`
    insert into audience_requests (id, show_id, song_id, submitted_at, vote_count, status, requester_session_id, message)
    values (?, ?, ?, ?, 1, 'active', ?, ?)
  `).run(requestId, input.showId, input.songId, timestamp, input.sessionId, input.message?.trim() || "");

  db.prepare(`
    insert into request_votes (id, request_id, show_id, session_id, created_at)
    values (?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), requestId, input.showId, input.sessionId, timestamp);

  logShowEvent(input.showId, "request_received", requestId, { songId: input.songId });
  return requestId;
}

export function upvoteAudienceRequest(requestId: string, sessionId: string) {
  const request = db
    .prepare("select * from audience_requests where id = ?")
    .get(requestId) as { id: string; show_id: string; status: string } | undefined;
  if (!request || request.status !== "active") {
    throw new Error("That request is no longer active.");
  }

  assertAudienceCooldown(request.show_id, sessionId);

  const existingVote = db
    .prepare("select 1 from request_votes where request_id = ? and session_id = ?")
    .get(requestId, sessionId);
  if (existingVote) {
    throw new Error("You already voted for that request.");
  }

  const timestamp = now();
  db.prepare(`
    insert into request_votes (id, request_id, show_id, session_id, created_at)
    values (?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), requestId, request.show_id, sessionId, timestamp);

  db.prepare("update audience_requests set vote_count = vote_count + 1 where id = ?").run(requestId);
  logShowEvent(request.show_id, "request_upvoted", requestId);

  return requestId;
}

export function setRequestStatus(requestId: string, status: AudienceRequest["status"]) {
  db.prepare("update audience_requests set status = ? where id = ?").run(status, requestId);
}

export function addRequestToSetlist(requestId: string) {
  const request = db
    .prepare("select * from audience_requests where id = ?")
    .get(requestId) as { show_id: string; song_id: string } | undefined;
  if (!request) return;
  addSetlistEntry({ showId: request.show_id, songId: request.song_id, source: "request" });
  setRequestStatus(requestId, "fulfilled");
}

export function getAudienceShowBySlug(slug: string) {
  const showRow = db
    .prepare("select * from shows where qr_slug = ? limit 1")
    .get(slug) as Record<string, unknown> | undefined;
  if (!showRow) return null;

  const show = mapShow(showRow);
  const songs = db
    .prepare("select * from songs where requestable = 1 and status = 'active' order by title asc")
    .all() as Record<string, unknown>[];
  const requests = getShow(show.id)?.requests ?? [];

  return {
    show,
    songs: songs.map(mapSong),
    requests: requests.filter((request) => request.status === "active"),
  };
}

export function lockShow(showId: string) {
  const timestamp = now();
  db.prepare("update shows set status = 'locked', locked_at = ? where id = ?").run(timestamp, showId);
  logShowEvent(showId, "setlist_locked", showId);
}

export function getShowReport(showId: string): ShowReport | null {
  const show = getShow(showId);
  if (!show) return null;

  const estimatedMinutes = show.entries.reduce((sum, entry) => sum + entry.song.durationEstimate, 0);
  const capturedMinutes = show.entries.reduce((sum, entry) => sum + minutesBetween(entry.startedAt, entry.endedAt), 0);
  const playedSongs = show.entries.filter((entry) => entry.performed).length;
  const fulfilledRequests = show.requests.filter((request) => request.status === "fulfilled").length;

  return {
    show: show.show,
    entries: show.entries,
    requests: show.requests,
    metrics: {
      totalSongs: show.entries.length,
      playedSongs,
      totalRequests: show.requests.reduce((sum, request) => sum + request.voteCount, 0),
      fulfilledRequests,
      estimatedMinutes,
      capturedMinutes,
      requestConversionRate:
        show.requests.length > 0 ? Number((fulfilledRequests / show.requests.length).toFixed(2)) : 0,
    },
  };
}

export function getDashboardSnapshot() {
  const songs = getSongs();
  const songStats = getSongStats();
  const shows = getShows();
  const liveShow = shows.find((show) => show.status === "live") ?? null;
  return { songs, songStats, shows, liveShow };
}

export function toCsv(report: ShowReport) {
  const header = ["Position", "Song", "Source", "Planned Key", "Performed", "Started At", "Ended At", "Notes"];
  const rows = report.entries.map((entry) => [
    String(entry.position),
    entry.song.title,
    entry.source,
    entry.plannedKey,
    entry.performed ? "Yes" : "No",
    entry.startedAt || "",
    entry.endedAt || "",
    entry.plannedNotes.replace(/\n/g, " "),
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
