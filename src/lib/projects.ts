import { prisma } from "./prisma";
import { slugify } from "./slug";

export async function generateUniqueProjectSlug(ownerId: string, name: string) {
  const baseSlug = slugify(name) || "project";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.project.findFirst({
      where: {
        ownerId,
        slug,
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

export async function generateUniqueVersionSlug(projectId: string, versionLabel: string) {
  const baseSlug = slugify(versionLabel) || "version";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.changelog.findFirst({
      where: {
        projectId,
        versionSlug: slug,
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

export function buildSummaryFromContent(content: string, maxLength = 180) {
  const condensed = content.split("\n").slice(0, 3).join(" ").trim();

  if (condensed.length <= maxLength) {
    return condensed;
  }

  return `${condensed.slice(0, maxLength - 1).trimEnd()}…`;
}

