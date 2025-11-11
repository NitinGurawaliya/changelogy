import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cleanChangelogText } from "@/lib/clean-changelog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ShareModal from "../../components/share-modal";

const VERSION_SUGGESTIONS = ["3.1.0", "3.0.0", "2.9.5", "2.8.0", "2.7.2"];

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

async function createChangelog(formData: FormData) {
  "use server";

  const productName = formData.get("productName");
  const version = formData.get("version");
  const text = formData.get("text");

  if (typeof productName !== "string" || productName.trim().length === 0) {
    throw new Error("Product name is required.");
  }

  if (typeof version !== "string") {
    throw new Error("Version is required.");
  }

  const versionValue = version.trim();

  if (versionValue.length === 0) {
    throw new Error("Version is required.");
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Changelog text is required.");
  }

  const cleanedText = cleanChangelogText(text);

  if (cleanedText.length === 0) {
    throw new Error("Changelog text is required.");
  }

  const created = await prisma.changelog.create({
    data: {
      productName: productName.trim(),
      version: versionValue,
      text: cleanedText,
    } as any,
  });
  const changelog = created as unknown as { id: string; productName: string; version: string };

  redirect(`/dashboard?created=${changelog.id}`);
}

type DashboardSearchParams = {
  created?: string | string[];
};

type DashboardProps = {
  searchParams?: Promise<DashboardSearchParams>;
};

async function resolveSearchParams(searchParams: DashboardProps["searchParams"]) {
  if (!searchParams) {
    return {};
  }

  return await searchParams;
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const createdParam = resolvedSearchParams.created;
  const createdId = Array.isArray(createdParam) ? createdParam[0] : createdParam;
  const createdChangelog = createdId
    ? ((await prisma.changelog.findUnique({
        where: { id: createdId },
      })) as unknown as { id: string; productName: string; version: string } | null)
    : null;

  const baseUrl = getBaseUrl();
  const publicUrl = createdChangelog ? `${baseUrl}/c/${createdChangelog.id}` : null;

  return (
    <main className="mx-auto flex min-h-screen w-full flex-col bg-gradient-to-br from-neutral-50 via-white to-neutral-100 px-6 py-16">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <span className="rounded-full bg-neutral-900/90 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-100">
          Ship changelogs people love
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
          Turn raw release notes into a polished public changelog in seconds.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          Paste your latest product updates, choose a release version, and we&apos;ll craft a beautiful page you can
          share instantly with your users.
        </p>
      </section>

      <section className="mx-auto mt-12 grid w-full max-w-5xl gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-neutral-200/90 shadow-lg shadow-neutral-200/70">
          <CardHeader>
            <CardTitle>Launch your next release</CardTitle>
            <CardDescription>Fill in the details below and we&apos;ll do the rest.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createChangelog} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productName">Product name</Label>
                <Input
                  id="productName"
                  name="productName"
                  placeholder="Acme Docs"
                  required
                  maxLength={120}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Release version</Label>
                <Input
                  id="version"
                  name="version"
                  placeholder="e.g. 3.1.0 or Spring 2025"
                  list="version-suggestions"
                  required
                  maxLength={60}
                  className="bg-white"
                />
                <datalist id="version-suggestions">
                  {VERSION_SUGGESTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
                <p className="text-xs text-neutral-500">
                  Pick from suggestions or type your own version name.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Changelog notes</Label>
                <Textarea
                  id="text"
                  name="text"
                  placeholder="- Added workspace search\n- Improved onboarding checklist\n- Fixed invite link bug"
                  rows={10}
                  required
                  className="bg-white"
                />
                <p className="text-xs text-neutral-500">Supports Markdown — lists, headings, links, and more.</p>
              </div>
              <Button type="submit" size="lg" className="rounded-full px-8">
                Generate landing page
              </Button>
            </form>
          </CardContent>
        </Card>

        <aside className="flex flex-col justify-between gap-6 rounded-3xl border border-neutral-200/80 bg-white/80 p-8 shadow-lg shadow-neutral-200/70 backdrop-blur">
          <div className="space-y-4 text-left">
            <h2 className="text-xl font-semibold text-neutral-900">Why teams choose Changelogy</h2>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-neutral-900" />
                Lightning-fast setup with elegant defaults that match your brand.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-neutral-900" />
                Markdown support with smart formatting for clean, readable updates.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-neutral-900" />
                Share-ready landing pages for every release—no design effort required.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-neutral-900 px-6 py-5 text-neutral-100 shadow-lg shadow-neutral-900/20">
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">What&apos;s new</p>
            <p className="mt-3 text-lg font-semibold">Fresh look, richer stories</p>
            <p className="mt-2 text-sm text-neutral-200">
              We just shipped a brand new presentation layer for your public changelog—give your customers a reason to
              explore.
            </p>
          </div>
        </aside>
      </section>

      <section className="mx-auto mt-16 grid w-full max-w-5xl gap-8 rounded-3xl border border-neutral-200/80 bg-white/80 p-10 shadow-xl shadow-neutral-200/60 backdrop-blur lg:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Crafted for product teams</h3>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Keep everyone in sync and celebrate momentum with every release. Changelogy makes it effortless to share the
            story behind each update.
          </p>
        </div>
        <div className="space-y-3 text-sm text-neutral-600">
          <p className="font-semibold text-neutral-900">Built-in storytelling</p>
          <p>
            Transform bullet points into a rich narrative your customers actually want to read. Headings, lists, and
            code snippets all render beautifully.
          </p>
        </div>
        <div className="space-y-3 text-sm text-neutral-600">
          <p className="font-semibold text-neutral-900">Share anywhere</p>
          <p>
            Every release gets a dedicated URL you can share in emails, in-app announcements, and community posts without
            extra design work.
          </p>
        </div>
      </section>
      <footer className="mx-auto mt-20 flex w-full max-w-5xl flex-col items-center gap-2 rounded-3xl border border-neutral-200/70 bg-white/80 px-6 py-8 text-center text-sm text-neutral-500 shadow-md shadow-neutral-200/60 backdrop-blur">
        <p>Questions? Reach out and we&apos;ll help you launch your next changelog.</p>
        <p>
          Made with <span className="text-neutral-900">♥</span> by{" "}
          <a
            href="https://devfolio.cc/Nitin"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            Nitin
          </a>
        </p>
      </footer>

      {createdChangelog && publicUrl ? (
        <ShareModal
          version={createdChangelog.version}
          productName={createdChangelog.productName}
          publicUrl={publicUrl}
        />
      ) : null}
    </main>
  );
}
