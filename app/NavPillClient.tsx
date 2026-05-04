'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music2, Layout, Calendar, BarChart3, Radio, Home as HomeIcon } from "lucide-react";

import { authClient } from "@/lib/auth/client";
import { useState, useEffect } from "react";

export function NavPillClient() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [localUser, setLocalUser] = useState<any>(null);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('panda_user');
    if (stored) {
      try { setLocalUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  if (!mounted || isPending) return null;

  const user = session?.user || localUser;

  // Hide nav on auth and account pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/account')) {
    return null;
  }

  // Hide nav on landing page if not logged in
  if (pathname === '/' && !user) {
    return null;
  }

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center p-2 rounded-3xl glass border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-1000">
      <Link href="/" className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all group">
        <HomeIcon size={18} className="text-white/40 group-hover:text-rose-400 transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Tour Control</span>
      </Link>
      <div className="w-[1px] h-6 bg-white/5 mx-1" />
      <Link href="/library" className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all group">
        <Music2 size={18} className="text-white/40 group-hover:text-violet-400 transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Catalog</span>
      </Link>
      <div className="w-[1px] h-6 bg-white/5 mx-1" />
      <Link href="/planner" className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all group">
        <Layout size={18} className="text-white/40 group-hover:text-emerald-400 transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Planner</span>
      </Link>
      <div className="w-[1px] h-6 bg-white/5 mx-1" />
      <Link href="/tour" className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all group">
        <Calendar size={18} className="text-white/40 group-hover:text-amber-400 transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Tour</span>
      </Link>
      <div className="w-[1px] h-6 bg-white/5 mx-1" />
      <Link href="/analytics" className="flex items-center gap-2 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all group">
        <BarChart3 size={18} className="text-white/40 group-hover:text-blue-400 transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Stats</span>
      </Link>
      <div className="w-[1px] h-6 bg-white/5 mx-1" />
      <Link href="/stage" className="pl-4 pr-2">
        <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] animate-pulse hover:scale-110 transition-transform cursor-pointer" title="Go to Live Stage">
          <Radio size={20} />
        </div>
      </Link>
    </nav>
  );
}
