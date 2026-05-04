"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, MapPin, DollarSign, User, Phone, Mail, 
  Plus, Search, Filter, ChevronRight, MoreHorizontal,
  Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp,
  Map, Trash2, Edit3, Save, X, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Show } from "@/lib/types";
import { clientDb } from "@/lib/clientDb";

export default function TourPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newShow, setNewShow] = useState<Partial<Show>>({
    venue: "",
    date: new Date().toISOString().split('T')[0],
    city: "",
    state: "",
    rate: 0,
    status: "upcoming"
  });

  const fetchData = () => {
    setShows(clientDb.getShows());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const upcoming = shows.filter(s => s.status === "upcoming");
    const completed = shows.filter(s => s.status === "completed");
    const totalRevenue = completed.reduce((sum, s) => sum + (s.rate || 0), 0);
    const projectedRevenue = upcoming.reduce((sum, s) => sum + (s.rate || 0), 0);
    
    return {
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      totalRevenue,
      projectedRevenue
    };
  }, [shows]);

  const filteredShows = shows.filter(s => 
    s.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.state.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleAddShow = (e: React.FormEvent) => {
    e.preventDefault();
    clientDb.saveShow(newShow);
    fetchData();
    setIsAddModalOpen(false);
    setNewShow({
      venue: "",
      date: new Date().toISOString().split('T')[0],
      city: "",
      state: "",
      rate: 0,
      status: "upcoming"
    });
  };

  const deleteShow = (id: string) => {
    if (!confirm("Are you sure you want to delete this show?")) return;
    clientDb.deleteShow(id);
    fetchData();
  };

  return (
    <div className="min-h-screen obsidian-bg text-white p-8 pt-32 pb-20">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="animate-in slide-in-from-left duration-700">
            <h1 className="display-title text-6xl md:text-8xl mb-4 italic font-black tracking-tighter">Tour Master</h1>
            <p className="text-white/40 text-lg max-w-xl font-medium tracking-tight">Strategy and logistics for the road. Track your revenue, manage venue relations, and plan your next big run.</p>
          </div>
          <div className="flex gap-4 animate-in slide-in-from-right duration-700">
            <div className="glass p-6 rounded-3xl border-white/5 min-w-[200px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Projected Revenue</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-emerald-400 leading-none">${stats.projectedRevenue.toLocaleString()}</span>
                <ArrowUpRight size={16} className="text-emerald-500 mb-1" />
              </div>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="h-full px-8 rounded-3xl bg-violet-600 hover:bg-violet-500 transition-all shadow-[0_0_40px_rgba(124,58,237,0.3)] flex flex-col items-center justify-center gap-2 group"
            >
              <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Add Tour Date</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* STATS STRIP */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Upcoming Shows", val: stats.upcomingCount, icon: <Calendar className="text-violet-400" />, sub: "Confirmed dates" },
              { label: "Completed", val: stats.completedCount, icon: <CheckCircle2 className="text-emerald-400" />, sub: "Successful shows" },
              { label: "Total Earnings", val: `$${stats.totalRevenue.toLocaleString()}`, icon: <TrendingUp className="text-blue-400" />, sub: "Career to date" },
              { label: "Active Regions", val: new Set(shows.map(s => s.state)).size, icon: <Map className="text-amber-400" />, sub: "States covered" }
            ].map((st, i) => (
              <div key={i} className="glass p-6 rounded-3xl border-white/5 animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">{st.icon}</div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{st.label}</p>
                </div>
                <h3 className="text-4xl font-black text-white leading-none mb-1 tracking-tighter">{st.val}</h3>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{st.sub}</p>
              </div>
            ))}
          </div>

          {/* MAIN LIST */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black uppercase tracking-tighter">Tour Schedule</h2>
               <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    placeholder="Search venue or city..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-10 pl-10 pr-6 rounded-full glass border-white/10 bg-white/[0.02] text-xs font-bold outline-none focus:border-white/20 transition-all w-64"
                  />
               </div>
            </div>

            {filteredShows.length === 0 ? (
              <div className="py-20 text-center glass rounded-[40px] border-white/5 bg-white/[0.01]">
                <MapPin size={48} className="mx-auto mb-4 text-white/10" />
                <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No shows found for this run.</p>
              </div>
            ) : filteredShows.map((show, i) => (
              <div key={show.id} className="group relative animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`planner-card !p-8 grid grid-cols-12 items-center border-l-4 transition-all bg-white/[0.03] border-white/10 ${show.status === 'completed' ? 'border-l-emerald-500/30' : 'border-l-violet-500 shadow-xl shadow-violet-500/5'}`}>
                  <div className="col-span-2 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">{new Date(show.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                    <span className="text-4xl font-black text-white leading-none tracking-tighter">{new Date(show.date).getDate()}</span>
                    <span className="text-[10px] font-black text-white/40 mt-1 uppercase tracking-widest">{new Date(show.date).getFullYear()}</span>
                  </div>
                  
                  <div className="col-span-4">
                    <h4 className="text-2xl font-black text-white mb-1 group-hover:text-violet-400 transition-colors tracking-tight">{show.venue}</h4>
                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                       <MapPin size={10} className="text-rose-500" />
                       {show.city}, {show.state}
                    </div>
                  </div>

                  <div className="col-span-3 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Performance Rate</p>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xl tracking-tighter">
                       <DollarSign size={16} />
                       {show.rate.toLocaleString()}
                    </div>
                  </div>

                  <div className="col-span-3 flex items-center justify-end gap-6">
                    <Link 
                      href={`/planner?showId=${show.id}`}
                      className="px-6 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-white/60 hover:text-white"
                    >
                      Planner <ChevronRight size={14} />
                    </Link>
                    <button onClick={() => deleteShow(show.id)} className="p-3 rounded-xl text-white/10 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SIDEBAR: LOGISTICS */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-[40px] border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent">
              <h3 className="text-xl font-black uppercase tracking-widest mb-8 pb-4 border-b border-white/5">Tour Logistics</h3>
              <div className="space-y-8">
                 <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0"><MapPin size={24} /></div>
                    <div>
                       <h5 className="font-bold text-white mb-1">Top Region</h5>
                       <p className="text-xs text-white/40">You are heavily booked in the Northeast this quarter.</p>
                    </div>
                 </div>
                 <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0"><TrendingUp size={24} /></div>
                    <div>
                       <h5 className="font-bold text-white mb-1">Yield Up 12%</h5>
                       <p className="text-xs text-white/40">Average show rate has increased since implementing Pro Playlist.</p>
                    </div>
                 </div>
                 <div className="flex gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0"><User size={24} /></div>
                    <div>
                       <h5 className="font-bold text-white mb-1">Venue Outreach</h5>
                       <p className="text-xs text-white/40">3 venues have pending follow-ups for Q4 bookings.</p>
                    </div>
                 </div>
              </div>

              <button className="w-full mt-12 h-14 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Export Itinerary (PDF)</button>
            </div>

            <div className="glass p-8 rounded-[40px] border-white/5 relative overflow-hidden group cursor-pointer">
               <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-2">Next Step</p>
                 <h4 className="text-xl font-black text-white mb-4">Launch Analytics Dashboard</h4>
                 <Link href="/analytics" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-all">Explore Stats <ChevronRight size={14} /></Link>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD SHOW MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
           <form onSubmit={handleAddShow} className="glass p-10 w-full max-w-2xl relative border-white/10 rounded-[40px] shadow-2xl">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-all"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                <div className="h-12 w-12 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400"><Calendar size={24} /></div>
                <h2 className="display-title text-3xl text-white font-black italic tracking-tighter">New Tour Date</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Venue Name</label>
                    <input required value={newShow.venue} onChange={e => setNewShow({...newShow, venue: e.target.value})} className="w-full h-14 px-6 rounded-2xl glass bg-white/[0.05] border-white/10 text-xl font-bold text-white outline-none focus:border-violet-500/50 transition-all" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Show Date</label>
                    <input required type="date" value={newShow.date} onChange={e => setNewShow({...newShow, date: e.target.value})} className="w-full h-14 px-6 rounded-2xl glass bg-white/[0.05] border-white/10 text-sm text-white outline-none" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">Performance Rate ($)</label>
                    <input type="number" value={newShow.rate} onChange={e => setNewShow({...newShow, rate: parseInt(e.target.value) || 0})} className="w-full h-14 px-6 rounded-2xl glass bg-white/[0.05] border-white/10 text-lg font-black text-emerald-400 outline-none" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">City</label>
                    <input required value={newShow.city} onChange={e => setNewShow({...newShow, city: e.target.value})} className="w-full h-12 px-5 rounded-xl glass bg-white/[0.05] border-white/10 text-sm text-white" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 block">State</label>
                    <input required value={newShow.state} onChange={e => setNewShow({...newShow, state: e.target.value})} className="w-full h-12 px-5 rounded-xl glass bg-white/[0.05] border-white/10 text-sm text-white" />
                 </div>
              </div>

              <div className="mt-12 flex gap-4">
                 <button type="submit" className="flex-1 h-14 rounded-2xl bg-violet-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-violet-500 transition-all shadow-[0_0_40px_rgba(124,58,237,0.4)]"><Save size={18} /> Confirm Date</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
