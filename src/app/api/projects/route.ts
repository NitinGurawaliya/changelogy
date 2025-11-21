import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { generateUniqueProjectSlug } from "@/lib/projects";

const projectPayloadSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().optional(),
  description: z.string().max(500).optional(),
  websiteUrl: z.string().url().optional(),
  githubRepoUrl: z.string().url().optional(),
  githubRepoId: z.string().optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
});

async function requireUserId() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

export async function GET() {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    include: {
      _count: {
        select: { changelogs: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = projectPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, slug: providedSlug, description, websiteUrl, githubRepoUrl, githubRepoId, visibility } = parsed.data;
  
  // Check if project with same name already exists
  const existingProject = await prisma.project.findFirst({
    where: {
      ownerId: userId,
      name,
    },
    select: { id: true },
  });

  if (existingProject) {
    return NextResponse.json(
      { error: "You already have a project with this name. Please choose another name." },
      { status: 400 }
    );
  }
  
  // Use provided slug or generate one
  const slug = await generateUniqueProjectSlug(userId, name, providedSlug);

  try {
    // Create project data with GitHub fields
    const projectData: any = {
      name,
      slug,
      description: description?.trim() ? description.trim() : null,
      websiteUrl: websiteUrl?.trim() || null,
      visibility: visibility ?? "PRIVATE",
      ownerId: userId,
    };

    // Add GitHub fields if provided
    if (githubRepoUrl) {
      projectData.githubRepoUrl = githubRepoUrl.trim();
    }
    if (githubRepoId) {
      projectData.githubRepoId = githubRepoId.trim();
    }

    const project = await prisma.project.create({
      data: projectData,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const target = error.meta?.target;
      if (target?.includes("name")) {
        return NextResponse.json(
          { error: "You already have a project with this name. Please choose another name." },
          { status: 400 }
        );
      }
      if (target?.includes("slug")) {
        return NextResponse.json(
          { error: "A project with this slug already exists. Please try again." },
          { status: 400 }
        );
      }
    }
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project. Please try again." },
      { status: 500 }
    );
  }
}

