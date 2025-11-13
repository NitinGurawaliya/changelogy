import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Public projects | Changelogy",
  description: "Browse open changelogs and follow the evolution of products.",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: {
      visibility: "PUBLIC",
    },
    orderBy: { createdAt: "desc" },
    include: {
      changelogs: {
        where: {
          publishedAt: {
            not: null,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          versionLabel: true,
          versionSlug: true,
          summary: true,
          createdAt: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 sm:py-16">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 rounded-3xl border border-neutral-200/80 bg-white p-8 text-center shadow-md shadow-neutral-200/60 sm:p-10 md:flex-row md:items-end md:gap-10 md:text-left">
        <div className="space-y-4 md:space-y-5">
          <span className="inline-block rounded-full bg-neutral-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-100">
            Public changelog
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
              Product evolution in the open
            </h1>
            <p className="mx-auto max-w-2xl text-base text-neutral-600 sm:text-lg md:mx-0">
              Follow public changelogs from teams who share every launch, fix, and insight. Discover something inspiring to
              watch and learn from.
            </p>
          </div>
        </div>
        <div className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 text-left shadow-sm shadow-neutral-200/60 md:w-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">Why publish publicly?</p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li>Build trust with customers by sharing progress.</li>
            <li>Celebrate launches and acknowledge contributors.</li>
            <li>Keep stakeholders aligned without status meetings.</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto mt-12 grid w-full max-w-6xl gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-neutral-200/80 bg-white/80 p-10 text-center shadow-inner shadow-neutral-200/50 sm:p-12">
            <h2 className="text-lg font-semibold text-neutral-800">No public projects yet.</h2>
            <p className="mt-2 text-sm text-neutral-500">
              As soon as a project goes public, it will appear here automatically.
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <article
              key={project.id}
              className="group flex flex-col gap-5 rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-md shadow-neutral-200/60 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-200/80 sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-neutral-900 sm:text-2xl">{project.name}</h2>
                  {project.description ? (
                    <p className="text-sm text-neutral-500 sm:text-base">{project.description}</p>
                  ) : null}
                </div>
                <span className="inline-flex w-max items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
                  {formatDate(project.createdAt)}
                </span>
              </div>

              <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/80 p-4 sm:p-5">
                <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>Recent releases</span>
                  <span>{project.changelogs.length} updates</span>
                </div>
                {project.changelogs.length === 0 ? (
                  <p className="mt-4 text-sm text-neutral-500">No public releases have been published yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                    {project.changelogs.map((changelog) => (
                      <li
                        key={changelog.id}
                        className="rounded-2xl border border-transparent px-4 py-2 transition hover:border-neutral-200 hover:bg-white/70"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Link
                            href={`/projects/${project.slug}/versions/${changelog.versionSlug}`}
                            className="font-semibold text-neutral-800 underline-offset-4 hover:underline"
                          >
                            {changelog.versionLabel}
                          </Link>
                          <span className="text-xs text-neutral-400">{formatDate(changelog.createdAt)}</span>
                        </div>
                        {changelog.summary ? (
                          <p className="mt-1 text-xs text-neutral-500">{changelog.summary}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                href={`/projects/${project.slug}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:text-neutral-900 sm:w-auto"
              >
                View project homepage
              </Link>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

