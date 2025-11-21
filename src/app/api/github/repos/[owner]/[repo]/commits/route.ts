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

async function resolveParams(params: Promise<{ owner: string; repo: string }>) {
  const resolved = await params;

  if (!resolved?.owner || !resolved?.repo) {
    throw new Error("Invalid parameters");
  }

  return resolved;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ owner: string; repo: string }> },
) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getGitHubAccessToken(session.user.id);

  if (!accessToken) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 403 });
  }

  try {
    const { owner, repo } = await resolveParams(context.params);
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch") || "main";
    const perPage = parseInt(searchParams.get("per_page") || "100", 10);

    // First, get the default branch if not provided
    let branchToUse = branch;
    if (branch === "main") {
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        branchToUse = repoData.default_branch || "main";
      }
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branchToUse}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch commits" }, { status: response.status });
    }

    const commits = await response.json();

    const formattedCommits = commits.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date,
      },
      url: commit.html_url,
      date: commit.commit.committer.date,
    }));

    return NextResponse.json({ commits: formattedCommits, branch: branchToUse });
  } catch (error) {
    console.error("Error fetching GitHub commits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

