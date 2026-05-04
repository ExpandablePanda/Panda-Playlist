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
import { Providers } from "./providers";
import { NavPillClient } from "./NavPillClient";

function NavPill() {
  return (
    <NavPillClient />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          {children}
          <NavPill />
        </Providers>
      </body>
    </html>
  );
}
