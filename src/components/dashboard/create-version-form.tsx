"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { createChangelogAction } from "@/app/dashboard/actions";
import { initialChangelogActionState } from "@/app/dashboard/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CreateVersionFormProps = {
  projectId: string;
  projectSlug: string;
  projectName: string;
};

export function CreateVersionForm({ projectId, projectSlug, projectName }: CreateVersionFormProps) {
  const [state, formAction] = useActionState(createChangelogAction, initialChangelogActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.projectSlug === projectSlug) {
      formRef.current?.reset();
    }
  }, [projectSlug, state]);

  return (
    <div className="rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-neutral-800">Create a new release</h4>
          <p className="text-xs text-neutral-500">Write in Markdown and we will render it beautifully.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Cancel" : "Open form"}
        </Button>
      </div>

      {expanded ? (
        <form ref={formRef} action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="space-y-2">
            <Label htmlFor={`version-${projectId}`}>Version label</Label>
            <Input
              id={`version-${projectId}`}
              name="versionLabel"
              placeholder="e.g. 2.4.0, Spring 2025"
              required
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`markdown-${projectId}`}>Release notes (Markdown)</Label>
            <Textarea
              id={`markdown-${projectId}`}
              name="content"
              placeholder="- New onboarding flow\n- Improved dashboard insights\n- Notification settings update"
              rows={8}
              required
            />
            <label className="flex items-center gap-2 text-xs text-neutral-500">
              <input
                type="checkbox"
                name="publish"
                defaultChecked
                className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-800 focus:ring-neutral-400"
              />
              Publish immediately (show on public changelog)
            </label>
          </div>

          {state.status === "error" ? <p className="text-sm text-red-500">{state.message}</p> : null}
          {state.status === "success" && state.projectSlug === projectSlug ? (
            <p className="text-sm text-emerald-500">
              Release published! Public link: /projects/{projectSlug}/versions/{state.versionSlug}
            </p>
          ) : null}

          <Button type="submit" className="rounded-full px-6">
            Ship release for {projectName}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

