import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderGit2, Rocket, FileClock, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateProjectForm } from "@/components/dashboard/create-project-form";
import { CreateVersionForm } from "@/components/dashboard/create-version-form";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function Dashboard() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [projects, publishedCount, draftCount, recentChangelogs] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        changelogs: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            versionLabel: true,
            versionSlug: true,
            summary: true,
            createdAt: true,
            publishedAt: true,
          },
        },
      },
    }),
    prisma.changelog.count({
      where: {
        project: { ownerId: userId },
        publishedAt: { not: null },
      },
    }),
    prisma.changelog.count({
      where: {
        project: { ownerId: userId },
        publishedAt: null,
      },
    }),
    prisma.changelog.findMany({
      where: {
        project: { ownerId: userId },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        versionLabel: true,
        versionSlug: true,
        createdAt: true,
        publishedAt: true,
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  const totalProjects = projects.length;
  const totalReleases = publishedCount + draftCount;

  return (
    <div className="space-y-12">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-200/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-500">Total projects</CardTitle>
            <FolderGit2 className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{totalProjects}</p>
            <CardDescription className="mt-1">Across your product portfolio</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-200/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-500">Published releases</CardTitle>
            <Rocket className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{publishedCount}</p>
            <CardDescription className="mt-1">Live on the public changelog</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-200/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-500">Draft notes</CardTitle>
            <FileClock className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{draftCount}</p>
            <CardDescription className="mt-1">Ready but not yet published</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-200/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-500">Total releases</CardTitle>
            <History className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{totalReleases}</p>
            <CardDescription className="mt-1">Updates recorded across changelogs</CardDescription>
          </CardContent>
        </Card>
      </section>

      <section
        id="new-project"
        className="rounded-3xl border border-neutral-200/80 bg-white/90 p-8 shadow-lg shadow-neutral-200/50"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 className="text-2xl font-semibold text-neutral-900">Start a new project</h2>
            <p className="text-sm text-neutral-500">
              Pick a name, add context, and your changelog homepage is ready to share.
            </p>
          </div>
          <div>
            <Link href="/projects" className="text-sm font-medium text-neutral-600 underline-offset-4 hover:underline">
              Browse the public gallery
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <CreateProjectForm />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Your projects</h2>
            <p className="text-sm text-neutral-500">Dedicated changelogs, latest releases, and quick actions.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="#new-project">New project</Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200/90 bg-white/80 p-12 text-center shadow-inner shadow-neutral-200/40">
            <h3 className="text-lg font-semibold text-neutral-800">No projects yet</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Get started by creating your first changelog. Its status will appear here once it exists.
            </p>
            <Button asChild className="mt-6 rounded-full px-6">
              <Link href="#new-project">Create your first project</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="border-neutral-200/80 bg-white/80 shadow-md shadow-neutral-200/50 transition-shadow hover:shadow-lg hover:shadow-neutral-200/70"
              >
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-neutral-900">{project.name}</span>
                      <span className="text-xs font-medium text-neutral-400">{formatDate(project.createdAt)}</span>
                    </CardTitle>
                    {project.description ? (
                      <CardDescription className="mt-1 text-sm text-neutral-500">{project.description}</CardDescription>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Recent releases</span>
                      <Link
                        href={`/projects/${project.slug}`}
                        className="font-semibold text-neutral-800 underline-offset-4 hover:underline"
                      >
                        View public changelog
                      </Link>
                    </div>
                    {project.changelogs.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-4 py-6 text-center text-sm text-neutral-500">
                        No releases yet—add your first update.
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {project.changelogs.map((entry) => (
                          <li
                            key={entry.id}
                            className="rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-3 shadow-sm shadow-neutral-200/50"
                          >
                            <div className="flex items-center justify-between text-sm font-medium text-neutral-800">
                              <span>{entry.versionLabel}</span>
                              <span className="text-xs text-neutral-400">
                                {entry.publishedAt ? "Published" : "Draft"} • {formatDate(entry.createdAt)}
                              </span>
                            </div>
                            {entry.summary ? (
                              <p className="mt-1 text-xs text-neutral-500">{entry.summary}</p>
                            ) : null}
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              <Link
                                href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                                className="font-semibold text-neutral-700 underline-offset-4 hover:underline"
                              >
                                View version page
                              </Link>
                              {entry.publishedAt ? null : (
                                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-100">
                                  Draft
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <CreateVersionForm
                    projectId={project.id}
                    projectSlug={project.slug}
                    projectName={project.name}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200/80 bg-white/90 p-8 shadow-lg shadow-neutral-200/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Recent activity</h2>
            <p className="text-sm text-neutral-500">A quick snapshot of your release history.</p>
          </div>
          <Link href="/projects" className="text-sm font-medium text-neutral-600 underline-offset-4 hover:underline">
            Browse public changelog
          </Link>
        </div>

        {recentChangelogs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
            No release activity yet. Ship a version and it will appear here.
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {recentChangelogs.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-4 shadow-sm shadow-neutral-200/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    {entry.project.name} • {entry.versionLabel}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {entry.publishedAt ? "Published" : "Draft"} • {formatDate(entry.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/projects/${entry.project.slug}/versions/${entry.versionSlug}`}
                    className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline"
                  >
                    View version
                  </Link>
                  <Link
                    href={`/projects/${entry.project.slug}`}
                    className="text-sm text-neutral-500 underline-offset-4 hover:underline"
                  >
                    Project home
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
