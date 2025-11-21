import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-neutral-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold text-neutral-900">
            Changelogy
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Sign in
            </Link>
            <Button asChild size="sm" className="rounded-lg">
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-24 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs font-medium text-neutral-700">
            <Sparkles className="size-3" />
            <span>Beautiful changelogs made simple</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
              Ship updates that
              <br />
              <span className="bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-clip-text text-transparent">
                your users love
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-neutral-600 sm:text-xl">
              Create beautiful, shareable changelogs in minutes. Connect your GitHub repos or write manually.
              <br />
              Keep your community updated with every release.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="rounded-lg px-8 text-base font-semibold shadow-lg">
              <Link href="/register">Start building changelogs</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-lg px-8 text-base font-semibold">
              <Link href="/login">View dashboard</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-neutral-100">
                <Zap className="size-6 text-neutral-700" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">GitHub Integration</h3>
              <p className="text-sm text-neutral-600">
                Connect your repos and generate changelogs automatically from commits. AI-powered summaries included.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-neutral-100">
                <Globe className="size-6 text-neutral-700" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">Public Pages</h3>
              <p className="text-sm text-neutral-600">
                Beautiful, customizable public pages for your changelogs. Share with your community effortlessly.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-neutral-100">
                <Sparkles className="size-6 text-neutral-700" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">Markdown Support</h3>
              <p className="text-sm text-neutral-600">
                Write in Markdown or let AI transform your commits into polished release notes. Your choice.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-neutral-500">
            © 2025 Changelogy. Built with care for product teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
