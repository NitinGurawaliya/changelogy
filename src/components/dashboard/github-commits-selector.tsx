"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Circle, Sparkles } from "lucide-react";

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

type Commit = {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  date: string;
};

type GitHubCommitsSelectorProps = {
  repo: Repo;
  projectId?: string;
  onSuccess?: (payload?: { versionSlug?: string }) => void;
  onBack?: () => void;
};

export function GitHubCommitsSelector({ repo, projectId, onSuccess, onBack }: GitHubCommitsSelectorProps) {
  const router = useRouter();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
  const [versionLabel, setVersionLabel] = useState("");
  const [publish, setPublish] = useState(true); // Default to publish
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branch, setBranch] = useState(repo.default_branch || "main");

  useEffect(() => {
    fetchCommits();
  }, [repo, branch]);

  const fetchCommits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/github/repos/${repo.owner}/${repo.name}/commits?branch=${branch}&per_page=100`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }
      const data = await response.json();
      setCommits(data.commits || []);
      if (data.branch) {
        setBranch(data.branch);
      }
    } catch (err) {
      setError("Failed to fetch commits");
    } finally {
      setLoading(false);
    }
  };

  const toggleCommit = (sha: string) => {
    const newSelected = new Set(selectedCommits);
    if (newSelected.has(sha)) {
      newSelected.delete(sha);
    } else {
      newSelected.add(sha);
    }
    setSelectedCommits(newSelected);
  };

  const handleGenerate = async () => {
    if (selectedCommits.size === 0) {
      setError("Please select at least one commit");
      return;
    }

    if (!versionLabel.trim()) {
      setError("Version label is required");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const selectedCommitData = commits.filter((c) => selectedCommits.has(c.sha));

      // Generate changelog using AI
      const changelogResponse = await fetch("/api/github/generate-changelog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commits: selectedCommitData,
          projectName: repo.name,
          versionLabel,
        }),
      });

      if (!changelogResponse.ok) {
        const errorData = await changelogResponse.json().catch(() => ({ error: "Failed to generate changelog" }));
        throw new Error(errorData.error || "Failed to generate changelog");
      }

      const { changelog, aiUsed, fallbackReason } = await changelogResponse.json();
      
      // Show warning if basic changelog was used instead of AI
      if (fallbackReason && !aiUsed) {
        console.warn("Changelog generation:", fallbackReason);
        // Show user-friendly message about AI not being used
        if (fallbackReason.includes("quota")) {
          setError(`⚠️ AI generation failed: OpenAI quota exceeded. Using basic changelog format. Please add Anthropic API key or check OpenAI billing.`);
        } else if (fallbackReason.includes("API key")) {
          setError(`⚠️ AI generation unavailable: No AI API key configured. Using basic changelog format.`);
        } else {
          setError(`⚠️ AI generation failed. Using basic changelog format.`);
        }
        // Continue with basic changelog - don't throw error
      }

      if (!projectId) {
        setError("Project ID is required");
        return;
      }

      // Create changelog version using server action
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("versionLabel", versionLabel);
      formData.append("content", changelog);
      formData.append("publish", publish ? "on" : "off");

      const { createChangelogAction } = await import("@/app/dashboard/actions");
      const result = await createChangelogAction(
        { status: "idle" },
        formData,
      );

      if (result.status === "error") {
        throw new Error(result.message);
      }

      router.refresh();
      
      if (result.status === "success" && result.versionSlug) {
        setSuccess(true);
        
        // Show success message and close modal after a short delay
        setTimeout(() => {
          onSuccess?.({ versionSlug: result.versionSlug });
        }, 2000);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate changelog");
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {onBack && (
        <Button type="button" variant="outline" onClick={onBack} className="rounded-lg">
          ← Back
        </Button>
      )}

      <div className="space-y-2">
        <Label htmlFor="versionLabel">
          Version label <span className="text-red-500">*</span>
        </Label>
        <Input
          id="versionLabel"
          value={versionLabel}
          onChange={(e) => setVersionLabel(e.target.value)}
          placeholder="e.g. 2.4.0, Spring 2025, v1.2.3"
          required
          maxLength={60}
          className={!versionLabel.trim() && selectedCommits.size > 0 ? "border-amber-300 ring-amber-200" : ""}
        />
        <p className="text-xs text-neutral-600">
          This is how the release will appear across your project dashboard and public pages.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900">Publish immediately</p>
            <p className="text-xs text-neutral-600">
              {publish
                ? "This changelog will be visible on your public project page"
                : "Save as draft - you can publish it later"}
            </p>
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Select commits ({selectedCommits.size} selected)</Label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-700"
          >
            <option value={branch}>{branch}</option>
          </select>
        </div>
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-2">
          {commits.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-500">No commits found</p>
          ) : (
            commits.map((commit) => {
              const isSelected = selectedCommits.has(commit.sha);
              const message = commit.message.split("\n")[0]; // First line only

              return (
                <div
                  key={commit.sha}
                  onClick={() => toggleCommit(commit.sha)}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    ) : (
                      <Circle className="size-5 text-neutral-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${isSelected ? "text-emerald-900" : "text-neutral-900"}`}>
                      {message}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {commit.author.name} • {new Date(commit.date).toLocaleDateString()}
                    </p>
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        {!versionLabel.trim() && selectedCommits.size > 0 && (
          <p className="text-xs text-amber-600">⚠ Please enter a version label to continue</p>
        )}
        {versionLabel.trim() && selectedCommits.size === 0 && (
          <p className="text-xs text-amber-600">⚠ Please select at least one commit to continue</p>
        )}
        <Button
          onClick={handleGenerate}
          className="w-full rounded-lg"
          disabled={generating || selectedCommits.size === 0 || !versionLabel.trim()}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {publish ? "Generating and publishing..." : "Generating changelog..."}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" />
              {publish
                ? `Generate & Publish (${selectedCommits.size} ${selectedCommits.size === 1 ? "commit" : "commits"})`
                : `Generate Changelog (${selectedCommits.size} ${selectedCommits.size === 1 ? "commit" : "commits"})`}
            </>
          )}
        </Button>
        {(selectedCommits.size === 0 || !versionLabel.trim()) && !generating && (
          <p className="text-xs text-center text-neutral-500">
            {selectedCommits.size === 0
              ? "Select commits above"
              : !versionLabel.trim()
                ? "Enter version label above"
                : ""}
          </p>
        )}
        {generating && !success && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">AI is generating your changelog...</p>
            <p className="text-xs text-blue-700 mt-1">
              Analyzing {selectedCommits.size} commit{selectedCommits.size > 1 ? "s" : ""} and creating a professional changelog.
            </p>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-900">
                {publish ? "Changelog generated and published!" : "Changelog generated successfully!"}
              </p>
            </div>
            <p className="text-xs text-emerald-700">
              {publish
                ? "Your changelog is now live on your public project page."
                : "Your changelog has been saved as a draft. You can publish it anytime."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

