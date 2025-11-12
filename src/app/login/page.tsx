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
    <main className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-white via-white to-neutral-100 px-6 py-24">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white/80 p-10 shadow-lg shadow-neutral-200/60 backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-neutral-900">दोबारा स्वागत है 👋</h1>
          <p className="text-sm text-neutral-500">अपने अकाउंट से साइन इन करें और अपने प्रोडक्ट अपडेट्स को मैनेज करें।</p>
        </div>

        <div className="mt-10">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          नया हैं?{" "}
          <Link href="/register" className="font-medium text-neutral-900 underline-offset-4 hover:underline">
            तुरंत साइन अप करें
          </Link>
        </p>
      </div>
    </main>
  );
}

