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
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-neutral-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold text-neutral-900">
            Changelogy
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Welcome back</h1>
            <p className="text-sm text-neutral-600">Sign in to your account to continue managing your changelogs.</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
            <LoginForm />
          </div>

          <p className="text-center text-sm text-neutral-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-neutral-900 underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
