import { neon } from '@neondatabase/serverless';
import { Song, Show, SetlistEntry } from './types';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);

export const db = {
  // Songs
  getSongs: async () => {
    const result = await sql`SELECT * FROM songs ORDER BY created_at DESC`;
    return result.map(row => ({
      id: row.id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      songType: row.song_type,
      alternateTitles: row.alternate_titles,
      status: row.status,
      defaultKey: row.default_key,
      capo: row.capo,
      tempo: row.tempo,
      tuning: row.tuning,
      durationEstimate: row.duration_estimate,
      artworkUrl: row.artwork_url,
      lyrics: row.lyrics,
      chords: row.chords,
      tabs: row.tabs,
      notes: row.notes,
      tags: row.tags,
      requestable: row.requestable,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) as Song[];
  },
  
  saveSong: async (song: Partial<Song>) => {
    const id = song.id || Math.random().toString(36).substr(2, 9);
    const existing = await sql`SELECT id FROM songs WHERE id = ${id}`;
    
    if (existing.length > 0) {
      await sql`
        UPDATE songs SET 
          title = ${song.title},
          artist = ${song.artist},
          album = ${song.album},
          song_type = ${song.songType},
          alternate_titles = ${song.alternateTitles},
          status = ${song.status},
          default_key = ${song.defaultKey},
          capo = ${song.capo},
          tempo = ${song.tempo},
          tuning = ${song.tuning},
          duration_estimate = ${song.durationEstimate},
          artwork_url = ${song.artworkUrl},
          lyrics = ${song.lyrics},
          chords = ${song.chords},
          tabs = ${song.tabs},
          notes = ${song.notes},
          tags = ${song.tags},
          requestable = ${song.requestable},
          updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO songs (
          id, title, artist, album, song_type, alternate_titles, status, 
          default_key, capo, tempo, tuning, duration_estimate, artwork_url, 
          lyrics, chords, tabs, notes, tags, requestable
        ) VALUES (
          ${id}, ${song.title}, ${song.artist}, ${song.album}, ${song.songType}, 
          ${song.alternateTitles || []}, ${song.status}, ${song.defaultKey}, ${song.capo || 0}, 
          ${song.tempo}, ${song.tuning}, ${song.durationEstimate || 0}, ${song.artworkUrl}, 
          ${song.lyrics || ''}, ${song.chords || ''}, ${song.tabs || ''}, ${song.notes || ''}, ${song.tags || []}, 
          ${song.requestable || true}
        )
      `;
    }
    return id;
  },

  deleteSong: async (id: string) => {
    await sql`DELETE FROM songs WHERE id = ${id}`;
  },

  // Shows
  getShows: async () => {
    const result = await sql`SELECT * FROM shows ORDER BY date DESC`;
    return result as Show[];
  },

  getShow: async (id: string) => {
    const showResult = await sql`SELECT * FROM shows WHERE id = ${id}`;
    if (showResult.length === 0) return null;
    
    const row = showResult[0];
    const show: Show = {
      id: row.id,
      date: row.date,
      venue: row.venue,
      location: row.location,
      address: row.address,
      city: row.city,
      state: row.state,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      rate: row.rate,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    const entriesResult = await sql`
      SELECT e.*, s.title, s.artist, s.duration_estimate
      FROM setlist_entries e
      JOIN songs s ON e.song_id = s.id
      WHERE e.show_id = ${id}
      ORDER BY e.position ASC
    `;
    
    return { 
      show, 
      entries: entriesResult.map(e => ({
        id: e.id,
        showId: e.show_id,
        songId: e.song_id,
        position: e.position,
        plannedKey: e.planned_key,
        plannedNotes: e.planned_notes,
        performed: e.performed,
        rehearsalStatus: e.rehearsal_status,
        rehearsalNotes: e.rehearsal_notes,
        actualDuration: e.actual_duration,
        song: {
          id: e.song_id,
          title: e.title,
          artist: e.artist,
          durationEstimate: e.duration_estimate
        }
      })) 
    };
  },

  saveShow: async (show: Partial<Show>) => {
    const id = show.id || Math.random().toString(36).substr(2, 9);
    const existing = await sql`SELECT id FROM shows WHERE id = ${id}`;
    
    if (existing.length > 0) {
      await sql`
        UPDATE shows SET 
          date = ${show.date},
          venue = ${show.venue},
          location = ${show.location},
          address = ${show.address},
          city = ${show.city},
          state = ${show.state},
          contact_name = ${show.contactName},
          contact_phone = ${show.contactPhone},
          contact_email = ${show.contactEmail},
          rate = ${show.rate},
          status = ${show.status},
          notes = ${show.notes},
          updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO shows (
          id, date, venue, location, address, city, state, 
          contact_name, contact_phone, contact_email, rate, status, notes
        ) VALUES (
          ${id}, ${show.date}, ${show.venue}, ${show.location}, ${show.address || ''}, 
          ${show.city}, ${show.state}, ${show.contactName || ''}, ${show.contactPhone || ''}, 
          ${show.contactEmail || ''}, ${show.rate || 0}, ${show.status}, ${show.notes || ''}
        )
      `;
    }
    return id;
  },

  deleteShow: async (id: string) => {
    await sql`DELETE FROM shows WHERE id = ${id}`;
  },

  saveSetlist: async (showId: string, entries: Partial<SetlistEntry>[]) => {
    await sql`DELETE FROM setlist_entries WHERE show_id = ${showId}`;
    
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const id = e.id || Math.random().toString(36).substr(2, 9);
      await sql`
        INSERT INTO setlist_entries (
          id, show_id, song_id, position, planned_key, planned_notes, performed
        ) VALUES (
          ${id}, ${showId}, ${e.songId}, ${i + 1}, ${e.plannedKey || ''}, ${e.plannedNotes || ''}, ${e.performed || false}
        )
      `;
    }
  }
};
