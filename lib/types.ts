export type SongStatus = "active" | "retired" | "private";
export type ShowStatus = "upcoming" | "completed" | "cancelled";
export type RequestStatus = "active" | "fulfilled" | "ignored";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  songType: 'original' | 'cover';
  alternateTitles: string[];
  status: SongStatus;
  defaultKey: string;
  capo: number;
  tempo: string;
  tuning: string;
  durationEstimate: number;
  artworkUrl?: string;
  lyrics: string;
  chords: string;
  tabs: string;
  notes: string;
  tags: string[];
  requestable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Show {
  id: string;
  date: string;
  venue: string;
  location: string; // "City, State" summary
  address: string;
  city: string;
  state: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  rate: number;
  status: ShowStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetlistEntry {
  id: string;
  showId: string;
  songId: string;
  position: number;
  plannedKey: string;
  plannedNotes: string;
  performed: boolean;
  rehearsalStatus?: 'worked' | 'needs-work' | 'scrap';
  rehearsalNotes?: string;
  actualDuration?: number;
  song?: Song;
}

export interface AudienceRequest {
  id: string;
  showId: string;
  songId: string;
  submittedAt: string;
  voteCount: number;
  status: RequestStatus;
  message: string;
  song?: Song;
}
