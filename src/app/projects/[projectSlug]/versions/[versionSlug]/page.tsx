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
          logoUrl: true,
          websiteUrl: true,
          createdAt: true,
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

  const metadata: Metadata = {
    title: `${changelog.project.name} ${changelog.versionLabel}`,
    description,
    alternates: {
      canonical: `/projects/${changelog.project.slug}/versions/${changelog.versionSlug}`,
    },
  };

  if (changelog.project.logoUrl) {
    metadata.icons = {
      icon: [{ url: changelog.project.logoUrl }],
      shortcut: [{ url: changelog.project.logoUrl }],
    };
  }

  return metadata;
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
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          
          {/* Logo and Date Row */}
          <div className="flex items-center gap-4">
            {changelog.project.logoUrl ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm shadow-neutral-200/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={changelog.project.logoUrl}
                  alt={`${changelog.project.name} logo`}
                  className="h-12 w-12 object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
              <span>{changelog.project.visibility === "PUBLIC" ? "Public project" : "Private project"}</span>
              <span className="inline-block h-1 w-1 rounded-full bg-neutral-300" />
              <span>Since {formatDate(changelog.project.createdAt)}</span>
            </div>
          </div>

          {/* Title and Description */}
          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{changelog.project.name}</h1>
            <p className="text-sm text-neutral-500 sm:text-base">
              {changelog.project.description ?? "Follow every iteration, launch, and improvement for this product."}
            </p>
            {changelog.project.websiteUrl ? (
              <Link
                href={changelog.project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-neutral-400 transition hover:text-neutral-600"
              >
                Visit product site
                <span aria-hidden="true">↗</span>
              </Link>
            ) : null}
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {changelog.content}
            </ReactMarkdown>
          </article>

          <aside className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h3 className="text-sm font-semibold text-neutral-900">Browse other versions</h3>
            <p className="mt-1 text-xs text-neutral-500">Jump between releases without leaving the project timeline.</p>
            {sidebarSiblings.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-4 py-6 text-center text-xs text-neutral-500">
                No additional versions yet.
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {sidebarSiblings.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={`/projects/${changelog.project.slug}/versions/${entry.versionSlug}`}
                      className="group block rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 transition hover:border-neutral-300 hover:bg-white"
                    >
                      <p className="text-xs font-medium text-neutral-600">
                        {entry.publishedAt ? "Published" : "Draft"}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                        {entry.versionLabel}
                      </h4>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {entry.publishedAt ? formatDate(entry.publishedAt) : formatDate(entry.createdAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6">
              <Link
                href={`/projects/${changelog.project.slug}`}
                className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                ← Back to project
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

