import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/register-form";
import { getCurrentSession } from "@/lib/session";

export default async function RegisterPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-neutral-50 lg:grid-cols-2">
      <section className="relative hidden items-center justify-center border-r border-neutral-200 bg-gradient-to-br from-neutral-100 via-white to-neutral-100 px-12 py-24 text-neutral-900 lg:flex">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-12 top-16 h-36 w-36 rounded-full bg-neutral-400/30 blur-3xl" />
          <div className="absolute bottom-16 right-20 h-32 w-32 rounded-full bg-neutral-300/40 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md space-y-6">
          <span className="inline-flex w-fit items-center rounded-full bg-neutral-900/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 ring-1 ring-neutral-900/10">
            Start sharing
          </span>
          <h1 className="text-3xl font-semibold text-neutral-900">
            Launch a public changelog your customers will actually read.
          </h1>
          <p className="text-sm text-neutral-600">
            Showcase momentum, keep stakeholders aligned, and celebrate every iteration with polished release notes.
          </p>
          <ul className="space-y-3 text-sm text-neutral-600/90">
            <li className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-neutral-900/10 text-xs font-semibold text-neutral-700">
                ✓
              </span>
              Unlimited projects with dedicated changelog homepages.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-neutral-900/10 text-xs font-semibold text-neutral-700">
                ✓
              </span>
              Draft privately, then publish to your public feed in one click.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-neutral-900/10 text-xs font-semibold text-neutral-700">
                ✓
              </span>
              Built-in sharing links to announce every release instantly.
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
            <h2 className="text-2xl font-semibold text-neutral-900">Create your workspace</h2>
            <p className="text-sm text-neutral-500">
              Sign up to publish releases, manage projects, and engage your community.
            </p>
          </div>

          <div className="space-y-6">
            <RegisterForm />
          </div>

          <p className="text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-neutral-900 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

