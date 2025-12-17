"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Link as LinkIcon, Loader2 } from "lucide-react";
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

export function GitHubReposList() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-4 py-6 text-center">
        <p className="text-sm text-neutral-500">{error}</p>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 px-4 py-6 text-center">
        <p className="text-sm text-neutral-500">No repositories found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => (
        <Card key={repo.id} className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Github className="size-4 shrink-0 text-neutral-600" />
                <CardTitle className="text-sm font-semibold text-neutral-900 truncate">{repo.name}</CardTitle>
              </div>
              {repo.isLinked && (
                <LinkIcon className="size-4 shrink-0 text-emerald-500" />
              )}
            </div>
            <CardDescription className="text-xs text-neutral-500 line-clamp-2 mt-1">
              {repo.description || "No description"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 hover:text-neutral-700 truncate"
              >
                {repo.full_name}
              </a>
              <GitHubRepoModal
                repo={repo}
                triggerLabel={repo.isLinked ? "Add Version" : "Generate Changelog"}
                triggerVariant="outline"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

