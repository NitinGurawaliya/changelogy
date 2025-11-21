"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github, CheckCircle2, XCircle } from "lucide-react";

export function GitHubConnection() {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkConnection() {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const response = await fetch("/api/github/repos");
          setIsConnected(response.ok);
        } catch {
          setIsConnected(false);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    checkConnection();
  }, [session, status]);

  const handleConnect = async () => {
    await signIn("github", { callbackUrl: "/dashboard" });
  };

  if (loading || status === "loading") {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm shadow-neutral-200/70">
        <p className="text-sm text-neutral-500">Checking GitHub connection...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Github className="size-5 text-neutral-700" />
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">GitHub Integration</h3>
            <p className="text-xs text-neutral-500">
              {isConnected ? "Connected to GitHub" : "Connect your GitHub account to generate changelogs from repos"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <CheckCircle2 className="size-5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">Connected</span>
            </>
          ) : (
            <>
              <XCircle className="size-5 text-neutral-400" />
              <Button onClick={handleConnect} size="sm" className="rounded-full">
                <Github className="mr-2 size-4" />
                Connect to GitHub
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

