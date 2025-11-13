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
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-neutral-100 px-6 py-16">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <span className="rounded-full bg-neutral-900/90 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-100">
          Public changelog
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
          Product evolution in the open
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          From first ideas to major milestones, explore projects that keep shipping improvements.
        </p>
      </section>

      <section className="mx-auto mt-14 grid w-full max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-neutral-200/80 bg-white/80 p-12 text-center shadow-inner shadow-neutral-200/50">
            <h2 className="text-lg font-semibold text-neutral-800">No public projects yet.</h2>
            <p className="mt-2 text-sm text-neutral-500">
              As soon as a project goes public, it will appear here automatically.
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <article
              key={project.id}
              className="group flex flex-col gap-4 rounded-3xl border border-neutral-200/80 bg-white/80 p-6 shadow-md shadow-neutral-200/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">{project.name}</h2>
                  {project.description ? (
                    <p className="mt-2 text-sm text-neutral-500">{project.description}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
                  {formatDate(project.createdAt)}
                </span>
              </div>

              <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/80 p-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  <span>Recent releases</span>
                  <span>{project.changelogs.length} updates</span>
                </div>
                {project.changelogs.length === 0 ? (
                  <p className="mt-4 text-sm text-neutral-500">No public releases have been published yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3 text-sm text-neutral-600">
                    {project.changelogs.map((changelog) => (
                      <li key={changelog.id} className="rounded-2xl border border-transparent px-4 py-2 hover:border-neutral-200">
                        <div className="flex items-center justify-between">
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
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:border-neutral-300 hover:text-neutral-900"
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

