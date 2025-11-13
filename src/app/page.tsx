import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white via-white to-neutral-100 px-6 py-24 text-center">
      <div className="max-w-2xl space-y-8">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200">
            Built for changelog lovers
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            Beautiful Changelogs. Zero friction.
          </h1>
          <p className="text-lg text-neutral-600">
            Turn product updates into clean, shareable public changelog pages.
            Paste your notes, hit generate, and share your progress in seconds.
          </p>
        </div>

        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/register">Get started — it’s free</Link>
        </Button>

        <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-sm backdrop-blur">
          <p className="text-sm text-neutral-500">
            No logins. No teams. Just a fast way to publish what’s new.
          </p>
        </div>
      </div>

      <footer className="mt-24 text-sm text-neutral-400">
        Changelogy © 2025
      </footer>
    </main>
  );
}
