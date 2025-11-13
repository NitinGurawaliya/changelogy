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
      <section className="mx-auto w-full max-w-4xl">
        <div className="rounded-3xl border border-neutral-200/70 bg-white/90 p-6 shadow-lg shadow-neutral-200/60 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start">
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

              <div className="max-w-xl space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
                  <span>{project.visibility === "PUBLIC" ? "Public project" : "Private project"}</span>
                  <span className="inline-block h-1 w-1 rounded-full bg-neutral-300" />
                  <span>Since {formatDate(project.createdAt)}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{project.name}</h1>
                  <p className="mt-3 text-sm text-neutral-500 sm:text-base">
                    {project.description ?? "Follow every iteration, launch, and improvement for this product."}
                  </p>
                  {project.websiteUrl ? (
                    <Link
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
                    >
                      Visit product site
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          {/* <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <ShareLinkButton
              url={projectShareUrl}
              triggerLabel="Share project"
              triggerVariant="outline"
              triggerSize="sm"
              modalTitle="Share Project Link"
              modalDescription={`Copy or share the ${project.name} changelog homepage.`}
              shareMessage={`Follow ${project.name} updates`}
              copyButtonLabel="Copy project link"
              className="rounded-full"
            />
            <Link
              href="/projects"
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              Back to projects
            </Link>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">Latest releases below</span>
          </div> */}
        </div>
      </section>

      <section id="published-releases" className="mx-auto mt-10 w-full max-w-5xl space-y-6 sm:mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">All releases</h2>
          </div>
        </div>

        {publishedChangelogs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200/80 bg-white/80 p-8 text-center shadow-inner shadow-neutral-200/50 sm:p-12">
            <h3 className="text-lg font-semibold text-neutral-800">No public releases yet.</h3>
            <p className="mt-2 text-sm text-neutral-500">
              As soon as a release is published, it will appear right here.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {publishedChangelogs.map((entry) => {
              const publishedDate = entry.publishedAt ?? entry.createdAt;
              const preview =
                entry.summary && entry.summary.length > 140
                  ? `${entry.summary.slice(0, 137)}…`
                  : entry.summary ?? "Open to read the full release story.";

              return (
                <li key={entry.id}>
                  <Link
                    href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                    className="group block h-full rounded-2xl border border-neutral-200/80 bg-white/80 p-4 text-left shadow-sm shadow-neutral-200/50 transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/70 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-neutral-950">
                          {entry.versionLabel}
                        </h3>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500 group-hover:text-neutral-700">
                          {formatDate(publishedDate)}
                        </p>
                      </div>
                      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-xs font-semibold text-neutral-500 transition group-hover:border-neutral-300 group-hover:text-neutral-800">
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
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-900">Drafts (visible only to you)</h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {draftChangelogs.map((entry) => {
                const preview =
                  entry.summary && entry.summary.length > 120
                    ? `${entry.summary.slice(0, 117)}…`
                    : entry.summary ?? "Continue writing your notes and publish when ready.";

                return (
                  <li key={entry.id}>
                    <Link
                      href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                      className="group block h-full rounded-2xl border border-dashed border-neutral-200 bg-white/80 p-4 text-left shadow-sm transition hover:border-neutral-300 hover:shadow-md sm:p-5"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                        <span>Draft</span>
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                      <h4 className="mt-3 text-base font-semibold text-neutral-900 group-hover:text-neutral-950">
                        {entry.versionLabel}
                      </h4>
                      <p className="mt-2 text-sm text-neutral-500">{preview}</p>
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


