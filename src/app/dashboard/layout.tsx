import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderPlus, Github } from "lucide-react";

const navigationLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview of all projects",
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50">
      <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6 lg:flex">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-semibold">
              C
            </div>
            <span className="text-lg font-semibold text-neutral-900">Changelogy</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {navigationLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-neutral-200 pt-6">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-700">{session.user.name || "User"}</p>
            <p className="mt-0.5 text-xs text-neutral-500 truncate">{session.user.email}</p>
          </div>
          <SignOutButton variant="outline" className="w-full justify-start">
            Sign out
          </SignOutButton>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
          <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
