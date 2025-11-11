import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

type ChangelogPageProps = {
  params: {
    id: string;
  };
};

async function getChangelog(id: string) {
  return prisma.changelog.findUnique({
    where: { id },
  });
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: ChangelogPageProps): Promise<Metadata> {
  const changelog = await getChangelog(params.id);

  if (!changelog) {
    return {
      title: "Changelog not found | Changelogy",
      description: "The changelog you are looking for does not exist.",
    };
  }

  const baseTitle = `${changelog.productName} updates`;
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
  const changelog = await getChangelog(params.id);

  if (!changelog) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const publicUrl = `${baseUrl}/c/${changelog.id}`;
  const shareText = `New updates shipped for ${changelog.productName}! 🚀 Check them out here: ${publicUrl}`;
  const shareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-neutral-500">Latest release</p>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
          {changelog.productName}
        </h1>
        <p className="text-sm text-neutral-500">
          Published on{" "}
          <time dateTime={changelog.createdAt.toISOString()}>
            {changelog.createdAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </p>
      </div>

      <article className="prose prose-neutral mx-auto w-full max-w-none rounded-3xl border border-neutral-200 bg-white/70 p-8 shadow-sm backdrop-blur-sm prose-headings:font-semibold prose-a:text-neutral-900 hover:prose-a:underline">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{changelog.text}</ReactMarkdown>
      </article>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-neutral-900">Share this changelog</p>
          <p className="text-sm text-neutral-500">{publicUrl}</p>
        </div>
        <Button asChild className="rounded-full px-6">
          <a href={shareHref} target="_blank" rel="noopener noreferrer">
            Share on X
          </a>
        </Button>
      </div>
    </main>
  );
}
