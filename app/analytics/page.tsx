"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, BarChart3, PieChart, Activity, 
  Music2, Calendar, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, Zap, Target,
  ChevronRight, Play, Heart, Star
} from "lucide-react";
import Link from "next/link";
import { Song, Show, SetlistEntry } from "@/lib/types";
import { getSongsAction, getShowsAction, getShowAction } from "@/lib/actions";

export default function AnalyticsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [entries, setEntries] = useState<SetlistEntry[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const songsData = await getSongsAction();
      const showsData = await getShowsAction();
      const allEntries: SetlistEntry[] = [];
      
      await Promise.all(showsData.map(async (show) => {
        const showData = await getShowAction(show.id);
        if (showData?.entries) {
          allEntries.push(...showData.entries as SetlistEntry[]);
        }
      }));

      setSongs(songsData);
      setShows(showsData);
      setEntries(allEntries);
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const performedEntries = entries.filter(e => e.performed || true); // For now assuming all entries in shows are performance intents
    const songPlayCounts: Record<string, number> = {};
    entries.forEach(e => {
      songPlayCounts[e.songId] = (songPlayCounts[e.songId] || 0) + 1;
    });

    const topSongs = Object.entries(songPlayCounts)
      .map(([id, count]) => ({
        song: songs.find(s => s.id === id),
        count
      }))
      .filter(item => item.song)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const keyDistribution: Record<string, number> = {};
    songs.forEach(s => {
      if (s.defaultKey) keyDistribution[s.defaultKey] = (keyDistribution[s.defaultKey] || 0) + 1;
    });

    const typeDistribution = {
      original: songs.filter(s => s.songType === 'original').length,
      cover: songs.filter(s => s.songType === 'cover').length
    };

    const totalDuration = entries.reduce((sum, e) => sum + (e.actualDuration || (e.song?.durationEstimate || 4) * 60), 0);
    const avgShowDuration = shows.length ? Math.round((totalDuration / 60) / shows.length) : 0;

    return {
      topSongs,
      keyDistribution: Object.entries(keyDistribution).sort((a, b) => b[1] - a[1]).slice(0, 6),
      typeDistribution,
      avgShowDuration,
      totalShows: shows.length,
      totalSongs: songs.length
    };
  }, [songs, shows, entries]);

  return (
    <div className="min-h-screen obsidian-bg text-white p-8 pt-32 pb-20">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 animate-in fade-in slide-in-from-bottom duration-700">
           <div className="flex items-center gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/20"><Activity size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Performance Intelligence</span>
           </div>
           <h1 className="display-title text-6xl md:text-8xl italic font-black tracking-tighter">Insights</h1>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* TOP LEVEL METRICS */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
             <div className="glass p-10 rounded-[40px] border-white/5 bg-gradient-to-br from-violet-600/10 to-transparent flex flex-col justify-between h-[320px]">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total Repertoire</p>
                   <h2 className="text-7xl font-black italic tracking-tighter">{stats.totalSongs}</h2>
                   <p className="text-xs text-white/20 mt-2 font-medium">Curated high-performance tracks</p>
                </div>
                <div className="flex gap-4">
                   <div className="flex-1 glass p-4 rounded-2xl border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Originals</p>
                      <p className="text-xl font-black text-violet-400">{stats.typeDistribution.original}</p>
                   </div>
                   <div className="flex-1 glass p-4 rounded-2xl border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Covers</p>
                      <p className="text-xl font-black text-amber-400">{stats.typeDistribution.cover}</p>
                   </div>
                </div>
             </div>

             <div className="glass p-10 rounded-[40px] border-white/5 bg-gradient-to-br from-emerald-600/10 to-transparent h-[240px] flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Avg. Show Time</p>
                <div className="flex items-baseline gap-3">
                   <h2 className="text-7xl font-black italic tracking-tighter text-emerald-400">{stats.avgShowDuration}</h2>
                   <span className="text-xl font-black uppercase text-emerald-400/40">Min</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500/60">
                   <TrendingUp size={12} /> Optimized for venue yield
                </div>
             </div>
          </div>

          {/* TOP SONGS - CUSTOM CHART */}
          <div className="col-span-12 lg:col-span-8">
             <div className="glass p-10 rounded-[40px] border-white/5 h-full">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-xl font-black uppercase tracking-widest">Heavy Rotation</h3>
                   <div className="px-4 py-1.5 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">Most Performed Tracks</div>
                </div>
                
                <div className="space-y-8">
                   {stats.topSongs.map((item, i) => (
                     <div key={i} className="group cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-4">
                              <span className="text-2xl font-black italic text-white/10 group-hover:text-violet-500/40 transition-colors">0{i+1}</span>
                              <div>
                                 <h4 className="font-bold text-white group-hover:text-violet-400 transition-colors">{item.song?.title}</h4>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.song?.artist}</p>
                              </div>
                           </div>
                           <span className="text-sm font-black text-white/60">{item.count} Plays</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full animate-in slide-in-from-left duration-1000"
                             style={{ width: `${(item.count / stats.topSongs[0].count) * 100}%`, transitionDelay: `${i * 100}ms` }}
                           />
                        </div>
                     </div>
                   ))}
                </div>

                {stats.topSongs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 opacity-20">
                     <Music2 size={48} className="mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No performance data yet</p>
                  </div>
                )}
             </div>
          </div>

          {/* SECOND ROW */}
          <div className="col-span-12 lg:col-span-6">
             <div className="glass p-10 rounded-[40px] border-white/5">
                <h3 className="text-xl font-black uppercase tracking-widest mb-10">Tonal Landscape</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   {stats.keyDistribution.map(([key, count], i) => (
                     <div key={i} className="relative group">
                        <div className="h-24 w-full rounded-3xl glass border-white/5 flex flex-col items-center justify-center bg-white/[0.02] group-hover:bg-violet-600/10 transition-all border group-hover:border-violet-500/30">
                           <span className="text-2xl font-black italic text-violet-400">{key}</span>
                           <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-1">{count} Tracks</span>
                        </div>
                     </div>
                   ))}
                </div>
                <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/20 text-center">Your repertoire leans heavily into <span className="text-violet-400">{stats.keyDistribution[0]?.[0]}</span></p>
             </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
             <div className="glass p-10 rounded-[40px] border-white/5 h-full flex flex-col">
                <h3 className="text-xl font-black uppercase tracking-widest mb-10">Audience Pulse</h3>
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                   <div className="relative">
                      <div className="h-32 w-32 rounded-full border-4 border-white/5 flex items-center justify-center">
                         <Heart size={48} className="text-rose-500 animate-pulse" fill="currentColor" />
                      </div>
                      <div className="absolute -top-2 -right-2 h-12 w-12 rounded-full glass border border-white/10 flex items-center justify-center text-xs font-black">12</div>
                   </div>
                   <div className="text-center">
                      <h4 className="text-2xl font-black italic tracking-tighter">Request Density</h4>
                      <p className="text-xs text-white/40 mt-1 max-w-[240px]">Insights from live audience interactions and requested setlist changes.</p>
                   </div>
                </div>
                <button className="w-full h-14 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all mt-8">View Request Stream</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
