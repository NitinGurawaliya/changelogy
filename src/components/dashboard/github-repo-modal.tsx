"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { GitHubCommitsSelector } from "./github-commits-selector";
import { GitHubProjectForm } from "./github-project-form";
import { cn } from "@/lib/utils";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  description: string | null;
  html_url: string;
  private: boolean;
  default_branch: string;
  isLinked: boolean;
};

type GitHubRepoModalProps = {
  repo: Repo;
  triggerLabel?: string;
  triggerVariant?: "solid" | "outline";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  className?: string;
  projectId?: string; // If provided, add version to existing project
};

export function GitHubRepoModal({
  repo,
  triggerLabel = "Generate Changelog",
  triggerVariant = "solid",
  size = "sm",
  className,
  projectId,
}: GitHubRepoModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"project" | "commits">(projectId ? "commits" : "project");
  const [createdProjectId, setCreatedProjectId] = useState<string | undefined>(projectId);

  const handleProjectCreated = (projectId: string) => {
    setCreatedProjectId(projectId);
    setStep("commits");
  };

  const handleSuccess = () => {
    setOpen(false);
    setStep(projectId ? "commits" : "project");
    setCreatedProjectId(undefined);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={size}
        variant={triggerVariant === "outline" ? "outline" : "default"}
        className={cn(
          "rounded-full",
          triggerVariant === "solid" ? "shadow-sm shadow-neutral-900/10" : undefined,
          className,
        )}
      >
        {triggerLabel}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={step === "project" ? "Create Project from GitHub Repo" : "Select Commits for Changelog"}
        description={
          step === "project"
            ? "Create a new project linked to this GitHub repository"
            : "Select commits to include in your changelog"
        }
        size="lg"
      >
        {step === "project" && !projectId ? (
          <GitHubProjectForm repo={repo} onSuccess={handleProjectCreated} />
        ) : (
          <GitHubCommitsSelector
            repo={repo}
            projectId={createdProjectId || projectId}
            onSuccess={handleSuccess}
            onBack={projectId ? undefined : () => setStep("project")}
          />
        )}
      </Modal>
    </>
  );
}

