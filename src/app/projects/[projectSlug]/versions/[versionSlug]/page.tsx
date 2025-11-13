import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { markdownComponents } from "@/components/changelog-markdown";

type VersionPageParams = Promise<{
  projectSlug: string;
  versionSlug: string;
}>;

async function resolveParams(params: VersionPageParams) {
  const resolved = await params;

  if (!resolved?.projectSlug || !resolved?.versionSlug) {
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

async function fetchChangelog(projectSlug: string, versionSlug: string) {
  return prisma.changelog.findFirst({
    where: {
      versionSlug,
      project: {
        slug: projectSlug,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          visibility: true,
          ownerId: true,
            changelogs: {
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                versionLabel: true,
                versionSlug: true,
                createdAt: true,
                publishedAt: true,
              },
            },
        },
      },
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: VersionPageParams }): Promise<Metadata> {
  const { projectSlug, versionSlug } = await resolveParams(params);
  const changelog = await fetchChangelog(projectSlug, versionSlug);

  if (!changelog) {
    return {
      title: "Release not found | Changelogy",
      description: "This version is unavailable or private.",
    };
  }

  const description = (changelog.summary ?? changelog.content.slice(0, 160)).replace(/\s+/g, " ").trim();

  return {
    title: `${changelog.project.name} — ${changelog.versionLabel}`,
    description,
    alternates: {
      canonical: `/projects/${changelog.project.slug}/versions/${changelog.versionSlug}`,
    },
  };
}

export default async function VersionPage({ params }: { params: VersionPageParams }) {
  const { projectSlug, versionSlug } = await resolveParams(params);
  const session = await getCurrentSession();
  const changelog = await fetchChangelog(projectSlug, versionSlug);

  if (!changelog) {
    notFound();
  }

  const isOwner = session?.user?.id === changelog.project.ownerId;
  const isPublished = Boolean(changelog.publishedAt);
  const isPublicProject = changelog.project.visibility === "PUBLIC";

  if (!isOwner && (!isPublished || !isPublicProject)) {
    notFound();
  }

  const publishedDate = changelog.publishedAt ?? changelog.createdAt;

  const projectChangelogList = changelog.project.changelogs ?? [];
  const siblingChangelogs = projectChangelogList.filter((entry) => {
    if (entry.id === changelog.id) {
      return false;
    }
    if (isOwner) {
      return true;
    }
    return Boolean(entry.publishedAt);
  });

  const highlightedSiblings = siblingChangelogs.slice(0, 4);
  const sidebarSiblings = siblingChangelogs.slice(0, 8);
  const hasMoreSiblings = siblingChangelogs.length > highlightedSiblings.length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-neutral-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-neutral-300/30 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-20">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/85 p-10 shadow-xl shadow-neutral-200/50 backdrop-blur">
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-neutral-100/60 blur-2xl" />
          <span className="inline-flex items-center rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-100">
            v{changelog.versionLabel}
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900">{changelog.project.name}</h1>
          <p className="mt-4 max-w-xl text-base text-neutral-500">
            {changelog.summary ?? "This release brings new capabilities and a refined experience for your users."}
          </p>
          <p className="mt-6 text-sm text-neutral-400">
            Published:
            <time dateTime={publishedDate.toISOString()} className="ml-1 font-medium text-neutral-600">
              {formatDate(publishedDate)}
            </time>
            {changelog.createdBy?.name ? (
              <span className="ml-2 text-neutral-500">• Author: {changelog.createdBy.name}</span>
            ) : null}
          </p>

          {highlightedSiblings.length > 0 ? (
            <div className="mt-8 rounded-2xl border border-neutral-200/70 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">Other versions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {highlightedSiblings.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/projects/${changelog.project.slug}/versions/${entry.versionSlug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
                  >
                    <span>{entry.versionLabel}</span>
                    {!entry.publishedAt ? (
                      <span className="rounded-full bg-neutral-900 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-neutral-100">
                        Draft
                      </span>
                    ) : null}
                  </Link>
                ))}
                {hasMoreSiblings ? (
                  <Link
                    href={`/projects/${changelog.project.slug}#published-releases`}
                    className="inline-flex items-center rounded-full border border-dashed border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 hover:border-neutral-400 hover:text-neutral-800"
                  >
                    View all releases
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/90 p-10 shadow-lg shadow-neutral-200/60 backdrop-blur-md">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-neutral-100/70 to-transparent" />
            <div className="relative z-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {changelog.content}
              </ReactMarkdown>
            </div>
          </article>

          <aside className="rounded-3xl border border-neutral-200/70 bg-white/80 p-6 shadow-md shadow-neutral-200/60">
            <h3 className="text-sm font-semibold text-neutral-900">Browse other versions</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Jump between releases without leaving the project timeline.
            </p>
            {sidebarSiblings.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-4 py-6 text-center text-xs text-neutral-500">
                No additional versions yet.
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {sidebarSiblings.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={`/projects/${changelog.project.slug}/versions/${entry.versionSlug}`}
                      className="block rounded-2xl border border-transparent bg-white px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-200 hover:bg-neutral-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{entry.versionLabel}</span>
                        <span className="text-xs font-normal text-neutral-400">
                          {entry.publishedAt
                            ? `Published ${formatDate(entry.publishedAt)}`
                            : `Draft · ${formatDate(entry.createdAt)}`}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6">
              <Link
                href={`/projects/${changelog.project.slug}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Project homepage
              </Link>
            </div>
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-neutral-200/80 bg-white/90 px-6 py-5 text-sm text-neutral-500 shadow-md shadow-neutral-200/60">
          <div>
            <p className="font-semibold text-neutral-700">{changelog.project.name}</p>
            <p>All of the project updates in a single place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/projects/${changelog.project.slug}#published-releases`}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
            >
              View all releases
            </Link>
            <Link
              href="/projects"
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
            >
              Explore more projects
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

