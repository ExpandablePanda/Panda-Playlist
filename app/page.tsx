"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Calendar, Music2, ChevronRight, Zap, 
  Settings, Clock, MapPin, Users, LayoutGrid, List,
  X, Save, DollarSign, User, Home as HomeIcon,
  Phone, Mail, Edit3, Radio
} from "lucide-react";
import Link from "next/link";
import { Show, Song } from "@/lib/types";
import { getShowsAction, getSongsAction, saveShowAction } from "@/lib/actions";
import { authClient } from "@/lib/auth/client";

function AuthButton() {
  const [mounted, setMounted] = useState(false);
  const [localUser, setLocalUser] = useState<{ name: string; email: string; image?: string } | null>(null);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('panda_user');
    if (stored) {
      try { setLocalUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  if (!mounted || isPending) return <div className="h-10 w-24 glass rounded-xl animate-pulse" />;

  const user = session?.user || localUser;

  if (user) {
    return (
      <Link 
        href="/account"
        className="flex items-center gap-3 glass px-2 h-11 rounded-full border border-white/10 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all group pr-4"
      >
        <div className="h-8 w-8 rounded-full overflow-hidden border border-white/20 shadow-[0_0_15px_rgba(124,58,237,0.3)] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          {user.image ? (
            <img 
              src={user.image} 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={16} className="text-white/80" />
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-violet-400">
          {user.name || "Account"}
        </span>
      </Link>
    );
  }

  return (
    <Link 
      href="/auth/sign-in"
      className="h-10 px-6 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center gap-2"
    >
      <User size={14} /> Login
    </Link>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen obsidian-bg flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="orb orb-purple -top-40 -left-40 w-[800px] h-[800px] animate-slow-pulse" />
      <div className="orb orb-purple -bottom-40 -right-40 w-[600px] h-[600px] animate-slow-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 text-center max-w-4xl">
        <div className="inline-flex items-center gap-3 mb-8 glass px-6 py-2 rounded-full border border-white/10 animate-in fade-in slide-in-from-top duration-1000">
          <Zap size={14} className="text-violet-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Pro Performer OS</span>
        </div>
        
        <h1 className="display-title text-8xl md:text-9xl text-white font-black tracking-tighter leading-none mb-8 animate-in fade-in zoom-in duration-1000">
          COMMAND <br /> THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">STAGE.</span>
        </h1>
        
        <p className="text-xl text-white/40 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
          The all-in-one mission control for live performers. Plan setlists, manage tours, and track stats with high-fidelity precision.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
          <Link 
            href="/auth/sign-in"
            className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]"
          >
            Start Your Tour <ChevronRight size={20} strokeWidth={3} />
          </Link>
          <Link 
            href="/auth/sign-in"
            className="h-16 px-12 rounded-2xl glass border border-white/10 text-white font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-white/5 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 text-white/20">
        <div className="flex items-center gap-2">
          <Music2 size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Library</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-white/20" />
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Planner</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-white/20" />
        <div className="flex items-center gap-2">
          <Radio size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Live Stage</span>
        </div>
      </div>
    </div>
  );
}

export default function HomeDashboard() {
  const [mounted, setMounted] = useState(false);
  const [localUser, setLocalUser] = useState<{ name: string; email: string } | null>(null);
  const { data: session, isPending } = authClient.useSession();
  const [shows, setShows] = useState<Show[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<Partial<Show> | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('panda_user');
    if (stored) {
      try { setLocalUser(JSON.parse(stored)); } catch {}
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const [fetchedShows, fetchedSongs] = await Promise.all([
      getShowsAction(),
      getSongsAction()
    ]);
    setShows(fetchedShows);
    setSongs(fetchedSongs);
  };

  const handleSaveShow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShow) return;

    const location = `${editingShow.city || ""}, ${editingShow.state || ""}`;
    saveShowAction({ ...editingShow, location } as Show).then(() => {
      fetchData();
      setIsModalOpen(false);
      setEditingShow(null);
    });
  };

  const upcomingShows = useMemo(() => {
    return shows
      .filter(s => s.status === "upcoming")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [shows]);

  const nextShow = upcomingShows[0];
  const totalDuration = songs.reduce((acc, s) => acc + s.durationEstimate, 0);

  if (!mounted || isPending) {
    return <div className="min-h-screen obsidian-bg flex items-center justify-center">
      <div className="h-12 w-12 rounded-xl bg-violet-600/20 animate-pulse border border-violet-500/20" />
    </div>;
  }

  const user = session?.user || localUser;

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen obsidian-bg p-8 lg:p-12 font-sans flex flex-col selection:bg-violet-500/30 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="orb orb-purple -top-40 -left-40 w-[800px] h-[800px] animate-slow-pulse" />
      <div className="orb orb-purple -bottom-40 -right-40 w-[600px] h-[600px] animate-slow-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-16 px-4 animate-in fade-in slide-in-from-top duration-1000">
        <div className="flex items-center gap-6">
          <div className="h-10 w-10 rounded-full glass flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-white shadow-[0_0_10px_white]" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-[1px] w-6 bg-violet-500/50" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400">Mission Control</p>
            </div>
            <h1 className="display-title text-4xl text-white tracking-tighter">Tour Control</h1>
          </div>
        </div>

        <nav className="flex items-center gap-8">
           <Link href="/planner" className="px-5 h-11 rounded-full glass border border-white/10 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/5 transition-all">Setlist Planner</Link>
           <Link href="/library" className="px-5 h-11 rounded-full glass border border-white/10 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/5 transition-all">Master Catalog</Link>
           <AuthButton />
           <div className="h-11 w-11 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer border border-white/10 group">
              <Settings size={18} className="text-white/40 group-hover:text-white group-hover:rotate-90 transition-all" />
           </div>
        </nav>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
        
        {/* LEFT: HERO & STATS */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <section className="relative group overflow-hidden rounded-[40px] glass p-12 flex flex-col justify-end min-h-[440px] border-white/10 transition-all duration-700 bg-gradient-to-br from-white/[0.03] to-transparent">
             <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-emerald-500/5 opacity-40 group-hover:opacity-60 transition-opacity" />
             <div className="absolute top-10 right-10">
                <div className="px-5 py-2.5 rounded-full glass bg-white/10 border-white/20 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                   Next Event
                </div>
             </div>

             <div className="relative z-20">
                <div className="flex items-center gap-3 mb-4 text-violet-400">
                   <Calendar size={18} />
                   <span className="text-xs font-black uppercase tracking-[0.3em]">{nextShow ? new Date(nextShow.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "No upcoming shows"}</span>
                </div>
                <div className="flex items-start gap-4 mb-6">
                   <h2 className="display-title text-8xl text-white tracking-tighter leading-none">
                      {nextShow ? nextShow.venue : "Ready for Tour"}
                   </h2>
                   {nextShow && (
                     <button onClick={() => { setEditingShow(nextShow); setIsModalOpen(true); }} className="h-10 w-10 rounded-xl glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all mt-4"><Edit3 size={18} /></button>
                   )}
                </div>
                <div className="flex items-center gap-8">
                   <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-rose-500" />
                      <span className="text-sm font-bold text-white tracking-wide">{nextShow ? nextShow.location : "World Tour"}</span>
                   </div>
                   {nextShow?.rate && (
                     <div className="flex items-center gap-3">
                        <DollarSign size={16} className="text-emerald-400" />
                        <span className="text-sm font-black text-emerald-400 tracking-wide">{nextShow.rate} Agreed Rate</span>
                     </div>
                   )}
                   <Link href={nextShow ? `/planner?showId=${nextShow.id}` : "/planner"} className="ml-auto h-14 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                      Build Setlist <ChevronRight size={18} strokeWidth={3} />
                   </Link>
                </div>
             </div>
          </section>

          <div className="grid grid-cols-3 gap-6">
             <StatCard icon={<Music2 />} label="Repertoire" value={`${songs.length} Songs`} detail={`${Math.round(totalDuration/60)} Hours of Music`} />
             <StatCard icon={<Zap />} label="Upcoming Shows" value={`${upcomingShows.length}`} detail="Confirmed Dates" />
             <StatCard icon={<DollarSign />} label="Tour Value" value={`${upcomingShows.reduce((acc, s) => acc + (s.rate || 0), 0)}`} detail="Projected Revenue" color="emerald" />
          </div>
        </div>

        {/* RIGHT: SHOW LIST */}
        <aside className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="display-title text-4xl text-white tracking-tight">Schedule</h3>
            <button 
              onClick={() => { setEditingShow({ date: "", venue: "", city: "", state: "", address: "", contactName: "", contactPhone: "", contactEmail: "", rate: 0, status: "upcoming" }); setIsModalOpen(true); }}
              className="h-10 w-10 glass rounded-xl flex items-center justify-center text-violet-400 border border-white/10 hover:bg-violet-600 hover:text-white transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]"
            >
               <Plus size={20} strokeWidth={3} />
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin">
             {upcomingShows.map((show, idx) => (
               <ShowRow key={show.id} show={show} isFirst={idx === 0} onClick={() => { setEditingShow(show); setIsModalOpen(true); }} />
             ))}
             {upcomingShows.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-card">
                 <Calendar size={40} className="mb-4 text-white/40" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-center text-white/60">Your tour calendar <br /> is wide open</p>
               </div>
             )}
          </div>
        </aside>

      </div>

      {/* SHOW MODAL */}
      {isModalOpen && editingShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
           <form onSubmit={handleSaveShow} className="planner-card !p-10 w-full max-w-2xl relative bg-obsidian-950/90 border-white/10 shadow-2xl">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 text-white/60 hover:text-white transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/10">
                <div className="h-12 w-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                  <Calendar size={24} />
                </div>
                <h2 className="display-title text-3xl text-white font-black">{editingShow.id ? "Edit Tour Date" : "Add Tour Date"}</h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Venue Name</label>
                    <input 
                      required
                      value={editingShow.venue || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, venue: e.target.value})}
                      placeholder="e.g. Red Rocks Amphitheatre" 
                      className="w-full h-14 px-6 rounded-xl glass bg-white/[0.08] border-white/20 text-lg font-bold text-white outline-none focus:border-violet-500/50 transition-all placeholder:text-white/40"
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Show Date</label>
                    <input 
                      required
                      type="date"
                      value={editingShow.date || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, date: e.target.value})}
                      className="w-full h-12 px-5 rounded-xl glass bg-white/[0.08] border-white/20 text-sm text-white outline-none focus:border-white/30 transition-all"
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Agreed Rate ($)</label>
                    <div className="relative group">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                       <input 
                        type="number"
                        value={editingShow.rate || 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, rate: parseInt(e.target.value) || 0})}
                        className="w-full h-12 pl-12 pr-4 rounded-xl glass bg-white/[0.08] border-white/20 text-sm font-black text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                 </div>

                 <div className="col-span-2 grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Contact Name</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                          <input 
                            value={editingShow.contactName || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, contactName: e.target.value})}
                            placeholder="John Doe"
                            className="w-full h-12 pl-10 pr-4 rounded-xl glass bg-white/[0.08] border-white/20 text-xs text-white outline-none focus:border-white/30 transition-all"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Phone</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                          <input 
                            value={editingShow.contactPhone || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, contactPhone: e.target.value})}
                            placeholder="555-0123"
                            className="w-full h-12 pl-10 pr-4 rounded-xl glass bg-white/[0.08] border-white/20 text-xs text-white outline-none focus:border-white/30 transition-all"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Email</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                          <input 
                            value={editingShow.contactEmail || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, contactEmail: e.target.value})}
                            placeholder="john@venue.com"
                            className="w-full h-12 pl-10 pr-4 rounded-xl glass bg-white/[0.08] border-white/20 text-xs text-white outline-none focus:border-white/30 transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="col-span-2 grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">City</label>
                       <input 
                        value={editingShow.city || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, city: e.target.value})}
                        className="w-full h-12 px-5 rounded-xl glass bg-white/[0.08] border-white/20 text-sm text-white outline-none focus:border-white/30 transition-all"
                      />
                    </div>
                    <div className="col-span-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">State</label>
                       <input 
                        value={editingShow.state || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, state: e.target.value})}
                        className="w-full h-12 px-5 rounded-xl glass bg-white/[0.08] border-white/20 text-sm text-white outline-none focus:border-white/30 transition-all"
                      />
                    </div>
                    <div className="col-span-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Street Address</label>
                       <input 
                        value={editingShow.address || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingShow({...editingShow, address: e.target.value})}
                        className="w-full h-12 px-5 rounded-xl glass bg-white/[0.08] border-white/20 text-sm text-white outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                      />
                    </div>
                 </div>
              </div>

              <div className="mt-12 flex gap-4">
                 <button type="submit" className="flex-1 h-14 rounded-2xl bg-violet-600 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-violet-500 transition-all shadow-[0_0_40px_rgba(124,58,237,0.4)]">
                    <Save size={18} /> {editingShow.id ? "Save Changes" : "Confirm Date"}
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, detail, color = "violet" }: any) {
  const colorMap = {
    violet: "text-violet-400 bg-violet-500/20 shadow-[0_0_25px_rgba(124,58,237,0.2)]",
    emerald: "text-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
  };
  return (
    <div className="planner-card !p-8 group hover:bg-white/[0.08] transition-all bg-white/[0.04] border-white/10 shadow-2xl">
       <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorMap[color as keyof typeof colorMap]}`}>
          {React.cloneElement(icon, { size: 24 })}
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 mb-1">{label}</p>
       <h4 className="text-3xl font-black text-white mb-2 tracking-tighter leading-none">{value}</h4>
       <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{detail}</p>
    </div>
  );
}

function ShowRow({ show, isFirst, onClick }: { show: Show, isFirst: boolean, onClick: () => void }) {
  const date = new Date(show.date);
  return (
    <div onClick={onClick} className={`planner-card !p-5 flex items-center justify-between group cursor-pointer hover:border-violet-500/50 transition-all bg-white/[0.04] border-white/10 ${isFirst ? 'border-l-4 border-l-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.15)] bg-white/[0.06]' : ''}`}>
       <div className="flex items-center gap-5">
          <div className="text-center min-w-[40px]">
             <p className="text-[9px] font-black uppercase text-white/80">{date.toLocaleDateString(undefined, { month: 'short' })}</p>
             <p className="text-xl font-black text-white leading-none">{date.getDate()}</p>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <div>
             <h4 className="font-bold text-white group-hover:text-violet-400 transition-colors leading-none mb-1.5">{show.venue}</h4>
             <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{show.city}, {show.state}</p>
                <div className="h-1 w-1 rounded-full bg-white/30" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-bold">{show.rate}</p>
             </div>
          </div>
       </div>
       <ChevronRight size={16} className="text-white/40 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
    </div>
  );
}
