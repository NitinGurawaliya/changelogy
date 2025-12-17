"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { GitHubProjectForm } from "./github-project-form";
import { GitHubCommitsSelector } from "./github-commits-selector";
import { GitHubConnection } from "./github-connection";
import { Github, Loader2, Plus } from "lucide-react";

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

export function GitHubRepoModalButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"repos" | "project" | "commits">("repos");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (open) {
      checkConnectionAndFetchRepos();
    }
  }, [open]);

  const checkConnectionAndFetchRepos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/github/repos");
      if (response.ok) {
        setIsConnected(true);
        const data = await response.json();
        setRepos(data.repos || []);
      } else if (response.status === 403) {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = (repo: Repo) => {
    setSelectedRepo(repo);
    setStep("project");
  };

  const handleProjectCreated = (projectId: string) => {
    setCreatedProjectId(projectId);
    setStep("commits");
  };

  const handleSuccess = () => {
    setOpen(false);
    setStep("repos");
    setSelectedRepo(null);
    setCreatedProjectId(undefined);
  };

  const handleBack = () => {
    if (step === "commits") {
      setStep("project");
      setCreatedProjectId(undefined);
    } else if (step === "project") {
      setStep("repos");
      setSelectedRepo(null);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="rounded-full px-5 shadow-sm shadow-neutral-900/10"
      >
        <Plus className="mr-2 size-4" />
        New Project
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={
          step === "repos"
            ? "Select GitHub Repository"
            : step === "project"
              ? "Create Project from GitHub Repo"
              : "Select Commits for Changelog"
        }
        description={
          step === "repos"
            ? "Choose a GitHub repository to create a project and generate changelogs"
            : step === "project"
              ? "Create a new project linked to this GitHub repository"
              : "Select commits to include in your changelog"
        }
        size="lg"
      >
        {step === "repos" && (
          <div className="space-y-4">
            {!isConnected && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800 mb-3">
                  Connect your GitHub account to select repositories
                </p>
                <GitHubConnection onConnectionChange={(connected) => {
                  setIsConnected(connected);
                  if (connected) {
                    checkConnectionAndFetchRepos();
                  }
                }} />
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-neutral-400" />
              </div>
            ) : !isConnected ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                <p className="text-sm text-neutral-600">
                  Please connect GitHub to continue
                </p>
              </div>
            ) : repos.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                <p className="text-sm text-neutral-600">No repositories found</p>
              </div>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {repos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleRepoSelect(repo)}
                    className="w-full text-left rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Github className="size-5 shrink-0 text-neutral-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{repo.name}</p>
                          <p className="text-xs text-neutral-500 truncate">{repo.full_name}</p>
                        </div>
                      </div>
                      {repo.isLinked && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                          Linked
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "project" && selectedRepo && (
          <GitHubProjectForm repo={selectedRepo} onSuccess={handleProjectCreated} />
        )}

        {step === "commits" && selectedRepo && (
          <GitHubCommitsSelector
            repo={selectedRepo}
            projectId={createdProjectId}
            onSuccess={handleSuccess}
            onBack={handleBack}
          />
        )}
      </Modal>
    </>
  );
}

