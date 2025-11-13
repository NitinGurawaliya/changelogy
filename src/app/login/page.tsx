import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { getCurrentSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-neutral-50 lg:grid-cols-2">
      <section className="relative hidden items-center justify-center border-r border-neutral-200 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-12 py-24 text-neutral-100 lg:flex">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute left-10 top-16 h-32 w-32 rounded-full bg-neutral-500/40 blur-3xl" />
          <div className="absolute bottom-10 right-12 h-40 w-40 rounded-full bg-neutral-400/30 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md space-y-6">
          <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-200 ring-1 ring-white/20">
            Admin console
          </span>
          <h1 className="text-3xl font-semibold text-white">
            Manage changelog workspaces with clarity and speed.
          </h1>
          <p className="text-sm text-neutral-200">
            Bring every release note, version name, and public page into one organized layout crafted for product teams.
          </p>
          <ul className="space-y-3 text-sm text-neutral-200/90">
            <li className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                1
              </span>
              Track every product with a dedicated dashboard experience.
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                2
              </span>
              Capture structured version names and ship polished release notes.
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                3
              </span>
              Publish updates instantly to your public changelog pages.
            </li>
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-sm space-y-8 rounded-3xl border border-neutral-200/80 bg-white/90 p-10 shadow-lg shadow-neutral-200/60 backdrop-blur">
          <div className="space-y-2 text-center">
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.4em] text-neutral-400">
              Changelogy
            </Link>
            <h2 className="text-2xl font-semibold text-neutral-900">Sign in to your workspace</h2>
            <p className="text-sm text-neutral-500">
              Access project dashboards, manage releases, and stay in sync with your audience.
            </p>
          </div>

          <div className="space-y-6">
            <LoginForm />
          </div>

          <p className="text-center text-sm text-neutral-500">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-neutral-900 underline-offset-4 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

