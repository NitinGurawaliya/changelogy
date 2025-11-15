"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { cleanChangelogText } from "@/lib/clean-changelog";
import { buildSummaryFromContent, generateUniqueProjectSlug, generateUniqueVersionSlug } from "@/lib/projects";
import { fetchSiteBranding, normalizeWebsiteUrl } from "@/lib/site-metadata";
import {
  type ProjectActionState,
  type ChangelogActionState,
  initialProjectActionState,
  initialChangelogActionState,
} from "./action-state";

const projectSchema = z.object({
  name: z.string().min(2, "Name is too short.").max(80, "Name cannot exceed 80 characters."),
  description: z.string().max(500, "Description can be at most 500 characters.").optional().or(z.literal("")),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
  websiteUrl: z
    .string()
    .min(1, "Website URL is required.")
    .transform((value) => value.trim())
    .refine((value) => {
      try {
        normalizeWebsiteUrl(value);
        return true;
      } catch {
        return false;
      }
    }, "Please provide a valid website URL.")
    .transform((value) => normalizeWebsiteUrl(value)),
});

const changelogSchema = z.object({
  projectId: z.string().cuid(),
  versionLabel: z.string().min(1, "Version label is required.").max(60, "Version label cannot exceed 60 characters."),
  content: z.string().min(10, "Provide at least 10 characters of detail."),
  publish: z.boolean().optional(),
});

async function ensureAuthenticatedUser() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function createProjectAction(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const userId = await ensureAuthenticatedUser();
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    visibility: formData.get("visibility"),
    websiteUrl: formData.get("websiteUrl"),
  });

  if (!parsed.success) {
    const error = parsed.error.flatten().formErrors.join("\n") || "Project could not be created.";
    return { status: "error", message: error };
  }

  const { name, description, visibility, websiteUrl } = parsed.data;
  const slug = await generateUniqueProjectSlug(userId, name);

  const existingProject = await prisma.project.findFirst({
    where: {
      ownerId: userId,
      name,
    },
    select: { id: true },
  });

  if (existingProject) {
    return {
      status: "error",
      message: "You already have a project with this name. Please choose another name.",
    };
  }

  let resolvedWebsiteUrl = websiteUrl;
  let projectLogoUrl: string | null = null;

  try {
    const branding = await fetchSiteBranding(websiteUrl);
    resolvedWebsiteUrl = branding.websiteUrl || websiteUrl;
    projectLogoUrl = branding.logoUrl ?? null;
  } catch (error) {
    console.warn("Failed to fetch site branding for project:", websiteUrl, error);
  }

  const project = await prisma.project.create({
    data: {
      name,
      slug,
      description: description?.trim() ? description.trim() : null,
      visibility: visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
      ownerId: userId,
      websiteUrl: resolvedWebsiteUrl,
      logoUrl: projectLogoUrl,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.slug}`);

  return {
    status: "success",
    message: "Project created successfully.",
    slug: project.slug,
  };
}

export async function createChangelogAction(
  _prevState: ChangelogActionState,
  formData: FormData,
): Promise<ChangelogActionState> {
  const userId = await ensureAuthenticatedUser();
  const parsed = changelogSchema.safeParse({
    projectId: formData.get("projectId"),
    versionLabel: formData.get("versionLabel"),
    content: formData.get("content"),
    publish: formData.get("publish") === "on",
  });

  if (!parsed.success) {
    const error = parsed.error.flatten().formErrors.join("\n") || "Changelog could not be created.";
    return { status: "error", message: error };
  }

  const { projectId, versionLabel, content, publish } = parsed.data;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!project) {
    return {
      status: "error",
      message: "Project not found or you do not have permission to modify it.",
    };
  }

  const cleanedContent = cleanChangelogText(content);

  if (!cleanedContent) {
    return {
      status: "error",
      message: "Content cannot be empty.",
    };
  }

  const versionSlug = await generateUniqueVersionSlug(project.id, versionLabel);
  const summary = buildSummaryFromContent(cleanedContent);

  await prisma.changelog.create({
    data: {
      projectId: project.id,
      createdById: userId,
      versionLabel,
      versionSlug,
      title: versionLabel.trim(),
      summary: summary.length > 0 ? summary : null,
      content: cleanedContent,
      publishedAt: publish ? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath(`/projects/${project.slug}/versions/${versionSlug}`);

  return {
    status: "success",
    message: "New version is ready.",
    projectSlug: project.slug,
    versionSlug,
  };
}

