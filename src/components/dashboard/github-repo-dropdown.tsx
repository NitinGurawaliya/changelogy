"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Loader2, ChevronDown, Link as LinkIcon } from "lucide-react";
import { GitHubRepoModal } from "./github-repo-modal";

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

type GitHubRepoDropdownProps = {
  isConnected?: boolean;
};

export function GitHubRepoDropdown({ isConnected }: GitHubRepoDropdownProps = {}) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch("/api/github/repos");
        if (!response.ok) {
          if (response.status === 403) {
            setError("GitHub not connected");
          } else {
            setError("Failed to fetch repositories");
          }
          return;
        }
        const data = await response.json();
        setRepos(data.repos || []);
      } catch (err) {
        setError("Failed to fetch repositories");
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  // Always show dropdown button, even if no repos, loading, or errors

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full justify-between rounded-lg"
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          <Github className="size-4" />
          <span>
            {loading
              ? "Loading repositories..."
              : selectedRepo
                ? selectedRepo.name
                : "Select GitHub Repository"}
          </span>
        </div>
        {!loading && (
          <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
        {loading && <Loader2 className="size-4 animate-spin" />}
      </Button>

      {isOpen && !loading && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            role="presentation"
          />
          <div className="absolute z-50 mt-2 w-full rounded-lg border border-neutral-200 bg-white shadow-lg max-h-96 overflow-y-auto">
            {error ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-neutral-500">
                  {error === "GitHub not connected"
                    ? "GitHub not connected. Please connect your GitHub account."
                    : "Failed to fetch repositories"}
                </p>
              </div>
            ) : repos.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-neutral-500">No repositories found</p>
              </div>
            ) : (
              repos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => {
                  setSelectedRepo(repo);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0 ${
                  selectedRepo?.id === repo.id ? "bg-neutral-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Github className="size-4 shrink-0 text-neutral-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 truncate">{repo.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{repo.full_name}</p>
                    </div>
                  </div>
                  {repo.isLinked && (
                    <LinkIcon className="size-4 shrink-0 text-emerald-500" />
                  )}
                </div>
              </button>
              ))
            )}
          </div>
        </>
      )}

      {selectedRepo && (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Github className="size-4 text-neutral-600" />
              <span className="text-sm font-semibold text-neutral-900">{selectedRepo.name}</span>
              {selectedRepo.isLinked && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Linked
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRepo(null)}
              className="text-xs"
            >
              Change
            </Button>
          </div>
          <GitHubRepoModal
            repo={selectedRepo}
            triggerLabel={selectedRepo.isLinked ? "Add Version" : "Generate Changelog"}
            triggerVariant="solid"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

