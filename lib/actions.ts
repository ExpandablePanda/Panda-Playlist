"use server";

import { db } from "./db";
import { Song, Show, SetlistEntry } from "./types";
import { revalidatePath } from "next/cache";

// Songs
export async function getSongsAction() {
  return await db.getSongs();
}

export async function saveSongAction(song: Partial<Song>) {
  const id = await db.saveSong(song);
  revalidatePath("/library");
  revalidatePath("/");
  return id;
}

export async function deleteSongAction(id: string) {
  await db.deleteSong(id);
  revalidatePath("/library");
  revalidatePath("/");
}

// Shows
export async function getShowsAction() {
  return await db.getShows();
}

export async function getShowAction(id: string) {
  return await db.getShow(id);
}

export async function saveShowAction(show: Partial<Show>) {
  const id = await db.saveShow(show);
  revalidatePath("/tour");
  revalidatePath("/");
  return id;
}

export async function deleteShowAction(id: string) {
  await db.deleteShow(id);
  revalidatePath("/tour");
  revalidatePath("/");
}

export async function saveSetlistAction(showId: string, entries: Partial<SetlistEntry>[]) {
  await db.saveSetlist(showId, entries);
  revalidatePath(`/planner`);
  revalidatePath("/");
}
