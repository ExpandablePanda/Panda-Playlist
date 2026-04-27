import Link from "next/link";
import { BarChart3, Library, RadioTower, ScrollText, WandSparkles } from "lucide-react";



const nav = [
  { href: "/app", label: "Dashboard", icon: WandSparkles },
  { href: "/app/library", label: "Library", icon: Library },
  { href: "/app/shows", label: "Shows", icon: ScrollText },
  { href: "/app/reports", label: "Reports", icon: BarChart3 },
];

export default async function PerformerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="panel hero-grid sticky top-4 z-30 mb-6 rounded-[24px] px-5 py-4 backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-stone-950">
                <RadioTower className="h-6 w-6" />
              </div>
              <div>
                <p className="display text-3xl leading-none text-white">StageVault</p>
                <p className="text-sm tracking-[0.18em] text-stone-400 uppercase">Live Performance Control Surface</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-stone-200 transition hover:border-amber-300/40 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>

          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
