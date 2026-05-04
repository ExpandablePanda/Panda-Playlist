"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { 
  Plus, Search, GripVertical, Music2, Clock, 
  Trash2, Settings, Home, Save, CheckCircle2,
  Heart, Calendar, X, MapPin, Link as LinkIcon,
  Zap, Play, Edit3, MessageSquare, AlertCircle, XCircle, CheckCircle, ChevronRight, List, LayoutGrid,
  Layout, Type, FileText,
  DollarSign, Map, Phone, Mail, User, Radio
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Song, SetlistEntry, Show } from "@/lib/types";

function PlannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showId = searchParams.get("showId");
  
  const [shows, setShows] = useState<Show[]>([]);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [library, setLibrary] = useState<Song[]>([]);
  const [setlist, setSetlist] = useState<SetlistEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "art">("art");
  const [filterType, setFilterType] = useState<"all" | "original" | "cover" | "request">("all");
  const [plannerMode, setPlannerMode] = useState<"rehearsal" | "show">("rehearsal");
  const [sortBy, setSortBy] = useState<"title" | "artist" | "key" | "capo" | "duration">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEditShowModalOpen, setIsEditShowModalOpen] = useState(false);
  const [isEditingSongModalOpen, setIsEditingSongModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Partial<Show> | null>(null);
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [activeSongTab, setActiveSongTab] = useState<"general" | "lyrics" | "assets">("general");
  const [isConverting, setIsConverting] = useState(false);

  // DRAG AND DROP STATE
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/songs").then(res => res.json()).then(data => setLibrary(data));
    fetch("/api/shows").then(res => res.json()).then(data => setShows(data.filter((s: Show) => s.status === "upcoming")));
    
    refreshShowData();
  }, [showId]);

  const handleUpdateSong = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSong || !editingSong.id) return;
    
    console.log("Updating song:", editingSong);
    const res = await fetch(`/api/songs/${editingSong.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editingSong, songType: editingSong.songType || "original" })
    });
    
    if (res.ok) {
      const updatedSong = await res.json();
      console.log("Update success:", updatedSong);
      setLibrary(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
      setSetlist(prev => prev.map(entry => entry.songId === updatedSong.id ? { ...entry, song: updatedSong } : entry));
      setIsEditingSongModalOpen(false);
      alert("Song updated successfully!");
    } else {
      console.error("Update failed:", await res.text());
      alert("Failed to save changes. Please try again.");
    }
  };

  const convertPdfToImage = async () => {
    if (!editingSong?.tabs) return;
    setIsConverting(true);
    
    try {
      const loadScript = (src: string) => new Promise((resolve, reject) => {
        if ((window as any).pdfjsLib) return resolve((window as any).pdfjsLib);
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve((window as any).pdfjsLib);
        script.onerror = reject;
        document.head.appendChild(script);
      });

      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const loadingTask = pdfjsLib.getDocument(editingSong.tabs);
      const pdf = await loadingTask.promise;
      const canvases = [];
      let totalHeight = 0;
      let maxWidth = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context!, viewport }).promise;
        canvases.push(canvas);
        totalHeight += canvas.height;
        maxWidth = Math.max(maxWidth, canvas.width);
      }

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = maxWidth;
      finalCanvas.height = totalHeight;
      const finalCtx = finalCanvas.getContext('2d');
      if (finalCtx) {
        let currentY = 0;
        for (const canvas of canvases) {
          finalCtx.drawImage(canvas, 0, currentY);
          currentY += canvas.height;
        }
        const imageUrl = finalCanvas.toDataURL('image/png');
        setEditingSong(prev => prev ? ({ ...prev, tabs: imageUrl }) : null);
      }
    } catch (error) {
      console.error("PDF conversion failed:", error);
      alert("Failed to convert PDF. Ensure it's a valid PDF file.");
    } finally {
      setIsConverting(false);
    }
  };

  const refreshShowData = () => {
    if (showId) {
      fetch(`/api/shows/${showId}/setlist`)
        .then(res => res.json())
        .then(data => {
          if (data.show) {
            setCurrentShow(data.show);
            setEditingShow(data.show);
            setSetlist(data.entries || []);
          }
        });
    } else {
      setCurrentShow(null);
      setSetlist([]);
    }
  };

  const filteredLibrary = useMemo(() => {
    if (filterType === "request") return [];
    let results = library.filter(s => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = s.title.toLowerCase().includes(query) || 
                           s.artist.toLowerCase().includes(query) ||
                           (s.defaultKey && s.defaultKey.toLowerCase().includes(query)) ||
                           (s.capo && s.capo.toString().includes(query));
      const matchesFilter = filterType === "all" || s.songType === filterType;
      return matchesSearch && matchesFilter;
    });

    results.sort((a, b) => {
      let valA: any, valB: any;
      switch (sortBy) {
        case "title": valA = a.title.toLowerCase(); valB = b.title.toLowerCase(); break;
        case "artist": valA = a.artist.toLowerCase(); valB = b.artist.toLowerCase(); break;
        case "key": valA = a.defaultKey || ""; valB = b.defaultKey || ""; break;
        case "capo": valA = a.capo || 0; valB = b.capo || 0; break;
        case "duration": valA = a.durationEstimate || 0; valB = b.durationEstimate || 0; break;
        default: valA = a.title.toLowerCase(); valB = b.title.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return results;
  }, [library, searchQuery, filterType, sortBy, sortOrder]);

  const addToSetlist = (song: Song) => {
    const newEntry: SetlistEntry = {
      id: Math.random().toString(36).substr(2, 9),
      showId: showId || "live",
      songId: song.id,
      position: setlist.length + 1,
      plannedKey: song.defaultKey,
      plannedNotes: "",
      performed: false,
      rehearsalStatus: "worked",
      rehearsalNotes: "",
      song: song
    };
    setSetlist([...setlist, newEntry]);
    setHasUnsavedChanges(true);
  };

  const removeFromSetlist = (id: string) => {
    setSetlist(setlist.filter(e => e.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateEntry = (id: string, updates: Partial<SetlistEntry>) => {
    setSetlist(setlist.map(e => e.id === id ? { ...e, ...updates } : e));
    setHasUnsavedChanges(true);
  };

  // NATIVE DRAG AND DROP HANDLERS
  const onDragStart = (idx: number) => setDraggedIndex(idx);
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === idx) return;
    const items = [...setlist];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(idx, 0, draggedItem);
    setSetlist(items);
    setDraggedIndex(idx);
    setHasUnsavedChanges(true);
  };
  const onDragEnd = () => setDraggedIndex(null);

  const saveSetlistChanges = async () => {
    if (!showId) return;
    setIsSaving(true);
    const res = await fetch(`/api/shows/${showId}/setlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: setlist }),
    });
    if (res.ok) {
      setHasUnsavedChanges(false);
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleSaveShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShow || !showId) return;

    const location = `${editingShow.city || ""}, ${editingShow.state || ""}`;
    
    const res = await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editingShow, location }),
    });

    if (res.ok) {
      refreshShowData();
      setIsEditShowModalOpen(false);
    }
  };

  const totalTime = Math.round(setlist.reduce((acc, curr) => acc + (curr.song?.durationEstimate || 0), 0));

  return (
    <div className="min-h-screen obsidian-bg p-6 lg:p-10 flex flex-col font-sans selection:bg-violet-500/30">
      <div className="orb orb-purple -top-40 -left-40 w-[800px] h-[800px] opacity-10" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-12 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="tap-target glass h-10 w-10 hover:bg-white/10 text-white/60 hover:text-white transition-all flex items-center justify-center border border-white/10">
             <Home size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full glass flex items-center justify-center border border-white/10">
              <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_white]" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Panda Playlist</span>
          </div>
        </div>
        
        <div className="flex p-1 rounded-xl glass bg-white/[0.05] border border-white/10">
           <button onClick={() => setPlannerMode("rehearsal")} className={`px-6 h-9 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${plannerMode === 'rehearsal' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-white/40 hover:text-white'}`}><Edit3 size={14} /> Rehearsal Lab</button>
           <button onClick={() => setPlannerMode("show")} className={`px-6 h-9 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${plannerMode === 'show' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-white/40 hover:text-white'}`}><Play size={14} /> Show Mode</button>
        </div>

        <div className="flex items-center gap-4">
          {showId && (
            <Link 
              href={`/stage?showId=${showId}`} 
              className="h-10 px-6 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-500 transition-all shadow-[0_0_25px_rgba(225,29,72,0.4)] border border-rose-500/50 animate-pulse"
            >
              <Radio size={14} /> Go Live
            </Link>
          )}
          {!showId && (
            <button onClick={() => setIsLinkModalOpen(true)} className="h-10 px-6 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]"><LinkIcon size={14} /> Link Tour Date</button>
          )}
          {showId && (
            <div className="flex items-center gap-4">
               <button onClick={() => setIsLinkModalOpen(true)} className="h-10 px-4 rounded-xl glass border border-white/10 text-white/60 text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">Switch Show</button>
               <button onClick={saveSetlistChanges} className={`h-10 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${hasUnsavedChanges ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'bg-white/10 text-white/80 border border-white/5'}`}>
                 {isSaving ? <Clock size={14} className="animate-spin" /> : hasUnsavedChanges ? <Save size={14} /> : <CheckCircle2 size={14} className="text-emerald-400" />}
                 {isSaving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Saved"}
               </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full pb-40">
        
        {/* LEFT COLUMN: SETLIST */}
        <section className="lg:col-span-8 flex flex-col">
          <div className="flex items-end justify-between mb-8 px-2">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                 <h1 className="display-title text-6xl text-white mb-2 leading-none tracking-tighter not-italic font-black">
                   {currentShow ? `Setlist: ${currentShow.venue}` : "Current Setlist"}
                 </h1>
                 {currentShow && (
                   <button onClick={() => setIsEditShowModalOpen(true)} className="mt-3 h-8 w-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"><Edit3 size={14} /></button>
                 )}
              </div>
              {currentShow ? (
                <div className="flex flex-col gap-4 mt-4">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <MapPin size={12} className="text-white/40" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{currentShow.city}, {currentShow.state}</span>
                      </div>
                      <div className="w-[1px] h-3 bg-white/10" />
                      <div className="flex items-center gap-2">
                         <DollarSign size={12} className="text-emerald-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-bold">{currentShow.rate?.toLocaleString() || "0"} Show Rate</span>
                      </div>
                      <div className="w-[1px] h-3 bg-white/10" />
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${plannerMode === 'rehearsal' ? 'bg-violet-600/10 border-violet-500/50 text-violet-400' : 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400'}`}>
                         {plannerMode} active
                      </div>
                      <div className="w-[1px] h-3 bg-white/10" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">{setlist.length} Tracks</p>
                   </div>
                   
                   <div className="flex items-center gap-8 py-3 px-5 rounded-2xl glass bg-white/[0.02] border border-white/5 w-fit">
                      <div className="flex items-center gap-3">
                         <User size={14} className="text-violet-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{currentShow.contactName || "No Contact"}</span>
                      </div>
                      {currentShow.contactPhone && (
                        <div className="flex items-center gap-3">
                           <Phone size={12} className="text-white/40" />
                           <span className="text-[10px] font-bold text-white/60 tracking-wider">{currentShow.contactPhone}</span>
                        </div>
                      )}
                      {currentShow.contactEmail && (
                        <div className="flex items-center gap-3">
                           <Mail size={12} className="text-white/40" />
                           <span className="text-[10px] font-bold text-white/60 tracking-wider lowercase">{currentShow.contactEmail}</span>
                        </div>
                      )}
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 mt-4">
                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${plannerMode === 'rehearsal' ? 'bg-violet-600/10 border-violet-500/50 text-violet-400' : 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400'}`}>
                      {plannerMode} active
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">{setlist.length} Songs</p>
                   <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">{totalTime} Minutes</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {setlist.map((entry, idx) => (
              <SetlistRow 
                key={entry.id}
                index={String(idx + 1).padStart(2, '0')} 
                entry={entry}
                mode={plannerMode}
                isDragged={draggedIndex === idx}
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                onRemove={() => removeFromSetlist(entry.id)}
                onUpdate={(updates) => updateEntry(entry.id, updates)}
                onEditSong={(song: Song) => {
                  setEditingSong(song);
                  setIsEditingSongModalOpen(true);
                  setActiveSongTab("general");
                }}
              />
            ))}
            {setlist.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/10 rounded-card bg-white/[0.02]">
                <Music2 size={48} className="mb-4 text-white/20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Ready for soundcheck</p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: LIBRARY */}
        <aside className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="display-title text-3xl text-white not-italic font-black tracking-tight">Song Library</h2>
            <div className="flex gap-1 glass p-1 rounded-xl bg-white/[0.05] border border-white/10">
              <button onClick={() => setViewMode("list")} className={`h-8 w-9 flex items-center justify-center rounded-lg transition-all ${viewMode === "list" ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white"}`}><List size={16} /></button>
              <button onClick={() => setViewMode("art")} className={`h-8 w-9 flex items-center justify-center rounded-lg transition-all ${viewMode === "art" ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"}`}><LayoutGrid size={16} /></button>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
             {["all", "original", "cover", "request"].map((tab) => (
               <button key={tab} onClick={() => setFilterType(tab as any)} className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filterType === tab ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/20' : 'glass border-white/10 text-white/60 hover:text-white'}`}>
                 {tab === 'request' && <Heart size={10} className="inline mr-1 fill-current" />} {tab}
               </button>
             ))}
          </div>

          <div className="relative mb-6 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60" size={16} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search repertoire..." className="w-full h-12 pl-14 pr-6 rounded-2xl glass bg-white/[0.05] border-white/10 text-sm text-white outline-none focus:border-violet-500/30 transition-all placeholder:text-white/40" />
          </div>

          <div className="flex items-center gap-2 mb-8 px-1">
             <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mr-2">Sort</span>
             <div className="flex flex-wrap gap-1.5 flex-1">
                {[
                  { id: 'title', label: 'Title' },
                  { id: 'artist', label: 'Artist' },
                  { id: 'key', label: 'Key' },
                  { id: 'capo', label: 'Capo' },
                  { id: 'duration', label: 'Time' }
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => {
                      if (sortBy === s.id) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else { setSortBy(s.id as any); setSortOrder("asc"); }
                    }}
                    className={`px-2.5 h-6 rounded-lg text-[7px] font-black uppercase tracking-[0.15em] border transition-all flex items-center gap-1.5 ${sortBy === s.id ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {s.label}
                    {sortBy === s.id && (
                       <div className="flex flex-col scale-75 opacity-60">
                          <div className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] mb-0.5 ${sortOrder === 'asc' ? 'border-b-white' : 'border-b-white/20'}`} />
                          <div className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] ${sortOrder === 'desc' ? 'border-t-white' : 'border-t-white/20'}`} />
                       </div>
                    )}
                  </button>
                ))}
             </div>
          </div>

          <div className={`flex-1 overflow-y-auto pr-2 scrollbar-thin ${viewMode === "art" ? "grid grid-cols-2 gap-4 auto-rows-min" : "space-y-3"}`}>
            {filterType === "request" ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center animate-in fade-in bg-white/[0.02] rounded-[32px] border border-white/10"><Heart size={32} className="text-rose-500 mb-4 fill-current" /><p className="text-[10px] font-black uppercase tracking-widest text-white">Live Request Stream</p></div>
            ) : filteredLibrary.map(song => (
              viewMode === "list" ? (
                <LibraryItem key={song.id} song={song} onClick={() => addToSetlist(song)} />
              ) : (
                <LibraryArtCard key={song.id} song={song} onClick={() => addToSetlist(song)} />
              )
            ))}
          </div>

          <Link href="/library" className="mt-8 h-12 w-full rounded-xl glass border-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white hover:bg-white/10 transition-all"><Settings size={14} /> Manage Master Catalog</Link>
        </aside>
      </div>

      {/* QUICK EDIT SONG MODAL */}
      {isEditingSongModalOpen && editingSong && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsEditingSongModalOpen(false)} />
          <div className="relative w-full max-w-6xl h-full glass rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
               <div className="flex items-center gap-6">
                  <div className="h-12 w-12 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400"><Edit3 size={24} /></div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white">Quick Edit Song</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Modifying Repertoire Metadata</p>
                  </div>
               </div>
               <button onClick={() => setIsEditingSongModalOpen(false)} className="h-12 w-12 rounded-2xl glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"><X size={24} /></button>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col">
               <nav className="px-8 pt-6 flex gap-8 border-b border-white/5">
                  {[
                    { id: "general", label: "General Info", icon: <List size={14} /> },
                    { id: "lyrics", label: "Lyrics / Prompter", icon: <Type size={14} /> },
                    { id: "assets", label: "Assets / Charts", icon: <FileText size={14} /> }
                  ].map(tab => (
                    <button 
                      key={tab.id} 
                      onClick={() => setActiveSongTab(tab.id as any)}
                      className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all border-b-2 ${activeSongTab === tab.id ? "border-violet-500 text-white" : "border-transparent text-white/40 hover:text-white/60"}`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
               </nav>

               <div className="flex-1 overflow-y-auto p-10 scrollbar-thin">
                  <form id="quick-edit-form" onSubmit={handleUpdateSong}>
                    {activeSongTab === "general" && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-12 gap-8">
                          <div className="col-span-4">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Artwork URL</label>
                             <div className="aspect-square w-full rounded-3xl overflow-hidden glass border-white/10 relative bg-black/20 shadow-xl">
                                {editingSong.artworkUrl ? (
                                  <img src={editingSong.artworkUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10"><Music2 size={64} /></div>
                                )}
                             </div>
                             <input value={editingSong.artworkUrl || ""} onChange={e => setEditingSong({...editingSong, artworkUrl: e.target.value})} placeholder="Paste URL here..." className="w-full h-12 px-4 rounded-xl glass bg-white/[0.05] text-[10px] mt-4 border-white/10 text-white outline-none focus:border-white/30" />
                          </div>
                          <div className="col-span-8 space-y-6">
                             <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Song Title</label><input required value={editingSong.title || ""} onChange={e => setEditingSong({...editingSong, title: e.target.value})} className="w-full h-14 px-6 rounded-xl glass bg-white/[0.05] border-white/10 text-xl font-bold text-white outline-none focus:border-violet-500/50" /></div>
                             <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Artist / Composer</label><input value={editingSong.artist || ""} onChange={e => setEditingSong({...editingSong, artist: e.target.value})} className="w-full h-14 px-6 rounded-xl glass bg-white/[0.05] border-white/10 text-xl font-bold text-white outline-none focus:border-violet-500/50" /></div>
                             <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Album</label><input value={editingSong.album || ""} onChange={e => setEditingSong({...editingSong, album: e.target.value})} className="w-full h-14 px-6 rounded-xl glass bg-white/[0.05] border-white/10 text-xl font-bold text-white outline-none focus:border-violet-500/50" /></div>
                             <div className="grid grid-cols-5 gap-3">
                                <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Key</label><input value={editingSong.defaultKey || ""} onChange={e => setEditingSong({...editingSong, defaultKey: e.target.value})} className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-xs text-white font-black" /></div>
                                <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">BPM</label><input value={editingSong.tempo || ""} onChange={e => setEditingSong({...editingSong, tempo: e.target.value})} className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-xs text-white font-black" /></div>
                                <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Time</label><input type="number" value={editingSong.durationEstimate || 4} onChange={e => setEditingSong({...editingSong, durationEstimate: parseInt(e.target.value) || 0})} className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-xs text-white font-black" /></div>
                                <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Tuning</label><input value={editingSong.tuning || ""} onChange={e => setEditingSong({...editingSong, tuning: e.target.value})} className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-[9px] text-white font-black" /></div>
                                <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Capo</label><input type="number" value={editingSong.capo || 0} onChange={e => setEditingSong({...editingSong, capo: parseInt(e.target.value) || 0})} className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-xs text-white font-black" /></div>
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSongTab === "lyrics" && (
                      <div className="h-full flex flex-col animate-in fade-in duration-500">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-4 block font-bold">Performance Lyrics</label>
                        <textarea value={editingSong.lyrics || ""} onChange={e => setEditingSong({...editingSong, lyrics: e.target.value})} placeholder="Paste lyrics here..." className="w-full min-h-[400px] p-10 rounded-[32px] glass bg-white/[0.05] border-white/10 text-xl leading-relaxed text-white outline-none focus:border-violet-500/30 font-serif resize-none scrollbar-thin" />
                      </div>
                    )}

                    {activeSongTab === "assets" && (
                      <div className="grid grid-cols-12 gap-8 animate-in fade-in duration-500 h-full">
                        <div className="col-span-5 space-y-6">
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Chart Asset (Image or PDF)</label>
                              <div className="flex flex-col gap-4">
                                 <div onClick={() => pdfInputRef.current?.click()} className="w-full h-24 rounded-2xl glass border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center gap-4 hover:border-violet-500/50 cursor-pointer group transition-all">
                                    <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all"><Plus size={20} /></div>
                                    <div className="text-left"><p className="text-[10px] font-black uppercase tracking-widest text-white">Upload New Chart</p><p className="text-[8px] font-bold text-white/40">Select local file</p></div>
                                 </div>
                                 <input type="file" ref={pdfInputRef} onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => setEditingSong({...editingSong, tabs: ev.target?.result as string});
                                      reader.readAsDataURL(file);
                                    }
                                 }} accept="application/pdf,image/*" className="hidden" />
                                 <input value={editingSong.tabs || ""} onChange={e => setEditingSong({...editingSong, tabs: e.target.value})} placeholder="Or paste URL..." className="w-full h-12 px-5 rounded-xl glass bg-white/[0.05] border-white/10 text-[10px] text-white/80 outline-none focus:border-white/30" />
                              </div>
                           </div>
                           <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Quick Chords / Notes</label><textarea value={editingSong.chords || ""} onChange={e => setEditingSong({...editingSong, chords: e.target.value})} placeholder="G | C | D..." className="w-full h-32 p-5 rounded-xl glass bg-white/[0.05] border-white/10 text-xs font-mono text-violet-400 outline-none resize-none" /></div>
                        </div>
                        <div className="col-span-7 flex flex-col h-full">
                           <div className="flex items-center justify-between mb-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 block font-bold">Chart Preview</label>
                              {(editingSong?.tabs?.startsWith("data:application/pdf") || editingSong?.tabs?.toLowerCase().endsWith(".pdf")) && (
                                <button type="button" onClick={convertPdfToImage} disabled={isConverting} className="px-3 h-7 rounded-lg bg-violet-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-600/20">
                                  {isConverting ? <Clock size={10} className="animate-spin" /> : <Zap size={10} fill="currentColor" />}
                                  {isConverting ? "Converting..." : "Convert to Scrollable Image"}
                                </button>
                              )}
                           </div>
                           <div className="flex-1 min-h-[440px] rounded-[32px] glass border-white/10 bg-white/[0.02] flex items-center justify-center overflow-hidden shadow-2xl relative">
                              {editingSong.tabs ? (
                                 (editingSong.tabs.startsWith("data:application/pdf") || editingSong.tabs.toLowerCase().endsWith(".pdf")) ? (
                                    <iframe src={editingSong.tabs} className="w-full h-full border-none" />
                                 ) : (
                                    <img src={editingSong.tabs} className="w-full h-full object-contain p-4" />
                                 )
                              ) : (
                                 <div className="text-center opacity-20"><FileText size={48} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest text-white">Preview inactive</p></div>
                              )}
                           </div>
                        </div>
                      </div>
                    )}
                  </form>
               </div>
            </div>

            <footer className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
               <button onClick={() => setIsEditingSongModalOpen(false)} className="px-8 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancel</button>
               <button 
                 onClick={() => handleUpdateSong()} 
                 type="button" 
                 className="px-10 h-14 rounded-2xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all shadow-[0_0_30px_rgba(124,58,237,0.3)] flex items-center gap-3"
               >
                  <Save size={18} /> Save Changes
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* LINK SHOW MODAL */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
           <div className="planner-card !p-10 w-full max-w-xl relative bg-obsidian-950/90 border-white/10 shadow-2xl">
              <button onClick={() => setIsLinkModalOpen(false)} className="absolute top-8 right-8 text-white/60 hover:text-white transition-all"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/10">
                <div className="h-12 w-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400"><Calendar size={24} /></div>
                <h2 className="display-title text-3xl text-white not-italic font-black">Link Tour Date</h2>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                 {shows.map((show) => (
                   <button key={show.id} onClick={() => { router.push(`/planner?showId=${show.id}`); setIsLinkModalOpen(false); }} className={`w-full p-6 rounded-2xl glass border border-white/5 flex items-center justify-between hover:border-violet-500/50 hover:bg-white/5 transition-all text-left group ${showId === show.id ? 'border-violet-500 bg-violet-500/5' : ''}`}>
                     <div className="flex items-center gap-5">
                        <div className="text-center min-w-[40px]"><p className="text-[9px] font-black uppercase text-white/80">{new Date(show.date).toLocaleDateString(undefined, { month: 'short' })}</p><p className="text-xl font-black text-white leading-none">{new Date(show.date).getDate()}</p></div>
                        <div className="w-[1px] h-8 bg-white/10" />
                        <div><h4 className="font-bold text-white group-hover:text-violet-400 transition-colors leading-none mb-1.5 not-italic">{show.venue}</h4><p className="text-[10px] font-black uppercase tracking-widest text-white/60">{show.city}, {show.state}</p></div>
                     </div>
                     <ChevronRight size={18} className="text-white/20 group-hover:text-violet-400 transition-all" />
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* EDIT SHOW MODAL */}
      {isEditShowModalOpen && editingShow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
           <form onSubmit={handleSaveShow} className="planner-card !p-10 w-full max-w-2xl relative bg-obsidian-950/90 border-white/10 shadow-2xl">
              <button type="button" onClick={() => setIsEditShowModalOpen(false)} className="absolute top-8 right-8 text-white/60 hover:text-white transition-all"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/10">
                <div className="h-12 w-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400"><Calendar size={24} /></div>
                <h2 className="display-title text-3xl text-white not-italic font-black">Edit Tour Date</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Venue Name</label>
                    <input required value={editingShow.venue || ""} onChange={e => setEditingShow({...editingShow, venue: e.target.value})} className="w-full h-14 px-6 rounded-xl glass bg-white/[0.08] border-white/20 text-lg font-bold text-white outline-none focus:border-violet-500/50 transition-all" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Show Date</label>
                    <input required type="date" value={editingShow.date || ""} onChange={e => setEditingShow({...editingShow, date: e.target.value})} className="w-full h-12 px-5 rounded-xl glass bg-white/[0.08] border-white/20 text-sm text-white outline-none" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Agreed Rate ($)</label>
                    <div className="relative group">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                       <input type="number" value={editingShow.rate || 0} onChange={e => setEditingShow({...editingShow, rate: parseInt(e.target.value) || 0})} className="w-full h-12 pl-12 pr-4 rounded-xl glass bg-white/[0.08] border-white/20 text-sm font-black text-emerald-400 outline-none" />
                    </div>
                 </div>
                 <div className="col-span-2 grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Contact Name</label>
                       <input value={editingShow.contactName || ""} onChange={e => setEditingShow({...editingShow, contactName: e.target.value})} className="w-full h-12 px-4 rounded-xl glass bg-white/[0.08] border-white/20 text-xs text-white outline-none" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Phone</label>
                       <input value={editingShow.contactPhone || ""} onChange={e => setEditingShow({...editingShow, contactPhone: e.target.value})} className="w-full h-12 px-4 rounded-xl glass bg-white/[0.08] border-white/20 text-xs text-white outline-none" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Email</label>
                       <input value={editingShow.contactEmail || ""} onChange={e => setEditingShow({...editingShow, contactEmail: e.target.value})} className="w-full h-12 px-4 rounded-xl glass bg-white/[0.08] border-white/20 text-xs text-white outline-none" />
                    </div>
                 </div>
                 <div className="col-span-2 grid grid-cols-2 gap-4">
                    <input placeholder="City" value={editingShow.city || ""} onChange={e => setEditingShow({...editingShow, city: e.target.value})} className="w-full h-12 px-5 rounded-xl glass bg-white/[0.08] border-white/20 text-sm text-white" />
                    <input placeholder="State" value={editingShow.state || ""} onChange={e => setEditingShow({...editingShow, state: e.target.value})} className="w-full h-12 px-5 rounded-xl glass bg-white/[0.08] border-white/20 text-sm text-white" />
                 </div>
              </div>
              <div className="mt-12 flex gap-4">
                 <button type="submit" className="flex-1 h-14 rounded-2xl bg-violet-600 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-violet-500 transition-all shadow-[0_0_40px_rgba(124,58,237,0.4)]"><Save size={18} /> Save Changes</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen obsidian-bg flex items-center justify-center"><Clock className="animate-spin text-white/40" /></div>}>
      <PlannerContent />
    </Suspense>
  );
}

function SetlistRow({ index, entry, mode, isDragged, onDragStart, onDragOver, onDragEnd, onRemove, onUpdate, onEditSong }: any) {
  const song = entry.song;
  const isCut = entry.rehearsalStatus === 'scrap';
  
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`flex flex-col gap-2 group animate-in slide-in-from-left duration-300 ${isDragged ? 'opacity-20' : 'opacity-100'}`} 
      style={{ animationDelay: `${parseInt(index) * 50}ms` }}
    >
      <div className={`planner-card !p-5 grid grid-cols-12 items-center cursor-move border-l-4 transition-all bg-white/[0.03] border-white/10 ${mode === 'rehearsal' ? 'hover:border-l-violet-500' : 'hover:border-l-emerald-500'} ${isCut ? 'border-rose-500/50 bg-rose-500/5' : ''}`}>
        <div className="col-span-1 flex items-center gap-3">
          <GripVertical size={14} className="text-white/20 group-hover:text-white/60" />
          <span className="text-[10px] font-black text-white/80">{index}</span>
        </div>
        <div className="col-span-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/10 border border-white/5 flex-shrink-0 relative">
             {song?.artworkUrl ? <img src={song.artworkUrl} className="w-full h-full object-cover" /> : <Music2 size={16} className="text-white/40 m-3" />}
             {isCut && mode === "show" && (
                <div className="absolute inset-0 bg-rose-600/60 flex items-center justify-center">
                   <XCircle size={20} className="text-white drop-shadow-lg" />
                </div>
             )}
          </div>
          <div className="min-w-0">
            <h3 className={`text-xl font-bold text-white truncate leading-none mb-1 transition-colors ${isCut ? 'text-rose-400' : 'group-hover:text-violet-400'}`}>{song?.title}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{song?.artist}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onEditSong(song); }} className="ml-3 p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100" title="Quick Edit Song">
             <Settings size={16} />
          </button>
          {isCut && mode === "show" && (
            <div className="ml-2 px-2 py-0.5 rounded bg-rose-600/20 border border-rose-500/50 flex items-center gap-1.5 animate-pulse">
               <AlertCircle size={10} className="text-rose-500" />
               <span className="text-[7px] font-black uppercase text-rose-500 tracking-widest">Flagged Cut</span>
            </div>
          )}
        </div>
        
        <div className="col-span-3 flex items-center justify-center gap-4 px-4">
           <div className="flex flex-col items-center min-w-[50px]">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5">Time</span>
              <span className="text-[11px] font-bold text-white/80 tracking-tighter">{song?.durationEstimate}m</span>
           </div>
           {entry.actualDuration && (
             <>
               <div className="w-[1px] h-6 bg-white/5" />
               <div className="flex flex-col items-center min-w-[50px]">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400/40 mb-0.5">Live</span>
                  <span className="text-[11px] font-black text-emerald-400 tracking-tighter">
                    {Math.floor(entry.actualDuration / 60)}:{(entry.actualDuration % 60).toString().padStart(2, '0')}
                  </span>
               </div>
             </>
           )}
           <div className="w-[1px] h-6 bg-white/5" />
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5">Key</span>
              <span className="text-[11px] font-black text-violet-400 italic">{song?.defaultKey}</span>
           </div>
           {song?.capo && song.capo > 0 && (
             <>
               <div className="w-[1px] h-6 bg-white/5" />
               <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5">Capo</span>
                  <span className="text-[11px] font-black text-emerald-400">C{song.capo}</span>
               </div>
             </>
           )}
        </div>

        <div className="col-span-3 flex items-center justify-end gap-2 px-4">
           {mode === "rehearsal" ? (
             <div className="flex gap-1.5 w-full">
                <button onClick={(e) => { e.stopPropagation(); onUpdate({ rehearsalStatus: 'worked' }); }} className={`flex-1 h-8 rounded-lg flex items-center justify-center gap-1 text-[7px] font-black uppercase tracking-widest border transition-all ${entry.rehearsalStatus === 'worked' ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20' : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white'}`}><CheckCircle size={10} /> Ok</button>
                <button onClick={(e) => { e.stopPropagation(); onUpdate({ rehearsalStatus: 'needs-work' }); }} className={`flex-1 h-8 rounded-lg flex items-center justify-center gap-1 text-[7px] font-black uppercase tracking-widest border transition-all ${entry.rehearsalStatus === 'needs-work' ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/20' : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white'}`}><Zap size={10} /> Fix</button>
                <button onClick={(e) => { e.stopPropagation(); onUpdate({ rehearsalStatus: 'scrap' }); }} className={`flex-1 h-8 rounded-lg flex items-center justify-center gap-1 text-[7px] font-black uppercase tracking-widest border transition-all ${entry.rehearsalStatus === 'scrap' ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20' : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white'}`}><XCircle size={10} /> Cut</button>
             </div>
           ) : (
             <div className="flex items-center gap-3">
                {song?.tempo && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{song.tempo} BPM</span>}
                <ChevronRight size={14} className="text-white/10 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
             </div>
           )}
        </div>

        <div className="col-span-1 flex justify-end items-center gap-4">
          <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-rose-400 transition-all"><Trash2 size={14} /></button>
        </div>
      </div>
      
      {mode === "rehearsal" && (
        <div className="px-14 flex items-start gap-3">
           <MessageSquare size={14} className="text-white/20 mt-3" />
           <textarea value={entry.rehearsalNotes || ""} onChange={(e) => onUpdate({ rehearsalNotes: e.target.value })} placeholder="Arrangement notes, fixes, or feedback..." className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-xs text-white/80 outline-none focus:border-violet-500/30 transition-all min-h-[60px] italic placeholder:text-white/20" />
        </div>
      )}
    </div>
  );
}

