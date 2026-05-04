import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panda Playlist | Pro Performer Mission Control",
  description: "High-fidelity performance and rehearsal tool for live musicians.",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import Link from "next/link";
import { 
  Music2, Layout, Calendar, BarChart3, 
  Terminal, User, Zap, Radio
} from "lucide-react";

function NavPill() {
  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center p-2 rounded-3xl glass border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-1000">
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

import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import { authClient } from "@/lib/auth/client";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans">
        <NeonAuthUIProvider authClient={authClient}>
          {children}
          <NavPill />
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
