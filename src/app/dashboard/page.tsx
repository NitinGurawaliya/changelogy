import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderGit2, Rocket, FileClock, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProjectModal, CreateVersionModal } from "@/components/dashboard/dashboard-modals";

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
    <div className="flex flex-col gap-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm shadow-neutral-200/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total projects</CardTitle>
            <FolderGit2 className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{totalProjects}</p>
            <CardDescription className="mt-2 text-sm text-neutral-500">Across your product portfolio</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm shadow-neutral-200/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Published releases</CardTitle>
            <Rocket className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{publishedCount}</p>
            <CardDescription className="mt-2 text-sm text-neutral-500">Live on the public changelog</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm shadow-neutral-200/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Draft notes</CardTitle>
            <FileClock className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{draftCount}</p>
            <CardDescription className="mt-2 text-sm text-neutral-500">Ready but not yet published</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm shadow-neutral-200/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total releases</CardTitle>
            <History className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{totalReleases}</p>
            <CardDescription className="mt-2 text-sm text-neutral-500">
              Updates recorded across all changelogs
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-md shadow-neutral-200/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 className="text-2xl font-semibold text-neutral-900">Launch a project space</h2>
            <p className="text-sm text-neutral-500">
              Create a dedicated dashboard, capture version names, and publish updates in minutes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CreateProjectModal triggerLabel="Create project" size="md" />
            <Link
              href="/projects"
              className="text-sm font-semibold text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
            >
              View public gallery
            </Link>
          </div>
        </div>
        <div className="mt-8 grid gap-4 text-sm text-neutral-600 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/70 p-4">
            <p className="font-semibold text-neutral-800">Clear version history</p>
            <p className="mt-2 text-xs text-neutral-500">
              Every release captures a version label so your timeline stays readable.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/70 p-4">
            <p className="font-semibold text-neutral-800">Instant public pages</p>
            <p className="mt-2 text-xs text-neutral-500">
              Publish a shareable changelog the moment you mark a release as live.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/70 p-4">
            <p className="font-semibold text-neutral-800">Private drafts</p>
            <p className="mt-2 text-xs text-neutral-500">
              Prep updates in advance and polish them with your team before shipping.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Your projects</h2>
            <p className="text-sm text-neutral-500">
              Review changelog status, open versions, and create precise release notes.
            </p>
          </div>
          {projects.length > 0 ? (
            <CreateProjectModal triggerLabel="New project" buttonVariant="outline" size="sm" />
          ) : null}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200/90 bg-white/80 p-12 text-center shadow-inner shadow-neutral-200/40">
            <h3 className="text-lg font-semibold text-neutral-800">No projects yet</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Spin up a project to unlock a dashboard, version history, and public pages.
            </p>
            <div className="mt-6 flex justify-center">
              <CreateProjectModal triggerLabel="Create your first project" size="md" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="flex h-full flex-col rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-md shadow-neutral-200/70 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-200/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-neutral-900">{project.name}</h3>
                    {project.description ? (
                      <p className="text-sm text-neutral-500">{project.description}</p>
                    ) : (
                      <p className="text-sm text-neutral-400">No description added yet.</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs text-neutral-500">
                    <span>Created {formatDate(project.createdAt)}</span>
                    <CreateVersionModal
                      projectId={project.id}
                      projectSlug={project.slug}
                      projectName={project.name}
                      triggerVariant="outline"
                      triggerLabel="Add release"
                      size="sm"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    <span>Recent releases</span>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
                    >
                      Project page
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
                          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-neutral-800">
                            <span>{entry.versionLabel}</span>
                            <span className="text-xs font-normal text-neutral-400">
                              {entry.publishedAt ? "Published" : "Draft"} • {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          {entry.summary ? (
                            <p className="mt-1 text-xs text-neutral-500">{entry.summary}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-neutral-600">
                            <Link
                              href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                              className="underline-offset-4 hover:underline"
                            >
                              View version
                            </Link>
                            {!entry.publishedAt ? (
                              <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-100">
                                Draft
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-neutral-600">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="rounded-full border border-neutral-200 px-3 py-1 hover:border-neutral-300 hover:text-neutral-900"
                    >
                      View public changelog
                    </Link>
                    {project.changelogs.length > 0 ? (
                      <Link
                        href={`/projects/${project.slug}/versions/${project.changelogs[0]?.versionSlug ?? ""}`}
                        className="rounded-full border border-neutral-200 px-3 py-1 hover:border-neutral-300 hover:text-neutral-900"
                      >
                        Latest version
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-md shadow-neutral-200/70">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Recent activity</h2>
            <p className="text-sm text-neutral-500">Keep an eye on the latest releases across all projects.</p>
          </div>
          <Link
            href="/projects"
            className="text-sm font-semibold text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
          >
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
                className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-4 shadow-sm shadow-neutral-200/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    {entry.project.name} • {entry.versionLabel}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {entry.publishedAt ? "Published" : "Draft"} • {formatDate(entry.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Link
                    href={`/projects/${entry.project.slug}/versions/${entry.versionSlug}`}
                    className="font-medium text-neutral-700 underline-offset-4 hover:underline"
                  >
                    View version
                  </Link>
                  <Link
                    href={`/projects/${entry.project.slug}`}
                    className="text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
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
