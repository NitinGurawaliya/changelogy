import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const projectId = searchParams.get("projectId");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const existingProject = await prisma.project.findFirst({
      where: {
        ownerId: session.user.id,
        slug,
        ...(projectId ? { id: { not: projectId } } : {}),
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ available: !existingProject });
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

