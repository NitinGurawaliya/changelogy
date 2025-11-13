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

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-neutral-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-neutral-300/30 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-20">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/80 p-8 shadow-xl shadow-neutral-200/50 backdrop-blur">
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
        </section>

        <article className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/90 p-10 shadow-lg shadow-neutral-200/60 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-neutral-100/70 to-transparent" />
          <div className="relative z-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {changelog.content}
            </ReactMarkdown>
          </div>
        </article>

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-neutral-200/80 bg-white/90 px-6 py-5 text-sm text-neutral-500 shadow-md shadow-neutral-200/60">
          <div>
            <p className="font-semibold text-neutral-700">{changelog.project.name}</p>
            <p>All of the project updates in a single place.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${changelog.project.slug}`}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
            >
              Project home
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

