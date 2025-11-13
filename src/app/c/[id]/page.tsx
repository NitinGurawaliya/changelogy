import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { markdownComponents } from "@/components/changelog-markdown";

type ChangelogPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getParams(params: ChangelogPageProps["params"]) {
  const resolved = await params;

  if (!resolved?.id) {
    notFound();
  }

  return resolved;
}

type ChangelogRecord = {
  id: string;
  productName: string;
  text: string;
  createdAt: Date;
  version: string;
};

async function getChangelog(id: string) {
  return prisma.changelog.findUnique({
    where: { id },
  }) as Promise<ChangelogRecord | null>;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: ChangelogPageProps): Promise<Metadata> {
  const { id } = await getParams(params);
  const changelog = await getChangelog(id);

  if (!changelog) {
    return {
      title: "Changelog not found | Changelogy",
      description: "The changelog you are looking for does not exist.",
    };
  }

  const baseTitle = `${changelog.productName} ${changelog.version} updates`;
  const baseUrl = getBaseUrl();
  const publicUrl = `${baseUrl}/c/${changelog.id}`;
  const description = changelog.text.slice(0, 140);

  return {
    title: `${baseTitle} | Changelogy`,
    description,
    alternates: {
      canonical: publicUrl,
    },
    openGraph: {
      title: `${baseTitle} | Changelogy`,
      description,
      url: publicUrl,
    },
    twitter: {
      card: "summary",
      title: `${baseTitle} | Changelogy`,
      description,
    },
  };
}

export default async function ChangelogPage({ params }: ChangelogPageProps) {
  const { id } = await getParams(params);
  const changelog = await getChangelog(id);

  if (!changelog) {
    notFound();
  }

  const formattedDate = changelog.createdAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-neutral-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-neutral-300/30 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-20">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/80 p-8 shadow-xl shadow-neutral-200/50 backdrop-blur">
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-neutral-100/60 blur-2xl" />
          <span className="inline-flex items-center rounded-full bg-neutral-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-100">
            v{changelog.version}
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900">
            {changelog.productName}
          </h1>
          <p className="mt-4 max-w-xl text-base text-neutral-500">
            A polished rundown of what&apos;s new and improved. Share it with your users to keep them in the loop.
          </p>
          <p className="mt-6 text-sm text-neutral-400">
            Published on{" "}
            <time dateTime={changelog.createdAt.toISOString()} className="font-medium text-neutral-600">
              {formattedDate}
            </time>
          </p>
        </section>

        <article className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/90 p-10 shadow-lg shadow-neutral-200/60 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-neutral-100/70 to-transparent" />
          <div className="relative z-10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {changelog.text}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </main>
  );
}
