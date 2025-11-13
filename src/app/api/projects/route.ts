import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { generateUniqueProjectSlug } from "@/lib/projects";

const projectPayloadSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
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

  const { name, description, visibility } = parsed.data;
  const slug = await generateUniqueProjectSlug(userId, name);

  const project = await prisma.project.create({
    data: {
      name,
      slug,
      description: description?.trim() ? description.trim() : null,
      visibility: visibility ?? "PRIVATE",
      ownerId: userId,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}

