import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "github",
    },
    select: {
      access_token: true,
    },
  });

  return account?.access_token ?? null;
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getGitHubAccessToken(session.user.id);

  if (!accessToken) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 403 });
  }

  try {
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch repositories" }, { status: response.status });
    }

    const repos = await response.json();

    // Check which repos are already linked to projects
    const linkedRepoIds = new Set(
      (
        await prisma.project.findMany({
          where: {
            ownerId: session.user.id,
            githubRepoId: { not: null },
          },
          select: {
            githubRepoId: true,
          },
        })
      )
        .map((p) => p.githubRepoId)
        .filter((id): id is string => id !== null),
    );

    const reposWithStatus = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner.login,
      description: repo.description,
      html_url: repo.html_url,
      private: repo.private,
      default_branch: repo.default_branch,
      isLinked: linkedRepoIds.has(String(repo.id)),
    }));

    return NextResponse.json({ repos: reposWithStatus });
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

