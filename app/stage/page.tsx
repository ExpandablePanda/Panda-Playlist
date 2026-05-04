"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { 
  ChevronLeft, ChevronRight, Menu, Clock, 
  Play, Pause, RotateCcw, LayoutGrid, List,
  Music2, Zap, AlertCircle, X, Maximize2, Minimize2, CheckCircle2, LogOut
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Song, SetlistEntry, Show } from "@/lib/types";

function StageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showId = searchParams.get("showId");
  
  const [show, setShow] = useState<Show | null>(null);
  const [setlist, setSetlist] = useState<SetlistEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"prompter" | "chart">("prompter");
  
  // SONG TIMER STATE
  const [songSeconds, setSongSeconds] = useState(0);
  const [isTiming, setIsTiming] = useState(false);
  const [isSavingDuration, setIsSavingDuration] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // AUTO-SCROLL STATE
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0); // 0.5 - 10
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showId) {
      fetch(`/api/shows/${showId}/setlist`)
        .then(res => res.json())
        .then(data => {
          setShow(data.show);
          setSetlist(data.entries || []);
        });
    }
  }, [showId]);

  // Handle Song Timer
  useEffect(() => {
    if (isTiming) {
      timerIntervalRef.current = setInterval(() => {
        setSongSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isTiming]);

  const scrollPosRef = useRef(0);

  // Handle Auto-Scroll
  useEffect(() => {
    if (isAutoScrolling && scrollRef.current) {
      // Sync starting position
      scrollPosRef.current = scrollRef.current.scrollTop;
      
      scrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          scrollPosRef.current += (scrollSpeed * 0.5); 
          scrollRef.current.scrollTop = scrollPosRef.current;
        }
      }, 30); 
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
  }, [isAutoScrolling, scrollSpeed]);

  const currentEntry = setlist[currentIndex];
  const song = currentEntry?.song;

  const nextSong = () => {
    if (currentIndex < setlist.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetSongState();
    }
  };

  const prevSong = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetSongState();
    }
  };

  const resetSongState = () => {
    setSongSeconds(0);
    setIsTiming(false);
    setIsAutoScrolling(false);
    setViewMode("prompter");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const restartTimer = () => {
    setSongSeconds(0);
    setIsTiming(true);
  };

  const submitDuration = async () => {
    if (!showId || !currentEntry) return;
    setIsSavingDuration(true);
    
    const updatedEntries = setlist.map((e, idx) => 
      idx === currentIndex ? { ...e, actualDuration: songSeconds, performed: true } : e
    );

    const res = await fetch(`/api/shows/${showId}/setlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: updatedEntries }),
    });

    if (res.ok) {
      setSetlist(updatedEntries);
      setIsTiming(false);
      setTimeout(() => setIsSavingDuration(false), 800);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLyrics = (text: string) => {
    return text.split('\n\n').map((verse, vIdx) => (
      <div key={vIdx} className="mb-12 animate-in fade-in slide-in-from-bottom-10 duration-700" style={{ animationDelay: `${vIdx * 50}ms` }}>
        <pre className="whitespace-pre-wrap font-sans text-5xl font-bold leading-[1.6] text-white tracking-tight">
          {verse.split(' ').map((word, wIdx) => {
            const isChord = word.startsWith('[') && word.endsWith(']');
            return (
              <span key={wIdx} className={isChord ? "text-violet-400 font-black" : ""}>
                {word}{' '}
              </span>
            );
          })}
        </pre>
      </div>
    ));
  };

  if (!song) return (
    <div className="min-h-screen obsidian-bg flex flex-col items-center justify-center p-10 text-center">
       <Music2 size={64} className="text-white/10 mb-6" />
       <h1 className="display-title text-4xl text-white mb-4">No Song Loaded</h1>
       <p className="text-white/40 text-sm max-w-md">Load a show from the Setlist Planner to begin your performance.</p>
       <Link href="/planner" className="mt-8 px-8 h-12 rounded-xl bg-violet-600 text-white font-black uppercase tracking-widest text-xs flex items-center gap-3">Back to Planner</Link>
    </div>
  );

  const isPdf = song.tabs?.startsWith("data:application/pdf") || song.tabs?.toLowerCase().endsWith(".pdf");

  return (
    <div className="h-screen w-screen obsidian-bg overflow-hidden flex flex-col font-sans select-none">
      
      {/* PERFORMANCE HUD (TOP) */}
      <header className="relative z-30 h-24 flex items-center justify-between px-8 glass border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-6">
           <button onClick={() => setIsDrawerOpen(true)} className="h-12 w-12 rounded-xl glass border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all">
             <Menu size={24} />
           </button>
           <Link href={`/planner?showId=${showId}`} className="h-12 px-5 rounded-xl glass border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-rose-400 hover:bg-rose-400/10 hover:border-rose-400/30 transition-all">
              <LogOut size={16} /> Exit
           </Link>
           <div className="w-[1px] h-8 bg-white/10 mx-2" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-1">Current Song</p>
              <h1 className="text-2xl font-black text-white leading-none tracking-tight">{song.title}</h1>
           </div>

           {song.tabs && (
               <div className="flex gap-1 glass p-1 rounded-xl bg-white/[0.05] border border-white/10 ml-4">
                  <button 
                    onClick={() => setViewMode("prompter")} 
                    className={`px-4 h-8 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'prompter' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    <List size={14} /> Prompter
                  </button>
                  <button 
                    onClick={() => setViewMode("chart")} 
                    className={`px-4 h-8 rounded-lg flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'chart' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    <Music2 size={14} /> Chart
                  </button>
               </div>
            )}
        </div>

        {/* TECH BADGES */}
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-center px-8 border-r border-white/10">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Key</span>
              <span className="text-3xl font-black text-violet-400 italic leading-none">{song.defaultKey}</span>
           </div>
           {song.capo > 0 && (
             <div className="flex flex-col items-center px-8 border-r border-white/10">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Capo</span>
                <span className="text-3xl font-black text-emerald-400 leading-none">C{song.capo}</span>
             </div>
           )}
           {song.tempo && (
             <div className="flex flex-col items-center px-8">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">BPM</span>
                <span className="text-3xl font-black text-white leading-none">{song.tempo}</span>
             </div>
           )}
        </div>

        {/* SONG TIMER HUD */}
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 mr-2">
              <button 
                onClick={restartTimer}
                className="h-10 w-10 rounded-xl glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                onClick={submitDuration}
                disabled={songSeconds === 0 || isSavingDuration}
                className={`h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isSavingDuration ? 'bg-emerald-600 text-white' : (currentEntry.actualDuration ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'glass border border-white/10 text-white/40 hover:text-white')}`}
              >
                {isSavingDuration ? <Clock size={14} className="animate-spin" /> : <CheckCircle2 size={14} className={currentEntry.actualDuration ? "text-emerald-400" : ""} />}
                {isSavingDuration ? "Saving..." : currentEntry.actualDuration ? `Logged (${formatTime(currentEntry.actualDuration)})` : "Submit"}
              </button>
           </div>
           
           <div className={`flex flex-col items-end px-8 py-2 rounded-2xl border transition-all ${isTiming ? 'bg-emerald-600/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10'}`}>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Song Timer</span>
              <span className={`text-4xl font-mono font-black leading-none ${isTiming ? 'text-emerald-400 font-bold' : 'text-white/60'}`}>{formatTime(songSeconds)}</span>
           </div>
           <button 
              onClick={() => setIsTiming(!isTiming)}
              className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${isTiming ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-600/20' : 'glass border border-white/10 text-white hover:bg-white/10'}`}
           >
              {isTiming ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
           </button>
        </div>
      </header>

      {/* LYRIC CONTENT (CENTER) */}
      <main className="flex-1 overflow-hidden relative flex">
        
        {/* SIDE CONTROLS (QUICK PAGE) */}
        <div className="w-24 h-full flex flex-col items-center justify-between py-10 glass border-r border-white/5 bg-black/20 z-20">
           <button onClick={prevSong} disabled={currentIndex === 0} className="p-4 rounded-full text-white/20 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0">
             <ChevronLeft size={32} />
           </button>
           <div className="flex flex-col gap-6 items-center">
              <div className="flex flex-col gap-2 items-center mb-2">
                 <button onClick={() => setScrollSpeed(prev => Math.min(prev + 0.5, 10))} className="h-8 w-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black">+</button>
                 <div className="text-[10px] font-black text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded leading-none">{scrollSpeed.toFixed(1)}x</div>
                 <button onClick={() => setScrollSpeed(prev => Math.max(prev - 0.5, 0.5))} className="h-8 w-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black">-</button>
              </div>
              <button onClick={() => setIsAutoScrolling(!isAutoScrolling)} className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${isAutoScrolling ? 'bg-violet-600 text-white shadow-[0_0_30px_rgba(124,58,237,0.4)]' : 'glass border border-white/10 text-white/40 hover:text-white'}`}>
                {isAutoScrolling ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              <div className="text-center">
                 <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2">Song</p>
                 <p className="text-sm font-black text-white/80">{currentIndex + 1}</p>
                 <div className="h-1 w-8 bg-white/10 mx-auto my-2" />
                 <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2">Total</p>
                 <p className="text-sm font-black text-white/40">{setlist.length}</p>
              </div>
           </div>
           <button onClick={nextSong} disabled={currentIndex === setlist.length - 1} className="p-4 rounded-full text-white/20 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0">
             <ChevronRight size={32} />
           </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div 
          ref={scrollRef}
          onScroll={() => {
            if (scrollRef.current && !isAutoScrolling) {
              scrollPosRef.current = scrollRef.current.scrollTop;
            }
          }}
          className="flex-1 overflow-y-auto scrollbar-none scroll-smooth"
        >
          {viewMode === "prompter" ? (
            <div className="px-16 py-24">
               <div className="max-w-5xl mx-auto pb-80">
                  {song.lyrics ? renderLyrics(song.lyrics) : (
                    <div className="flex flex-col items-center justify-center py-40 opacity-20">
                       <Music2 size={120} />
                       <p className="mt-8 text-2xl font-black uppercase tracking-[0.5em]">Instrumental</p>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className={`flex flex-col items-center ${isPdf ? 'h-full w-full p-8' : 'px-16 py-24'}`}>
               {song.tabs ? (
                  isPdf ? (
                    <iframe 
                      src={`${song.tabs}#toolbar=0&navpanes=0&scrollbar=0`} 
                      className="w-full h-full rounded-2xl border border-white/10 shadow-2xl bg-white"
                      title="Sheet Music"
                    />
                  ) : (
                    <div className="max-w-6xl mx-auto pb-80">
                       <img 
                         src={song.tabs} 
                         className="w-full h-auto rounded-[32px] border border-white/10 shadow-2xl shadow-black/60" 
                         alt="Chart Image"
                       />
                    </div>
                  )
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                     <Music2 size={64} className="mb-4" />
                     <p className="text-xs font-black uppercase tracking-widest">No Chart Uploaded</p>
                     <button onClick={() => setViewMode("prompter")} className="mt-6 text-violet-400 text-[10px] font-black uppercase tracking-widest">Back to Prompter</button>
                  </div>
               )}
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION (NEXT SONG PREVIEW) */}
        <div className="absolute bottom-12 right-12 z-20">
           {currentIndex < setlist.length - 1 && (
             <button onClick={nextSong} className="glass p-6 pr-10 rounded-[32px] border border-white/10 flex items-center gap-6 hover:bg-white/10 transition-all group shadow-2xl backdrop-blur-2xl">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/10 border border-white/5 shadow-inner">
                   {setlist[currentIndex+1].song?.artworkUrl ? <img src={setlist[currentIndex+1].song?.artworkUrl} className="w-full h-full object-cover" /> : <Music2 className="text-white/20 m-5" />}
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Up Next</p>
                   <h3 className="text-2xl font-bold text-white group-hover:text-violet-300 transition-colors tracking-tight">{setlist[currentIndex+1].song?.title}</h3>
                </div>
                <ChevronRight size={28} className="text-white/20 group-hover:translate-x-1 transition-all" />
             </button>
           )}
        </div>
      </main>

      {/* SETLIST DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-300">
           <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
           <div className="w-[450px] bg-obsidian-950 border-l border-white/10 p-12 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
              <div className="flex items-center justify-between mb-12">
                 <h2 className="display-title text-4xl text-white not-italic font-black tracking-tight">Setlist</h2>
                 <button onClick={() => setIsDrawerOpen(false)} className="h-12 w-12 rounded-xl glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                 {setlist.map((entry, idx) => (
                   <button 
                    key={entry.id} 
                    onClick={() => { setCurrentIndex(idx); setIsDrawerOpen(false); resetSongState(); }}
                    className={`w-full p-6 rounded-[24px] flex items-center gap-5 transition-all text-left group border ${currentIndex === idx ? 'bg-violet-600 text-white border-violet-500 shadow-2xl shadow-violet-600/40' : 'glass border-white/5 text-white/60 hover:text-white hover:bg-white/5'}`}
                   >
                      <span className={`text-xs font-black w-6 ${currentIndex === idx ? 'text-white' : 'text-white/20'}`}>{String(idx + 1).padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-bold leading-none mb-1.5 truncate text-lg">{entry.song?.title}</h4>
                         <div className="flex items-center gap-2">
                            <p className={`text-[10px] font-black uppercase tracking-widest truncate ${currentIndex === idx ? 'text-white/60' : 'text-white/30'}`}>{entry.song?.artist}</p>
                             {entry.actualDuration ? (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${currentIndex === idx ? 'bg-white/20 text-white' : 'bg-emerald-600/10 text-emerald-400'}`}>
                                   <Clock size={8} /> {formatTime(entry.actualDuration)}
                                </span>
                             ) : entry.performed && (
                                <span className="text-[8px] font-black uppercase text-white/20 italic">Done</span>
                             )}
                         </div>
                      </div>
                      {currentIndex === idx ? <Zap size={18} className="fill-current text-white" /> : <div className="h-2 w-2 rounded-full bg-white/10 group-hover:bg-violet-400 transition-colors" />}
                   </button>
                 ))}
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                 <Link href={`/planner?showId=${showId}`} className="h-16 w-full rounded-2xl glass border border-white/10 flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all">
                    <Minimize2 size={18} /> Exit Stage Mode
                 </Link>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function StagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen obsidian-bg flex items-center justify-center"><Clock className="animate-spin text-white/40" /></div>}>
      <StageContent />
    </Suspense>
  );
}
