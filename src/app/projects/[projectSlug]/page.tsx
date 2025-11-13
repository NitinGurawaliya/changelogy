import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

type ProjectPageProps = {
  params: Promise<{ projectSlug: string }>;
};

async function resolveParams(params: ProjectPageProps["params"]) {
  const resolved = await params;

  if (!resolved?.projectSlug) {
    notFound();
  }

  return resolved;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { projectSlug } = await resolveParams(params);
  const session = await getCurrentSession();

  const project = await prisma.project.findFirst({
    where: {
      slug: projectSlug,
      OR: session?.user?.id
        ? [
            { visibility: "PUBLIC" },
            {
              ownerId: session.user.id,
            },
          ]
        : [{ visibility: "PUBLIC" }],
    },
    select: {
      name: true,
      description: true,
    },
  });

  if (!project) {
    return {
      title: "Project not found | Changelogy",
      description: "This project is unavailable or private.",
    };
  }

  return {
    title: `${project.name} changelog | Changelogy`,
    description: project.description ?? `Discover every update and release for ${project.name} in one place.`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectSlug } = await resolveParams(params);
  const session = await getCurrentSession();

  const project = await prisma.project.findFirst({
    where: {
      slug: projectSlug,
      OR: session?.user?.id
        ? [
            { visibility: "PUBLIC" },
            {
              ownerId: session.user.id,
            },
          ]
        : [{ visibility: "PUBLIC" }],
    },
    include: {
      changelogs: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          versionLabel: true,
          versionSlug: true,
          summary: true,
          createdAt: true,
          publishedAt: true,
        },
      },
      owner: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const publishedChangelogs = project.changelogs.filter((entry) => entry.publishedAt);
  const draftChangelogs = project.changelogs.filter((entry) => !entry.publishedAt);
  const isOwner = session?.user?.id === project.ownerId;
  const highlightedVersions = publishedChangelogs.slice(0, 4);
  const hasMorePublished = publishedChangelogs.length > highlightedVersions.length;

    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-16">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl border border-neutral-200/80 bg-white/90 p-10 text-left shadow-xl shadow-neutral-200/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-100">
                {project.visibility === "PUBLIC" ? "Public" : "Private"}
              </span>
              <h1 className="mt-4 text-4xl font-semibold text-neutral-900">{project.name}</h1>
              <p className="mt-2 text-sm text-neutral-500">
                {project.description ?? "All updates related to this project's evolution appear here."}
              </p>
            </div>
            <div className="text-sm text-neutral-500">
              <p>Started: {formatDate(project.createdAt)}</p>
              {project.owner?.name ? <p>Owner: {project.owner.name}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              Published updates: {publishedChangelogs.length}
            </span>
            {isOwner ? (
              <span className="rounded-full bg-neutral-100 px-3 py-1">Drafts: {draftChangelogs.length}</span>
            ) : null}
            <Link
              href="/projects"
              className="rounded-full border border-neutral-200 px-3 py-1 font-medium text-neutral-700 underline-offset-4 hover:border-neutral-300 hover:text-neutral-900 hover:underline"
            >
              Back to public projects
            </Link>
          </div>

          {highlightedVersions.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-neutral-200/70 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">Latest versions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {highlightedVersions.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                    className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
                  >
                    {entry.versionLabel}
                  </Link>
                ))}
                {hasMorePublished ? (
                  <Link
                    href="#published-releases"
                    className="inline-flex items-center rounded-full border border-dashed border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 hover:border-neutral-400 hover:text-neutral-800"
                  >
                    View all releases
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <section id="published-releases" className="mx-auto mt-12 flex w-full max-w-5xl flex-col gap-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-neutral-900">All published releases</h2>
            {publishedChangelogs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-neutral-200/80 bg-white/80 p-12 text-center shadow-inner shadow-neutral-200/50">
                <h3 className="text-lg font-semibold text-neutral-800">No public release is available yet.</h3>
                {isOwner ? (
                  <p className="mt-2 text-sm text-neutral-500">
                    Draft a version and publish it. Once live, it will appear here instantly.
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-neutral-500">
                    Please check back soon. As soon as a release is published it will be listed here.
                  </p>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                {publishedChangelogs.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-sm shadow-neutral-200/50 transition-shadow hover:shadow-md hover:shadow-neutral-200/70"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-neutral-900">{entry.versionLabel}</h3>
                        <p className="text-xs text-neutral-500">
                          Published on: {entry.publishedAt ? formatDate(entry.publishedAt) : formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <Link
                        href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                        className="inline-flex items-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
                      >
                        View release notes
                      </Link>
                    </div>
                    {entry.summary ? <p className="mt-4 text-sm text-neutral-600">{entry.summary}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isOwner && draftChangelogs.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900">Draft releases (only visible to you)</h2>
              <ul className="space-y-3">
                {draftChangelogs.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-dashed border-neutral-200/80 bg-white/90 px-4 py-4 shadow-sm shadow-neutral-200/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-neutral-800">
                      <span>{entry.versionLabel}</span>
                      <span className="text-xs text-neutral-500">Draft • {formatDate(entry.createdAt)}</span>
                    </div>
                    {entry.summary ? <p className="mt-2 text-xs text-neutral-500">{entry.summary}</p> : null}
                    <Link
                      href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                      className="mt-3 inline-flex text-xs font-medium text-neutral-600 underline-offset-4 hover:underline"
                    >
                      View draft preview
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </main>
    );
}


