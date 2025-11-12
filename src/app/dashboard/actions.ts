"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { cleanChangelogText } from "@/lib/clean-changelog";
import { buildSummaryFromContent, generateUniqueProjectSlug, generateUniqueVersionSlug } from "@/lib/projects";

const projectSchema = z.object({
  name: z.string().min(2, "नाम बहुत छोटा है।").max(80, "नाम 80 अक्षरों से अधिक नहीं हो सकता।"),
  description: z.string().max(500, "विवरण 500 अक्षरों तक सीमित है।").optional().or(z.literal("")),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
});

const changelogSchema = z.object({
  projectId: z.string().cuid(),
  versionLabel: z.string().min(1, "संस्करण नाम आवश्यक है।").max(60),
  content: z.string().min(10, "कम से कम 10 अक्षर का विवरण दें।"),
  publish: z.boolean().optional(),
});

async function ensureAuthenticatedUser() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

type ProjectActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  slug?: string;
};

type ChangelogActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  projectSlug?: string;
  versionSlug?: string;
};

export const initialProjectActionState: ProjectActionState = {
  status: "idle",
};

export const initialChangelogActionState: ChangelogActionState = {
  status: "idle",
};

export async function createProjectAction(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const userId = await ensureAuthenticatedUser();
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    const error = parsed.error.flatten().formErrors.join("\n") || "प्रोजेक्ट नहीं बनाया जा सका।";
    return { status: "error", message: error };
  }

  const { name, description, visibility } = parsed.data;
  const slug = await generateUniqueProjectSlug(userId, name);

  const project = await prisma.project.create({
    data: {
      name,
      slug,
      description: description?.trim() ? description.trim() : null,
      visibility: visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
      ownerId: userId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.slug}`);

  return {
    status: "success",
    message: "प्रोजेक्ट सफलतापूर्वक बना।",
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
    const error = parsed.error.flatten().formErrors.join("\n") || "चangelog नहीं बनाया जा सका।";
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
      message: "प्रोजेक्ट नहीं मिला या आपके पास इसकी अनुमति नहीं है।",
    };
  }

  const cleanedContent = cleanChangelogText(content);

  if (!cleanedContent) {
    return {
      status: "error",
      message: "कंटेंट खाली नहीं हो सकता।",
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
    message: "नया वर्ज़न तैयार हो गया।",
    projectSlug: project.slug,
    versionSlug,
  };
}

