import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { markdownComponents } from "@/components/changelog-markdown";
import { getBaseUrl } from "@/lib/url";

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

  const baseUrl = getBaseUrl();
  const projectUrl = `${baseUrl}/projects/${changelog.project.slug}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-neutral-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-neutral-300/30 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-16 sm:px-6 lg:py-20">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/85 p-8 backdrop-blur sm:p-10">
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-neutral-100/60 blur-2xl" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-neutral-100">
                  {changelog.versionLabel}
                </span>
                <time dateTime={publishedDate.toISOString()} className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">
                  {formatDate(publishedDate)}
                </time>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{changelog.project.name}</h1>
              <p className="mt-3 max-w-2xl text-sm text-neutral-500 sm:text-base">{changelog.project.description}</p>
            </div>
          </div>

          {/* {highlightedSiblings.length > 0 ? (
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
          ) : null} */}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <article className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white/90 p-6 backdrop-blur sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-neutral-100/70 to-transparent" />
            <div className="relative z-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {changelog.content}
              </ReactMarkdown>
            </div>
          </article>

          <aside className="rounded-3xl border border-neutral-200/70 bg-white/85 p-5 shadow-md shadow-neutral-200/80 backdrop-blur lg:sticky lg:top-24 lg:p-6">
            <h3 className="text-sm font-semibold text-neutral-900">Browse other versions</h3>
            <p className="mt-1 text-xs text-neutral-500">Jump between releases without leaving the project timeline.</p>
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
                      className="group block rounded-3xl border border-neutral-200/80 bg-white/90 px-4 py-3 shadow-sm shadow-neutral-200/50 transition hover:-translate-y-1 hover:border-neutral-300 hover:bg-white hover:shadow-md hover:shadow-neutral-200/70"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                        {entry.publishedAt ? "Published" : "Draft"}
                      </p>
                      <h4 className="mt-2 text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                        {entry.versionLabel}
                      </h4>
                      <p className="mt-1 text-xs text-neutral-500">
                        {entry.publishedAt ? formatDate(entry.publishedAt) : formatDate(entry.createdAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/projects/${changelog.project.slug}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Project homepage
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

