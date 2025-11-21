"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { createChangelogAction } from "@/app/dashboard/actions";
import { initialChangelogActionState } from "@/app/dashboard/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GitHubCommitsSelector } from "./github-commits-selector";
import { Github, FileText } from "lucide-react";

type CreateVersionFormProps = {
  projectId: string;
  projectSlug: string;
  projectName: string;
  githubRepoId?: string | null;
  githubRepoUrl?: string | null;
  onSuccess?: (payload: { versionSlug: string }) => void;
};

type VersionSource = "manual" | "github";

export function CreateVersionForm({
  projectId,
  projectSlug,
  projectName,
  githubRepoId,
  githubRepoUrl,
  onSuccess,
}: CreateVersionFormProps) {
  const [source, setSource] = useState<VersionSource>(githubRepoId ? "github" : "manual");
  const [state, formAction] = useActionState(createChangelogAction, initialChangelogActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && state.projectSlug === projectSlug && state.versionSlug) {
      formRef.current?.reset();
      onSuccess?.({ versionSlug: state.versionSlug });
    }
  }, [onSuccess, projectSlug, state]);

  const hasGitHubRepo = !!githubRepoId && !!githubRepoUrl;
  const repoInfo = githubRepoUrl
    ? {
        id: parseInt(githubRepoId || "0"),
        full_name: githubRepoUrl.split("github.com/")[1]?.replace(".git", "") || "",
        owner: githubRepoUrl.split("github.com/")[1]?.split("/")[0] || "",
        name: githubRepoUrl.split("github.com/")[1]?.split("/")[1]?.replace(".git", "") || "",
        description: null,
        html_url: githubRepoUrl,
        private: false,
        default_branch: "main",
        isLinked: true,
      }
    : null;

  if (source === "github" && hasGitHubRepo && repoInfo) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white border border-blue-200">
                <Github className="size-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">GitHub Repository</p>
                <p className="text-xs text-neutral-600">{repoInfo.full_name}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSource("manual")}
              className="rounded-lg"
            >
              Switch to Manual
            </Button>
          </div>
        </div>
        <GitHubCommitsSelector
          repo={repoInfo}
          projectId={projectId}
          onSuccess={(payload?: { versionSlug?: string }) => {
            if (payload?.versionSlug) {
              onSuccess?.({ versionSlug: payload.versionSlug });
            } else {
              onSuccess?.({ versionSlug: "" });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {hasGitHubRepo && (
        <div className="rounded-lg border-2 border-neutral-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white border border-neutral-200">
                <Github className="size-5 text-neutral-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">GitHub repository connected</p>
                <p className="text-xs text-neutral-600">{repoInfo?.full_name}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSource("github")}
              className="rounded-lg"
            >
              Use GitHub Commits
            </Button>
          </div>
        </div>
      )}

        <div className="border-t border-neutral-200 pt-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100">
              <FileText className="size-4 text-purple-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Manual Entry</h3>
              <p className="text-xs text-neutral-500">Write your changelog in Markdown format</p>
            </div>
          </div>
        </div>

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

        <Button type="submit" className="w-full rounded-lg">
          Ship release for {projectName}
        </Button>
      </form>
    </div>
  );
}
