import fs from "node:fs";
import path from "node:path";
import { Song, Show, SetlistEntry, AudienceRequest } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "db.json");

interface DBContent {
  songs: Song[];
  shows: Show[];
  setlistEntries: SetlistEntry[];
  requests: AudienceRequest[];
}

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData: DBContent = {
      songs: [],
      shows: [],
      setlistEntries: [],
      requests: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

function readDB(): DBContent {
  ensureDataDir();
  const content = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(content);
}

// -- API METHODS --

export function getSongs(): Song[] {
  return readDB().songs;
}

export function getShows(): Show[] {
  return readDB().shows;
}

export function getShow(id: string) {
  const db = readDB();
  const show = db.shows.find(s => s.id === id);
  if (!show) return null;
  const entries = db.setlistEntries
    .filter(e => e.showId === id)
    .sort((a, b) => a.position - b.position)
    .map(e => {
      const { song, ...entryData } = e; // Strip any nested song if it exists in DB
      return {
        ...entryData,
        song: db.songs.find(s => s.id === e.songId)
      };
    });
  return { show, entries };
}

export function saveSong(song: Song) {
  const db = readDB();
  const index = db.songs.findIndex(s => s.id === song.id);
  
  if (index !== -1) {
    db.songs[index] = { ...song, updatedAt: new Date().toISOString() };
  } else {
    db.songs.push({ 
      ...song, 
      id: song.id || Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    });
  }
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export function deleteSong(id: string) {
  const db = readDB();
  db.songs = db.songs.filter(s => s.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export function saveShow(show: Show) {
  const db = readDB();
  const index = db.shows.findIndex(s => s.id === show.id);
  
  if (index !== -1) {
    db.shows[index] = { ...show, updatedAt: new Date().toISOString() };
  } else {
    db.shows.push({ 
      ...show, 
      id: show.id || Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    });
  }
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export function deleteShow(id: string) {
  const db = readDB();
  db.shows = db.shows.filter(s => s.id !== id);
  db.setlistEntries = db.setlistEntries.filter(e => e.showId !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export function saveSetlist(showId: string, entries: SetlistEntry[]) {
  const db = readDB();
  // Remove existing entries for this show
  db.setlistEntries = db.setlistEntries.filter(e => e.showId !== showId);
  // Add new entries
  const newEntries = entries.map((e, idx) => {
    const { song, ...entryData } = e; // Strip nested song data
    return {
      ...entryData,
      showId,
      position: idx + 1,
      id: e.id || Math.random().toString(36).substr(2, 9)
    };
  });
  db.setlistEntries.push(...newEntries);
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
