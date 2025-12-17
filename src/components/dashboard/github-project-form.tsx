"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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

type GitHubProjectFormProps = {
  repo: Repo;
  onSuccess?: (projectId: string) => void;
};

export function GitHubProjectForm({ repo, onSuccess }: GitHubProjectFormProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(repo.name);
  const [slug, setSlug] = useState(repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      checkSlugAvailability();
    }
  }, [slug]);

  const checkSlugAvailability = async () => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const response = await fetch(`/api/projects/slug/check?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();
      setSlugAvailable(data.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!slugAvailable) {
      setError("Please choose an available slug");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          slug,
          description: repo.description || undefined,
          websiteUrl: repo.html_url,
          githubRepoUrl: repo.html_url,
          githubRepoId: String(repo.id),
          visibility: repo.private ? "PRIVATE" : "PUBLIC",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const data = await response.json();
      router.refresh();
      onSuccess?.(data.project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="projectName">Project name</Label>
        <Input
          id="projectName"
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value);
            const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            setSlug(newSlug);
          }}
          placeholder="e.g. Nova Analytics"
          required
          maxLength={80}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Project slug</Label>
        <div className="flex items-center gap-2">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="project-slug"
            required
            pattern="[a-z0-9-]+"
          />
          {checkingSlug ? (
            <Loader2 className="size-4 animate-spin text-neutral-400" />
          ) : slugAvailable === true ? (
            <span className="text-xs text-emerald-600">Available</span>
          ) : slugAvailable === false ? (
            <span className="text-xs text-red-600">Taken</span>
          ) : null}
        </div>
        <p className="text-xs text-neutral-500">
          This will be used in your project URL: /projects/{slug || "..."}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs font-medium text-neutral-700">Linked Repository</p>
        <p className="text-xs text-neutral-500 mt-1">{repo.full_name}</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full rounded-full" disabled={loading || !slugAvailable || checkingSlug}>
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Project"
        )}
      </Button>
    </form>
  );
}

