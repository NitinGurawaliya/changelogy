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
      logoUrl: true,
    },
  });

  if (!project) {
    return {
      title: "Project not found | Changelogy",
      description: "This project is unavailable or private.",
    };
  }

  const metadata: Metadata = {
    title: `${project.name} changelog | Changelogy`,
    description: project.description ?? `Discover every update and release for ${project.name} in one place.`,
  };

  if (project.logoUrl) {
    metadata.icons = {
      icon: [{ url: project.logoUrl }],
      shortcut: [{ url: project.logoUrl }],
    };
  }

  return metadata;
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

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-5xl">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Logo and Date Row */}
          <div className="flex items-center gap-4">
            {project.logoUrl ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm shadow-neutral-200/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.logoUrl}
                  alt={`${project.name} logo`}
                  className="h-12 w-12 object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
              <span>{project.visibility === "PUBLIC" ? "Public project" : "Private project"}</span>
              <span className="inline-block h-1 w-1 rounded-full bg-neutral-300" />
              <span>Since {formatDate(project.createdAt)}</span>
            </div>
          </div>

          {/* Title, Description and Button */}
          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{project.name}</h1>
            <p className="text-sm text-neutral-500 sm:text-base">
              {project.description ?? "Follow every iteration, launch, and improvement for this product."}
            </p>
            {project.websiteUrl ? (
              <Link
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-neutral-400 transition hover:text-neutral-600"
              >
                Visit product site
                <span aria-hidden="true">↗</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section id="published-releases" className="mx-auto mt-10 w-full max-w-5xl space-y-6 sm:mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">All releases</h2>
          </div>
        </div>

        {publishedChangelogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
            <h3 className="text-lg font-semibold text-neutral-900">No public releases yet</h3>
            <p className="mt-2 text-sm text-neutral-600">
              As soon as a release is published, it will appear here.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedChangelogs.map((entry) => {
              const publishedDate = entry.publishedAt ?? entry.createdAt;

              return (
                <li key={entry.id}>
                  <Link
                    href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                    className="group block h-full rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-neutral-950">
                          {entry.versionLabel}
                        </h3>
                        <p className="text-xs font-medium text-neutral-600">
                          {formatDate(publishedDate)}
                        </p>
                      </div>
                      <span className="mt-1 inline-flex size-8 items-center justify-center rounded-lg border border-neutral-200 text-xs font-medium text-neutral-500 transition group-hover:border-neutral-300 group-hover:text-neutral-700">
                        →
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {isOwner && draftChangelogs.length > 0 ? (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Drafts</h3>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {draftChangelogs.map((entry) => {
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                      className="group block h-full rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-left transition hover:border-neutral-400 hover:bg-white"
                    >
                      <div className="mb-2 flex items-center justify-between text-xs font-medium text-neutral-600">
                        <span className="rounded-full bg-neutral-200 px-2 py-0.5">Draft</span>
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                      <h4 className="text-base font-semibold text-neutral-900 group-hover:text-neutral-950">
                        {entry.versionLabel}
                      </h4>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  );
}


