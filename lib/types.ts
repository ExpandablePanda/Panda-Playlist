export type SongStatus = "active" | "retired" | "private";
export type ShowStatus = "draft" | "live" | "locked";
export type RequestStatus = "active" | "fulfilled" | "ignored";
export type SetlistSource = "manual" | "request";

export type Song = {
  id: string;
  title: string;
  alternateTitles: string[];
  status: SongStatus;
  defaultKey: string;
  capo: number;
  tempo: string;
  tuning: string;
  durationEstimate: number;
  lyricsRichText: string;
  chordsText: string;
  tabText: string;
  notes: string;
  tags: string[];
  requestable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Show = {
  id: string;
  title: string;
  venueName: string;
  city: string;
  showDate: string;
  startTime: string;
  status: ShowStatus;
  qrSlug: string;
  currentEntryId: string | null;
  startedAt: string | null;
  lockedAt: string | null;
  notes: string;
  createdAt: string;
};

export type SetlistEntry = {
  id: string;
  showId: string;
  songId: string;
  position: number;
  plannedKey: string;
  plannedNotes: string;
  performed: boolean;
  startedAt: string | null;
  endedAt: string | null;
  transitionNotes: string;
  source: SetlistSource;
  song: Song;
};

export type AudienceRequest = {
  id: string;
  showId: string;
  songId: string;
  submittedAt: string;
  voteCount: number;
  status: RequestStatus;
  requesterSessionId: string;
  message: string;
  song: Song;
};

export type ShowEvent = {
  id: string;
  showId: string;
  type:
    | "show_started"
    | "song_started"
    | "song_completed"
    | "request_received"
    | "request_upvoted"
    | "setlist_locked";
  entityId: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type SongStats = {
  songId: string;
  title: string;
  playCount: number;
  requestCount: number;
  requestToPlayRate: number;
  lastPlayed: string | null;
};

export type ShowSummary = Show & {
  totalSongs: number;
  totalRequests: number;
  playedSongs: number;
};

export type ShowReport = {
  show: Show;
  entries: SetlistEntry[];
  requests: AudienceRequest[];
  metrics: {
    totalSongs: number;
    playedSongs: number;
    totalRequests: number;
    fulfilledRequests: number;
    estimatedMinutes: number;
    capturedMinutes: number;
    requestConversionRate: number;
  };
};
