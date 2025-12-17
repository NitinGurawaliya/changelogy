import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderGit2, Rocket, FileClock, History, Github } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateVersionModal } from "@/components/dashboard/dashboard-modals";
import { getBaseUrl } from "@/lib/url";
import { ShareLinkButton } from "@/components/share-link-button";
import { GitHubRepoModalButton } from "@/components/dashboard/github-repo-modal-button";

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

  let projects: any[] = [];
  let publishedCount = 0;
  let draftCount = 0;
  let recentChangelogs: any[] = [];
  let dbError: string | null = null;

  try {
    [projects, publishedCount, draftCount, recentChangelogs] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        websiteUrl: true,
        logoUrl: true,
        githubRepoId: true,
        githubRepoUrl: true,
        visibility: true,
        createdAt: true,
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
  } catch (error: any) {
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      dbError = "Unable to connect to the database. Please check your database connection or try again later.";
    } else {
      dbError = "An error occurred while loading your data. Please try again.";
    }
  }

  const totalProjects = projects.length;
  const totalReleases = publishedCount + draftCount;
  const baseUrl = getBaseUrl();

  // Show error state if database connection failed
  if (dbError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 max-w-md text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Database Connection Error</h3>
          <p className="text-sm text-red-700 mb-4">{dbError}</p>
          <p className="text-xs text-red-600">
            If this issue persists, please check your database configuration or contact support.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/dashboard">Retry</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Section */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total projects</CardTitle>
            <FolderGit2 className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{totalProjects}</p>
            <CardDescription className="mt-2 text-sm text-neutral-500">Across your product portfolio</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Published releases</CardTitle>
            <Rocket className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{publishedCount}</p>
            <CardDescription className="mt-2 text-sm text-neutral-500">Live on the public changelog</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Draft notes</CardTitle>
            <FileClock className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{draftCount}</p>
            <CardDescription className="mt-2 text-sm text-neutral-500">Ready but not yet published</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-neutral-200 bg-white shadow-sm">
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

      {/* Projects Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Your projects</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Manage projects, add versions, and create release notes
            </p>
          </div>
          <GitHubRepoModalButton />
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
                <FolderGit2 className="size-6 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No projects yet</h3>
              <p className="text-sm text-neutral-600 mb-6 max-w-sm">
                Create your first project to start building beautiful changelogs for your products.
              </p>
              <GitHubRepoModalButton />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg font-semibold text-neutral-900">{project.name}</CardTitle>
                      {project.description ? (
                        <CardDescription className="text-sm line-clamp-2">{project.description}</CardDescription>
                      ) : (
                        <CardDescription className="text-sm text-neutral-400">No description</CardDescription>
                      )}
                    </div>
                    {project.githubRepoUrl && (
                      <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-100">
                        <Github className="size-4 text-neutral-600" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CreateVersionModal
                      projectId={project.id}
                      projectSlug={project.slug}
                      projectName={project.name}
                      githubRepoId={project.githubRepoId}
                      githubRepoUrl={project.githubRepoUrl}
                      triggerVariant="solid"
                      triggerLabel={project.githubRepoUrl ? "Add version" : "Add release"}
                      size="sm"
                    />
                    <ShareLinkButton
                      url={`${baseUrl}/projects/${project.slug}`}
                      triggerLabel="Share"
                      triggerVariant="outline"
                      triggerSize="sm"
                      modalTitle="Share Project Link"
                      modalDescription={`Share the ${project.name} changelog homepage.`}
                      shareMessage={`Follow ${project.name} updates on Changelogy`}
                      copyButtonLabel="Copy project link"
                      ariaLabel="Share project"
                    />
                  </div>

                  {project.changelogs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                        Recent releases
                      </p>
                      <ul className="space-y-2">
                        {project.changelogs.map((entry: {
                          id: string;
                          versionLabel: string;
                          versionSlug: string;
                          summary: string | null;
                          createdAt: Date;
                          publishedAt: Date | null;
                        }) => (
                          <li key={entry.id}>
                            <Link
                              href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm transition hover:bg-neutral-100"
                            >
                              <span className="font-medium text-neutral-900">{entry.versionLabel}</span>
                              <span className="text-xs text-neutral-500">
                                {entry.publishedAt ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Rocket className="size-3" />
                                    Published
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1">
                                    <FileClock className="size-3" />
                                    Draft
                                  </span>
                                )}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/projects/${project.slug}`}
                        className="block text-center text-xs font-medium text-neutral-600 hover:text-neutral-900"
                      >
                        View all versions →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
