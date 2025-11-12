import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveParams(params: ProjectPageProps["params"]) {
  const resolved = await params;

  if (!resolved?.slug) {
    notFound();
  }

  return resolved;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("hi-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const session = await getCurrentSession();

  const project = await prisma.project.findFirst({
    where: {
      slug,
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
      title: "प्रोजेक्ट नहीं मिला | Changelogy",
      description: "यह प्रोजेक्ट उपलब्ध नहीं है या निजी रखा गया है।",
    };
  }

  return {
    title: `${project.name} changelog | Changelogy`,
    description:
      project.description ?? `${project.name} के सभी अपडेट्स और संस्करणों को एक ही स्थान पर खोजें।`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await resolveParams(params);
  const session = await getCurrentSession();

  const project = await prisma.project.findFirst({
    where: {
      slug,
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
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-neutral-100 px-6 py-16">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl border border-neutral-200/80 bg-white/90 p-10 text-left shadow-xl shadow-neutral-200/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-100">
              {project.visibility === "PUBLIC" ? "Public" : "Private"}
            </span>
            <h1 className="mt-4 text-4xl font-semibold text-neutral-900">{project.name}</h1>
            <p className="mt-2 text-sm text-neutral-500">
              {project.description ?? "इस प्रोजेक्ट के विकास से जुड़े सभी अपडेट्स यहां उपलब्ध हैं।"}
            </p>
          </div>
          <div className="text-sm text-neutral-500">
            <p>आरंभ: {formatDate(project.createdAt)}</p>
            {project.owner?.name ? <p>सृजक: {project.owner.name}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
          <span className="rounded-full bg-neutral-100 px-3 py-1">
            प्रकाशित अपडेट्स: {publishedChangelogs.length}
          </span>
          {isOwner ? (
            <span className="rounded-full bg-neutral-100 px-3 py-1">ड्राफ्ट: {draftChangelogs.length}</span>
          ) : null}
          <Link
            href="/dashboard"
            className="rounded-full border border-neutral-200 px-3 py-1 font-medium text-neutral-700 underline-offset-4 hover:underline"
          >
            अपना डैशबोर्ड
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-12 flex w-full max-w-5xl flex-col gap-10">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">सभी प्रकाशित रिलीज़</h2>
          {publishedChangelogs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200/80 bg-white/80 p-12 text-center shadow-inner shadow-neutral-200/50">
              <h3 className="text-lg font-semibold text-neutral-800">अभी तक कोई सार्वजनिक रिलीज़ उपलब्ध नहीं है।</h3>
              {isOwner ? (
                <p className="mt-2 text-sm text-neutral-500">
                  एक नया संस्करण तैयार करें और प्रकाशित करें। रिलीज़ के प्रकाशित होते ही वे यहाँ दिखाई देंगे।
                </p>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">
                  कृपया बाद में पुनः आएं। जैसे ही अपडेट प्रकाशित होगा, यह सूची स्वतः भर जाएगी।
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
                        प्रकाशित तिथि: {entry.publishedAt ? formatDate(entry.publishedAt) : formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                      className="inline-flex items-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
                    >
                      रिलीज़ नोट्स देखें
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
            <h2 className="text-xl font-semibold text-neutral-900">ड्राफ्ट रिलीज़ (केवल आपके लिए)</h2>
            <ul className="space-y-3">
              {draftChangelogs.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-dashed border-neutral-200/80 bg-white/90 px-4 py-4 shadow-sm shadow-neutral-200/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-neutral-800">
                    <span>{entry.versionLabel}</span>
                    <span className="text-xs text-neutral-500">ड्राफ्ट • {formatDate(entry.createdAt)}</span>
                  </div>
                  {entry.summary ? <p className="mt-2 text-xs text-neutral-500">{entry.summary}</p> : null}
                  <Link
                    href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                    className="mt-3 inline-flex text-xs font-medium text-neutral-600 underline-offset-4 hover:underline"
                  >
                    ड्राफ्ट प्रीव्यू देखें
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

