import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";
import { CreateProjectModal } from "@/components/dashboard/dashboard-modals";

const navigationLinks = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "All of your product projects and releases",
  },
  {
    href: "/dashboard#new-project",
    label: "New project",
    description: "Spin up a fresh changelog space instantly",
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-100">
      <aside className="hidden h-full w-72 flex-shrink-0 flex-col border-r border-neutral-200/80 bg-white/90 px-6 py-6 shadow-sm shadow-neutral-200/80 backdrop-blur lg:flex">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-semibold text-neutral-900">
            Changelogy
          </Link>
          <span className="rounded-full border border-neutral-200/80 px-2 py-1 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
            Beta
          </span>
        </div>

        <nav className="mt-8 flex-1 space-y-3 overflow-y-auto pr-1">
          {navigationLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-neutral-200 hover:bg-neutral-100/70"
            >
              <div className="text-sm font-semibold text-neutral-900">{item.label}</div>
              <p className="mt-1 text-xs text-neutral-500">{item.description}</p>
            </Link>
          ))}
        </nav>

        <div className="space-y-4 border-t border-neutral-200/70 pt-6">
          <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 text-sm shadow-inner shadow-neutral-200/50">
            <p className="font-medium text-neutral-700">{session.user.email ?? "Your account"}</p>
            <p className="mt-1 text-xs text-neutral-500">
              Keep your team aligned with updates. Create a dedicated changelog for every project.
            </p>
          </div>
          <SignOutButton variant="outline" className="w-full justify-center">
            Sign out
          </SignOutButton>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-neutral-200/70 bg-white/85 px-4 shadow-sm shadow-neutral-200/60 backdrop-blur sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 sm:text-xl">Dashboard</h1>
            <p className="hidden text-xs text-neutral-500 sm:block">
              Track projects, ship releases, and keep your customers informed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full px-4 text-xs font-semibold uppercase tracking-widest text-neutral-600",
              )}
            >
              Gallery
            </Link>
            <CreateProjectModal />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

