import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

const navigationLinks = [
  {
    href: "/dashboard",
    label: "पहल",
    description: "आपके सभी प्रोडक्ट प्रोजेक्ट और रिलीज़",
  },
  {
    href: "/dashboard#new-project",
    label: "नया प्रोजेक्ट",
    description: "तुरंत एक नया changelog स्पेस बनाएँ",
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-neutral-50">
      <aside className="hidden w-72 border-r border-neutral-200/80 bg-white/80 px-6 py-8 shadow-sm backdrop-blur lg:flex lg:flex-col">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-semibold text-neutral-900">
            Changelogy
          </Link>
          <span className="rounded-full border border-neutral-200/80 px-2.5 py-1 text-xs font-medium text-neutral-500">
            बीटा
          </span>
        </div>

        <nav className="mt-10 space-y-4">
          {navigationLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-neutral-200 hover:bg-neutral-100/70"
            >
              <div className="text-sm font-semibold text-neutral-900">{item.label}</div>
              <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 text-sm shadow-inner shadow-neutral-200/50">
            <p className="font-medium text-neutral-700">{session.user.email ?? "आपका अकाउंट"}</p>
            <p className="mt-1 text-xs text-neutral-500">
              अपनी टीम को अपडेट्स के साथ जोड़े रखें। हर प्रोजेक्ट के लिए अलग changelog बनाएं।
            </p>
          </div>
          <SignOutButton variant="outline">साइन आउट</SignOutButton>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-white/70 backdrop-blur">
          <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">डैशबोर्ड</h1>
              <p className="mt-1 text-sm text-neutral-500">
                प्रोजेक्ट्स को ट्रैक करें, रिलीज़ शिप करें, और अपने ग्राहकों को अपडेट रखें।
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/projects"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full border-dashed px-5 text-xs font-semibold uppercase tracking-widest text-neutral-600",
                )}
              >
                सार्वजनिक पेज देखें
              </Link>
              <div className="hidden md:block">
                <Link
                  href="#new-project"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "rounded-full bg-neutral-900 px-5 text-xs font-semibold uppercase tracking-widest text-neutral-100 shadow-sm shadow-neutral-800/30",
                  )}
                >
                  नया लॉन्च
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-neutral-50">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

