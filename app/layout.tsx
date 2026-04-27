import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StageVault",
  description: "iPad-first live music dashboard for setlists, requests, and show reports.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "StageVault",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0b0f] text-stone-100 antialiased">
        {children}
      </body>
    </html>
  );
}