function LibraryItem({ song, onClick }: { song: Song, onClick: () => void }) {
  return (
    <button onClick={onClick} className="planner-card !p-4 w-full flex items-center justify-between group hover:!bg-white/10 active:scale-[0.98] transition-all bg-white/[0.03] border-white/10">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl overflow-hidden glass border border-white/5 flex-shrink-0">
           {song.artworkUrl ? <img src={song.artworkUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <Music2 size={16} className="text-white/40" />}
        </div>
        <div className="text-left">
          <h4 className="font-bold text-white text-base leading-none mb-1">{song.title}</h4>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{song.artist}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
               <span className="text-[7px] font-black uppercase tracking-widest text-white/20">Time</span>
               <span className="text-[10px] font-bold text-white/60">{song.durationEstimate}m</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[7px] font-black uppercase tracking-widest text-white/20">Key</span>
               <span className="text-[10px] font-black text-violet-400 italic">{song.defaultKey}</span>
            </div>
         </div>
         <Plus size={14} className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
      </div>
    </button>
  );
}

function LibraryArtCard({ song, onClick }: { song: Song, onClick: () => void }) {
  return (
    <button onClick={onClick} className="planner-card !p-0 group hover:scale-[1.02] active:scale-95 transition-all text-left flex flex-col relative overflow-hidden h-[240px] border-white/10 bg-white/[0.03] shadow-lg">
      <div className="absolute top-2 left-2 z-20"><div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border backdrop-blur-md ${song.songType === 'original' ? 'bg-violet-600/80 text-white border-violet-500' : 'bg-amber-600/80 text-white border-amber-500'}`}>{song.songType}</div></div>
      <div className="relative flex-1 overflow-hidden">
         {song.artworkUrl ? <img src={song.artworkUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Music2 size={24} className="text-white/10" /></div>}
         <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/20 to-transparent opacity-80" />
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-[8px] font-black uppercase tracking-widest text-white/40">
             <div className="flex flex-col">
                {song.tempo && <span>{song.tempo} BPM</span>}
                <span>{song.durationEstimate} MIN</span>
             </div>
             <div className="glass px-2 py-0.5 rounded text-[9px] font-black text-violet-400 italic bg-black/20">{song.defaultKey}</div>
          </div>
      </div>
      <div className="p-4 bg-white/[0.04]"><h4 className="font-bold text-white text-sm truncate group-hover:text-violet-400 transition-colors leading-none mb-1">{song.title}</h4><p className="text-[9px] font-black uppercase tracking-widest text-white/40 truncate">{song.artist}</p></div>
    </button>
  );
}
