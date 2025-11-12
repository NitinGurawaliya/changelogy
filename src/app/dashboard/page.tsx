import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderGit2, Rocket, FileClock, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateProjectForm } from "@/components/dashboard/create-project-form";
import { CreateVersionForm } from "@/components/dashboard/create-version-form";

function formatDate(date: Date) {
  return date.toLocaleDateString("hi-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function Dashboard() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [projects, publishedCount, draftCount, recentChangelogs] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        changelogs: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            versionLabel: true,
            versionSlug: true,
            summary: true,
            createdAt: true,
            publishedAt: true,
          },
        },
      },
    }),
    prisma.changelog.count({
      where: {
        project: { ownerId: userId },
        publishedAt: { not: null },
      },
    }),
    prisma.changelog.count({
      where: {
        project: { ownerId: userId },
        publishedAt: null,
      },
    }),
    prisma.changelog.findMany({
      where: {
        project: { ownerId: userId },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        versionLabel: true,
        versionSlug: true,
        createdAt: true,
        publishedAt: true,
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  const totalProjects = projects.length;
  const totalReleases = publishedCount + draftCount;

  return (
    <div className="space-y-12">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-200/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-500">कुल प्रोजेक्ट्स</CardTitle>
            <FolderGit2 className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{totalProjects}</p>
            <CardDescription className="mt-1">आपके प्रोडक्ट पोर्टफोलियो में</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-200/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-500">प्रकाशित रिलीज़</CardTitle>
            <Rocket className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{publishedCount}</p>
            <CardDescription className="mt-1">जनता के लिए लाइव changelog</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-200/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-500">ड्राफ्ट नोट्स</CardTitle>
            <FileClock className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{draftCount}</p>
            <CardDescription className="mt-1">तैयार लेकिन अभी प्रकाशित नहीं</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 bg-white/90 shadow-sm shadow-neutral-200/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-500">कुल रिलीज़</CardTitle>
            <History className="size-5 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-neutral-900">{totalReleases}</p>
            <CardDescription className="mt-1">आपके changelog में दर्ज अपडेट्स</CardDescription>
          </CardContent>
        </Card>
      </section>

      <section
        id="new-project"
        className="rounded-3xl border border-neutral-200/80 bg-white/90 p-8 shadow-lg shadow-neutral-200/50"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 className="text-2xl font-semibold text-neutral-900">एक नया प्रोजेक्ट शुरू करें</h2>
            <p className="text-sm text-neutral-500">
              नाम रखें, विवरण जोड़ें और तुरंत आपके changelog का होमपेज तैयार हो जाएगा।
            </p>
          </div>
          <div>
            <Link href="/projects" className="text-sm font-medium text-neutral-600 underline-offset-4 hover:underline">
              सार्वजनिक गैलरी देखें
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <CreateProjectForm />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">आपके प्रोजेक्ट्स</h2>
            <p className="text-sm text-neutral-500">व्यक्तिगत changelog, नवीनतम रिलीज़ और त्वरित क्रियाएं।</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="#new-project">नया प्रोजेक्ट</Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200/90 bg-white/80 p-12 text-center shadow-inner shadow-neutral-200/40">
            <h3 className="text-lg font-semibold text-neutral-800">अभी कोई प्रोजेक्ट नहीं</h3>
            <p className="mt-2 text-sm text-neutral-500">
              शुरू करें और अपना पहला changelog बनाएं। एक बार प्रोजेक्ट बना लेने पर यहां उसका स्टेटस दिखाई देगा।
            </p>
            <Button asChild className="mt-6 rounded-full px-6">
              <Link href="#new-project">पहला प्रोजेक्ट बनाएँ</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="border-neutral-200/80 bg-white/80 shadow-md shadow-neutral-200/50 transition-shadow hover:shadow-lg hover:shadow-neutral-200/70"
              >
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-neutral-900">{project.name}</span>
                      <span className="text-xs font-medium text-neutral-400">{formatDate(project.createdAt)}</span>
                    </CardTitle>
                    {project.description ? (
                      <CardDescription className="mt-1 text-sm text-neutral-500">{project.description}</CardDescription>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>हाल की रिलीज़</span>
                      <Link
                        href={`/projects/${project.slug}`}
                        className="font-semibold text-neutral-800 underline-offset-4 hover:underline"
                      >
                        सार्वजनिक changelog
                      </Link>
                    </div>
                    {project.changelogs.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-4 py-6 text-center text-sm text-neutral-500">
                        अभी कोई रिलीज़ नहीं — पहली अपडेट जोड़ें।
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {project.changelogs.map((entry) => (
                          <li
                            key={entry.id}
                            className="rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-3 shadow-sm shadow-neutral-200/50"
                          >
                            <div className="flex items-center justify-between text-sm font-medium text-neutral-800">
                              <span>{entry.versionLabel}</span>
                              <span className="text-xs text-neutral-400">
                                {entry.publishedAt ? "प्रकाशित" : "ड्राफ्ट"} • {formatDate(entry.createdAt)}
                              </span>
                            </div>
                            {entry.summary ? (
                              <p className="mt-1 text-xs text-neutral-500">{entry.summary}</p>
                            ) : null}
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              <Link
                                href={`/projects/${project.slug}/versions/${entry.versionSlug}`}
                                className="font-semibold text-neutral-700 underline-offset-4 hover:underline"
                              >
                                संस्करण पेज देखें
                              </Link>
                              {entry.publishedAt ? null : (
                                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-100">
                                  Draft
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <CreateVersionForm
                    projectId={project.id}
                    projectSlug={project.slug}
                    projectName={project.name}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200/80 bg-white/90 p-8 shadow-lg shadow-neutral-200/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">हाल की गतिविधि</h2>
            <p className="text-sm text-neutral-500">आपके रिलीज़ इतिहास की ताजा झलक।</p>
          </div>
          <Link href="/projects" className="text-sm font-medium text-neutral-600 underline-offset-4 hover:underline">
            सार्वजनिक changelog ब्राउज़ करें
          </Link>
        </div>

        {recentChangelogs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
            अभी कोई रिलीज़ रिकॉर्ड नहीं है। एक संस्करण तैयार करें और यहां गतिविधि दिखाई देगी।
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {recentChangelogs.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-4 shadow-sm shadow-neutral-200/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    {entry.project.name} • {entry.versionLabel}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {entry.publishedAt ? "प्रकाशित" : "ड्राफ्ट"} • {formatDate(entry.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/projects/${entry.project.slug}/versions/${entry.versionSlug}`}
                    className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline"
                  >
                    संस्करण देखें
                  </Link>
                  <Link
                    href={`/projects/${entry.project.slug}`}
                    className="text-sm text-neutral-500 underline-offset-4 hover:underline"
                  >
                    प्रोजेक्ट होम
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
