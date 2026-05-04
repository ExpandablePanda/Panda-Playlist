"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Plus, Search, Music2, Trash2, Save, ArrowLeft, 
  Image as ImageIcon, Clock, Zap, Star, Filter, 
  FileText, Layout, Type, AlertCircle, HelpCircle, Upload, Clipboard, Disc, File, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Song } from "@/lib/types";
import { clientDb } from "@/lib/clientDb";

export default function CatalogPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "lyrics" | "assets">("general");
  const [imageError, setImageError] = useState(false);
  const [artworkSource, setArtworkSource] = useState<"manual" | "autoloaded" | null>(null);
  const [sortBy, setSortBy] = useState<"title" | "artist" | "key" | "capo" | "duration">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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

  const fetchData = () => {
    setSongs(clientDb.getSongs());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uniqueArtists = useMemo(() => {
    return Array.from(new Set(songs.map(s => s.artist).filter(Boolean))).sort();
  }, [songs]);

  const uniqueAlbums = useMemo(() => {
    return Array.from(new Set(songs.map(s => s.album).filter(Boolean))).sort();
  }, [songs]);

  // SMART ARTWORK AUTOLOAD LOGIC
  useEffect(() => {
    if (editingSong && editingSong.album && !editingSong.artworkUrl && !editingSong.id) {
       const existingMatch = songs.find(s => s.album === editingSong.album && s.artworkUrl);
       if (existingMatch) {
          setEditingSong(prev => ({ ...prev, artworkUrl: existingMatch.artworkUrl }));
          setArtworkSource("autoloaded");
          setImageError(false);
       }
    }
  }, [editingSong?.album, songs]);

  useEffect(() => {
    if (editingSong?.album && !editingSong.artworkUrl && artworkSource !== "manual") {
      const match = songs.find(s => 
        s.album?.toLowerCase().trim() === editingSong.album?.toLowerCase().trim() && 
        s.artworkUrl
      );
      if (match) {
        setEditingSong(prev => prev ? { ...prev, artworkUrl: match.artworkUrl } : null);
        setArtworkSource("autoloaded");
      }
    }
  }, [editingSong?.album, songs, artworkSource]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!editingSong) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setEditingSong(prev => ({ ...prev, artworkUrl: event.target?.result as string }));
              setArtworkSource("manual");
              setImageError(false);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [editingSong]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingSong(prev => ({ ...prev, artworkUrl: event.target?.result as string }));
        setArtworkSource("manual");
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChartUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingSong(prev => ({ ...prev, tabs: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredSongs = useMemo(() => {
    let results = songs.filter(s => {
      const query = searchQuery.toLowerCase();
      return s.title.toLowerCase().includes(query) || 
             s.artist.toLowerCase().includes(query) ||
             (s.defaultKey && s.defaultKey.toLowerCase().includes(query)) ||
             (s.capo && s.capo.toString().includes(query));
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
  }, [songs, searchQuery, sortBy, sortOrder]);

  const originals = filteredSongs.filter(s => s.songType === "original");
  const covers = filteredSongs.filter(s => s.songType === "cover");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    clientDb.saveSong({ ...editingSong, songType: editingSong.songType || "original" } as Song);
    fetchData();
    setEditingSong(null);
    setArtworkSource(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this song?")) return;
    clientDb.deleteSong(id);
    setSongs(songs.filter(s => s.id !== id));
    if (editingSong?.id === id) setEditingSong(null);
  };

  const isPdf = editingSong?.tabs?.startsWith("data:application/pdf") || editingSong?.tabs?.endsWith(".pdf");

  return (
    <div className="min-h-screen obsidian-bg p-8 lg:p-12 font-sans flex flex-col selection:bg-violet-500/30">
      <div className="orb orb-purple -top-40 -left-40 w-[800px] h-[800px] opacity-10" />
      
      <header className="relative z-10 flex items-center justify-between mb-12 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="tap-target glass h-12 w-12 hover:bg-white/10 flex items-center justify-center border border-white/10"><ArrowLeft size={20} className="text-white/80" /></Link>
          <div>
            <h1 className="display-title text-5xl text-white leading-none not-italic font-black tracking-tighter">Master Catalog</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mt-3">Repertoire Control Studio</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingSong({ title: "", artist: "", album: "", songType: "original", lyrics: "", tabs: "", chords: "", defaultKey: "", tempo: "", capo: 0, tuning: "E Standard", durationEstimate: 4, artworkUrl: "" }); setActiveTab("general"); setImageError(false); setArtworkSource(null); }}
          className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          <Plus size={16} strokeWidth={3} /> Add Repertoire Item
        </button>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 pb-40 min-h-0">
        
        {/* LEFT: SPLIT SONG LIST */}
        <aside className="lg:col-span-4 flex flex-col min-h-0">
          <div className="relative mb-6 group px-2">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-white/60" size={18} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Catalog..." className="w-full h-14 pl-14 pr-6 rounded-2xl glass bg-white/[0.05] border-white/10 text-sm text-white outline-none focus:border-violet-500/30 transition-all placeholder:text-white/40" />
          </div>

          <div className="flex items-center gap-2 mb-8 px-3">
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
          <div className="flex-1 overflow-y-auto space-y-10 pr-2 scrollbar-thin">
            <div>
              <div className="flex items-center gap-3 mb-4 px-4">
                 <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 not-italic font-bold">Originals ({originals.length})</h3>
              </div>
              <div className="space-y-3 px-2">{originals.map(song => <CatalogItem key={song.id} song={song} isActive={editingSong?.id === song.id} onEdit={() => { setEditingSong(song); setActiveTab("general"); setImageError(false); setArtworkSource(null); }} onDelete={() => handleDelete(song.id)} />)}</div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4 px-4">
                 <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 not-italic font-bold">Covers ({covers.length})</h3>
              </div>
              <div className="space-y-3 px-2">{covers.map(song => <CatalogItem key={song.id} song={song} isActive={editingSong?.id === song.id} onEdit={() => { setEditingSong(song); setActiveTab("general"); setImageError(false); setArtworkSource(null); }} onDelete={() => handleDelete(song.id)} />)}</div>
            </div>
          </div>
        </aside>

        {/* RIGHT: MULTI-TAB EDITOR */}
        <main className="lg:col-span-8 flex flex-col min-h-0 px-2">
          {editingSong ? (
            <form onSubmit={handleSave} className="planner-card !p-0 border-white/10 bg-white/[0.04] flex flex-col h-full overflow-hidden shadow-2xl">
              <div className="p-8 pb-0 flex items-center justify-between">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400"><Zap size={20} /></div>
                    <h2 className="display-title text-3xl text-white not-italic font-black">{editingSong.title || "New Repertoire"}</h2>
                  </div>
                  <div className="flex gap-2 p-1 rounded-xl glass border-white/10 w-fit bg-white/[0.02]">
                     {[{ id: 'general', label: 'General', icon: <Layout size={14} /> }, { id: 'lyrics', label: 'Lyrics', icon: <Type size={14} /> }, { id: 'assets', label: 'Performance Assets', icon: <FileText size={14} /> }].map((tab) => (
                       <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`px-4 h-9 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>{tab.icon} {tab.label}</button>
                     ))}
                  </div>
                </div>
                <button type="submit" className="h-14 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all self-start shadow-[0_0_40px_rgba(255,255,255,0.2)]"><Save size={18} /> Save Work</button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 pt-8 scrollbar-thin">
                {activeTab === "general" && (
                  <div className="grid grid-cols-2 gap-10 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Song Type</label>
                        <div className="flex p-1 rounded-xl glass bg-white/[0.05] border-white/10">
                          <button type="button" onClick={() => setEditingSong({...editingSong, songType: "original"})} className={`flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editingSong.songType === "original" ? "bg-violet-600 text-white shadow-lg" : "text-white/60 hover:text-white"}`}>Original</button>
                          <button type="button" onClick={() => setEditingSong({...editingSong, songType: "cover"})} className={`flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editingSong.songType === "cover" ? "bg-amber-600 text-white shadow-lg" : "text-white/60 hover:text-white"}`}>Cover</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 flex items-center justify-between">
                           Artwork 
                           <div className="flex items-center gap-2">
                              {artworkSource === "autoloaded" && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse"><CheckCircle2 size={10} /> Autoloaded from Album</span>}
                              <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded flex items-center gap-1"><Clipboard size={10} /> Paste Enabled</span>
                           </div>
                        </label>
                        <div onClick={() => fileInputRef.current?.click()} className="aspect-video w-full rounded-3xl overflow-hidden glass border-white/10 relative group bg-black/20 cursor-pointer hover:border-violet-500/50 transition-all shadow-xl">
                          {editingSong.artworkUrl && !imageError ? (
                            <img src={editingSong.artworkUrl} onError={() => setImageError(true)} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                               {imageError ? <AlertCircle size={32} className="text-rose-500 mb-3 shadow-[0_0_15px_rgba(244,63,94,0.3)]" /> : <Upload size={32} className="text-white/20 mb-3 group-hover:text-violet-400 transition-colors" />}
                               <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{imageError ? "Invalid URL" : "Click to Upload or Paste"}</p>
                            </div>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        <input value={editingSong.artworkUrl || ""} onChange={e => { setEditingSong({...editingSong, artworkUrl: e.target.value}); setArtworkSource("manual"); setImageError(false); }} placeholder="Or paste image URL here..." className={`w-full h-12 px-4 rounded-xl glass bg-white/[0.05] text-[11px] mt-4 outline-none transition-all font-bold ${imageError ? 'border-rose-500/50 text-rose-400' : 'border-white/10 text-white/80 focus:border-white/30'}`} />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Song Title</label><input required value={editingSong.title || ""} onChange={e => setEditingSong({...editingSong, title: e.target.value})} placeholder="e.g. Midnight Drive" className="w-full h-14 px-6 rounded-xl glass bg-white/[0.05] border-white/10 text-xl font-bold text-white outline-none focus:border-violet-500/50 transition-all placeholder:text-white/20" /></div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Artist / Composer</label>
                          <input list="artist-list" value={editingSong.artist || ""} onChange={e => setEditingSong({...editingSong, artist: e.target.value})} placeholder="e.g. Orion" className="w-full h-12 px-6 rounded-xl glass bg-white/[0.05] border-white/10 text-sm text-white font-bold outline-none focus:border-white/30 transition-all placeholder:text-white/20" />
                          <datalist id="artist-list">{uniqueArtists.map(artist => <option key={artist} value={artist} />)}</datalist>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Album</label>
                          <div className="relative group">
                             <Disc className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-violet-400 transition-colors" size={14} />
                             <input list="album-list" value={editingSong.album || ""} onChange={e => setEditingSong({...editingSong, album: e.target.value})} placeholder="e.g. Dark Side of the Moon" className="w-full h-12 pl-12 pr-6 rounded-xl glass bg-white/[0.05] border-white/10 text-sm text-white font-bold outline-none focus:border-white/30 transition-all placeholder:text-white/20" />
                             <datalist id="album-list">{uniqueAlbums.map(album => <option key={album} value={album} />)}</datalist>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Key</label>
                          <input value={editingSong.defaultKey || ""} onChange={e => setEditingSong({...editingSong, defaultKey: e.target.value})} placeholder="G Maj" className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-xs text-white font-black outline-none focus:border-white/30 transition-all" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">BPM</label>
                          <input value={editingSong.tempo || ""} onChange={e => setEditingSong({...editingSong, tempo: e.target.value})} placeholder="120" className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-xs text-white font-black outline-none focus:border-white/30 transition-all" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Time <span className="text-[7px] opacity-40">(Min)</span></label>
                          <input type="number" value={editingSong.durationEstimate || 4} onChange={e => setEditingSong({...editingSong, durationEstimate: parseInt(e.target.value) || 0})} className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-xs text-white font-black outline-none focus:border-white/30 transition-all" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Tuning</label>
                          <input value={editingSong.tuning || ""} onChange={e => setEditingSong({...editingSong, tuning: e.target.value})} placeholder="Standard" className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-[9px] text-white font-black outline-none focus:border-white/30 transition-all" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Capo</label>
                          <input type="number" value={editingSong.capo || 0} onChange={e => setEditingSong({...editingSong, capo: parseInt(e.target.value) || 0})} placeholder="0" className="w-full h-12 px-3 rounded-xl glass bg-white/[0.05] border-white/10 text-xs text-white font-black outline-none focus:border-white/30 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "lyrics" && (
                  <div className="flex flex-col h-full animate-in slide-in-from-right duration-500">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-4 block font-bold">Performance Lyrics</label>
                    <textarea value={editingSong.lyrics || ""} onChange={e => setEditingSong({...editingSong, lyrics: e.target.value})} placeholder="Paste your lyrics here..." className="flex-1 w-full min-h-[400px] p-10 rounded-[32px] glass bg-white/[0.05] border-white/10 text-xl leading-relaxed text-white outline-none focus:border-violet-500/30 font-serif resize-none scrollbar-thin" />
                  </div>
                )}
                {activeTab === "assets" && (
                  <div className="grid grid-cols-12 gap-10 animate-in slide-in-from-right duration-500 h-full">
                    <div className="col-span-5 space-y-8">
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Chart Asset (Image or PDF)</label>
                          <div className="flex flex-col gap-4">
                             <div 
                                onClick={() => pdfInputRef.current?.click()}
                                className="w-full h-24 rounded-2xl glass border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center gap-4 hover:border-violet-500/50 hover:bg-white/[0.05] transition-all cursor-pointer group"
                             >
                                <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all"><Upload size={20} /></div>
                                <div className="text-left"><p className="text-[10px] font-black uppercase tracking-widest text-white">Upload PDF / Image</p><p className="text-[8px] font-bold text-white/40">Select local file for chart</p></div>
                             </div>
                             <input type="file" ref={pdfInputRef} onChange={handleChartUpload} accept="application/pdf,image/*" className="hidden" />
                             <input value={editingSong.tabs || ""} onChange={e => setEditingSong({...editingSong, tabs: e.target.value})} placeholder="Or paste asset URL here..." className="w-full h-12 px-5 rounded-xl glass bg-white/[0.05] border-white/10 text-[10px] text-white/80 outline-none focus:border-white/30 transition-all" />
                          </div>
                       </div>
                       <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block font-bold">Quick Chords / Notes</label><textarea value={editingSong.chords || ""} onChange={e => setEditingSong({...editingSong, chords: e.target.value})} placeholder="G | C | D | Em..." className="w-full h-32 p-5 rounded-xl glass bg-white/[0.05] border-white/10 text-xs font-mono text-violet-400 outline-none focus:border-violet-500/30 resize-none" /></div>
                    </div>
                    <div className="col-span-7 h-full">
                       <div className="flex items-center justify-between mb-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 block font-bold">Chart Preview</label>
                          {isPdf && (
                            <button 
                              type="button" 
                              onClick={convertPdfToImage}
                              disabled={isConverting}
                              className="px-3 h-7 rounded-lg bg-violet-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-600/20"
                            >
                              {isConverting ? <Clock size={10} className="animate-spin" /> : <Zap size={10} fill="currentColor" />}
                              {isConverting ? "Converting..." : "Convert to Scrollable Image"}
                            </button>
                          )}
                       </div>
                       <div className="h-full min-h-[440px] rounded-[32px] glass border-white/10 bg-white/[0.02] flex items-center justify-center overflow-hidden shadow-2xl relative">
                          {editingSong.tabs ? (
                             isPdf ? (
                                <iframe src={editingSong.tabs} className="w-full h-full border-none" title="Chart PDF Preview" />
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
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[40px]">
              <Music2 size={80} className="mb-6 text-white/20" /><p className="text-sm font-black uppercase tracking-widest text-center text-white/60 text-white/40">Select a work to edit <br /> or add to the repertoire</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CatalogItem({ song, isActive, onEdit, onDelete }: { song: Song, isActive: boolean, onEdit: () => void, onDelete: () => void }) {
  return (
    <div 
      onClick={onEdit} 
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(); }}
      className={`planner-card !p-4 w-full flex items-center justify-between group hover:!bg-white/10 transition-all cursor-pointer bg-white/[0.03] border-white/10 ${isActive ? "!bg-white/10 border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.2)]" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl overflow-hidden glass bg-white/10 border border-white/5">
          {song.artworkUrl ? <img src={song.artworkUrl} className="w-full h-full object-cover" /> : <Music2 size={16} className="text-white/40 m-3" />}
        </div>
        <div className="text-left"><h4 className="font-bold text-white text-base leading-none mb-1 not-italic">{song.title}</h4><p className="text-[10px] font-black uppercase tracking-widest text-white/60">{song.artist}</p></div>
      </div>
      <div className="flex items-center gap-4">
         <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border ${song.songType === 'original' ? 'bg-violet-600 text-white border-violet-500' : 'bg-amber-600 text-white border-amber-500'}`}>{song.songType}</div>
         <button 
           onClick={(e) => { e.stopPropagation(); onDelete(); }} 
           className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-rose-400 transition-all"
           aria-label="Delete song"
         >
           <Trash2 size={14} />
         </button>
      </div>
    </div>
  );
}
