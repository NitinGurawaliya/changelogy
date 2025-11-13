"use client";

import { useEffect, useRef, useActionState } from "react";
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
  onSuccess?: (payload: { versionSlug: string }) => void;
};

export function CreateVersionForm({ projectId, projectSlug, projectName, onSuccess }: CreateVersionFormProps) {
  const [state, formAction] = useActionState(createChangelogAction, initialChangelogActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && state.projectSlug === projectSlug && state.versionSlug) {
      formRef.current?.reset();
      onSuccess?.({ versionSlug: state.versionSlug });
    }
  }, [onSuccess, projectSlug, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
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
        <p className="text-xs text-neutral-500">
          This is how the release will appear across your project dashboard and public pages.
        </p>
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
      {state.status === "success" && state.projectSlug === projectSlug && state.versionSlug ? (
        <p className="text-sm text-emerald-500">
          Release published! Public link: /projects/{projectSlug}/versions/{state.versionSlug}
        </p>
      ) : null}

      <Button type="submit" className="w-full rounded-full px-6 sm:w-auto">
        Ship release for {projectName}
      </Button>
    </form>
  );
}
