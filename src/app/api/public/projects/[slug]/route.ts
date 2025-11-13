import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function resolveParams(params: Promise<{ slug: string }>) {
  const resolved = await params;

  if (!resolved?.slug) {
    throw new Error("Invalid slug.");
  }

  return resolved;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  let slug: string;

  try {
    ({ slug } = await resolveParams(context.params));
  } catch {
    return NextResponse.json({ error: "Invalid project slug." }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: {
      slug,
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      changelogs: {
        where: {
          publishedAt: {
            not: null,
          },
        },
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
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

