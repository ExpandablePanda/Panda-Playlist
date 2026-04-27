import { RadioTower, Shield } from "lucide-react";
import { hasPerformerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasPerformerSession()) {
    redirect("/app");
  }

  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#6a1d18_0%,#14080b_42%,#08090d_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <section className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.06] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur md:p-12">
            <div className="space-y-6">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-amber-300/20 bg-amber-200/10 px-4 py-2 text-sm tracking-[0.2em] text-amber-100 uppercase">
                <RadioTower className="h-4 w-4" />
                StageVault
              </div>
              <div className="space-y-4">
                <h1 className="display max-w-2xl text-5xl leading-none text-white md:text-7xl">
                  Your stage, your setlist, your room in real time.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-stone-300">
                  Catalog every song, run the show from your iPad, take live audience requests, and close the night
                  with a clean performance archive.
                </p>
              </div>
            </div>

            <div className="grid gap-4 text-sm text-stone-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Song vault with lyrics, tabs, and keys.</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Live request board with voting and moderation.</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Locked-show reports inspired by almanac culture.</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#140f13] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] md:p-10">
            <div className="mb-8 flex items-center gap-3 text-sm uppercase tracking-[0.18em] text-stone-400">
              <Shield className="h-4 w-4 text-amber-300" />
              Performer Access
            </div>
            <form action="/api/auth/sign-in" method="POST" className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="passcode" className="block text-sm text-stone-300">
                  Enter your performer passcode
                </label>
                <input
                  id="passcode"
                  name="passcode"
                  type="password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-lg text-white outline-none ring-0 transition focus:border-amber-300/60"
                  placeholder="stagevault"
                />
              </div>
              {error ? (
                <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  That passcode didn&apos;t match.
                </p>
              ) : null}
              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-300 px-5 py-4 text-base font-semibold text-stone-950 transition hover:bg-amber-200"
              >
                Enter StageVault
              </button>
              <p className="text-sm leading-7 text-stone-500">
                Default local passcode is{" "}
                <code className="rounded bg-white/5 px-2 py-1 text-stone-300">stagevault</code>.
                Set <code className="rounded bg-white/5 px-2 py-1 text-stone-300">PERFORMER_PASSCODE</code> to change it.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
