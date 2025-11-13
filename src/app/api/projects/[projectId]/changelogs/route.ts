import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { buildSummaryFromContent, generateUniqueVersionSlug } from "@/lib/projects";
import { cleanChangelogText } from "@/lib/clean-changelog";

const changelogPayloadSchema = z.object({
  versionLabel: z.string().min(1).max(60),
  content: z.string().min(10),
  publish: z.boolean().optional(),
});

async function requireUserId() {
  const session = await getCurrentSession();
  return session?.user?.id ?? null;
}

export async function GET(_request: Request, { params }: { params: { projectId: string } }) {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: params.projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      changelogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function POST(request: Request, { params }: { params: { projectId: string } }) {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: params.projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const payload = await request.json();
  const parsed = changelogPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { versionLabel, content, publish } = parsed.data;
  const cleanedContent = cleanChangelogText(content);

  if (!cleanedContent) {
    return NextResponse.json({ error: "Content cannot be empty." }, { status: 400 });
  }

  const versionSlug = await generateUniqueVersionSlug(project.id, versionLabel);
  const summary = buildSummaryFromContent(cleanedContent);

  const changelog = await prisma.changelog.create({
    data: {
      projectId: project.id,
      createdById: userId,
      versionLabel,
      versionSlug,
      title: versionLabel,
      summary: summary.length > 0 ? summary : null,
      content: cleanedContent,
      publishedAt: publish ? new Date() : null,
    },
  });

  return NextResponse.json({ changelog, project }, { status: 201 });
}

