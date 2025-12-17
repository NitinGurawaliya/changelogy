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

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch branches" }, { status: response.status });
    }

    const branches = await response.json();

    // Get default branch from repo info
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    let defaultBranch = "main";
    if (repoResponse.ok) {
      const repoData = await repoResponse.json();
      defaultBranch = repoData.default_branch || "main";
    }

    const formattedBranches = branches.map((branch: any) => ({
      name: branch.name,
      protected: branch.protected || false,
      default: branch.name === defaultBranch,
    }));

    // Sort: default branch first, then alphabetically
    formattedBranches.sort((a: any, b: any) => {
      if (a.default && !b.default) return -1;
      if (!a.default && b.default) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ branches: formattedBranches });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

