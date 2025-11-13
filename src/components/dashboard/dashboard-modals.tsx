"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CreateProjectForm } from "./create-project-form";
import { CreateVersionForm } from "./create-version-form";
import { cn } from "@/lib/utils";

type CreateProjectModalProps = {
  triggerLabel?: string;
  buttonVariant?: "solid" | "outline";
  size?: "sm" | "md";
  className?: string;
};

export function CreateProjectModal({
  triggerLabel = "New project",
  buttonVariant = "solid",
  size = "sm",
  className,
}: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={size}
        variant={buttonVariant === "outline" ? "outline" : "default"}
        className={cn(
          "rounded-full px-5",
          buttonVariant === "solid" ? "shadow-sm shadow-neutral-900/10" : undefined,
          className,
        )}
      >
        {triggerLabel}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Create a project"
        description="Set up a dedicated space for a product changelog."
        size="md"
      >
        <CreateProjectForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}

type CreateVersionModalProps = {
  projectId: string;
  projectSlug: string;
  projectName: string;
  triggerVariant?: "solid" | "outline";
  triggerLabel?: string;
  size?: "sm" | "md";
  className?: string;
};

export function CreateVersionModal({
  projectId,
  projectSlug,
  projectName,
  triggerVariant = "solid",
  triggerLabel = "New release",
  size = "sm",
  className,
}: CreateVersionModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={size}
        className={cn(
          "rounded-full",
          triggerVariant === "outline"
            ? "border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:text-neutral-900"
            : "bg-neutral-900 text-neutral-50 hover:bg-neutral-900/90",
          className,
        )}
        variant={triggerVariant === "outline" ? "outline" : "default"}
      >
        {triggerLabel}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`Ship a release for ${projectName}`}
        description="Document the updates, highlight the version name, and optionally publish it instantly."
        size="lg"
      >
        <CreateVersionForm
          projectId={projectId}
          projectSlug={projectSlug}
          projectName={projectName}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

