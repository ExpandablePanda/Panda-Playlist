import { Song, Show, SetlistEntry, AudienceRequest } from "./types";

const STORAGE_KEY = "panda_playlist_db";

interface DBContent {
  songs: Song[];
  shows: Show[];
  setlistEntries: SetlistEntry[];
  requests: AudienceRequest[];
}

const INITIAL_DATA: DBContent = {
  songs: [
    { id: "1", title: "Neon Lights", artist: "The Pandas", durationEstimate: 210, key: "Am", energy: 8, bpm: 124, tags: ["High Energy", "Opener"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "2", title: "Bamboo Groove", artist: "The Pandas", durationEstimate: 185, key: "G", energy: 5, bpm: 105, tags: ["Chill", "Mid-set"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ],
  shows: [
    { id: "s1", date: new Date().toISOString(), venue: "The Bamboo Lounge", city: "San Francisco", state: "CA", status: "upcoming", rate: 500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ],
  setlistEntries: [],
  requests: []
};

function getDB(): DBContent {
  if (typeof window === "undefined") return INITIAL_DATA;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  return JSON.parse(stored);
}

function saveDB(db: DBContent) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

export const clientDb = {
  getSongs: () => getDB().songs,
  getShows: () => getDB().shows,
  getShow: (id: string) => {
    const db = getDB();
    const show = db.shows.find(s => s.id === id);
    if (!show) return null;
    const entries = db.setlistEntries
      .filter(e => e.showId === id)
      .sort((a, b) => a.position - b.position)
      .map(e => ({
        ...e,
        song: db.songs.find(s => s.id === e.songId)
      }));
    return { show, entries };
  },
  saveSong: (song: Partial<Song>) => {
    const db = getDB();
    const id = song.id || Math.random().toString(36).substr(2, 9);
    const index = db.songs.findIndex(s => s.id === id);
    const newSong = { 
      ...song, 
      id, 
      updatedAt: new Date().toISOString(),
      createdAt: song.createdAt || new Date().toISOString()
    } as Song;
    
    if (index !== -1) db.songs[index] = newSong;
    else db.songs.push(newSong);
    saveDB(db);
    return newSong;
  },
  deleteSong: (id: string) => {
    const db = getDB();
    db.songs = db.songs.filter(s => s.id !== id);
    saveDB(db);
  },
  saveShow: (show: Partial<Show>) => {
    const db = getDB();
    const id = show.id || Math.random().toString(36).substr(2, 9);
    const index = db.shows.findIndex(s => s.id === id);
    const newShow = { 
      ...show, 
      id, 
      updatedAt: new Date().toISOString(),
      createdAt: show.createdAt || new Date().toISOString()
    } as Show;
    
    if (index !== -1) db.shows[index] = newShow;
    else db.shows.push(newShow);
    saveDB(db);
    return newShow;
  },
  deleteShow: (id: string) => {
    const db = getDB();
    db.shows = db.shows.filter(s => s.id !== id);
    db.setlistEntries = db.setlistEntries.filter(e => e.showId !== id);
    saveDB(db);
  },
  saveSetlist: (showId: string, entries: SetlistEntry[]) => {
    const db = getDB();
    db.setlistEntries = db.setlistEntries.filter(e => e.showId !== showId);
    const newEntries = entries.map((e, idx) => ({
      ...e,
      showId,
      position: idx + 1,
      id: e.id || Math.random().toString(36).substr(2, 9)
    }));
    db.setlistEntries.push(...newEntries);
    saveDB(db);
    return newEntries;
  }
};
