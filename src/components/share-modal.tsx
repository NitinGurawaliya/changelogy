'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareModalProps = {
  productName: string;
  version: string;
  publicUrl: string;
};

export default function ShareModal({ productName, version, publicUrl }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      window.history.replaceState(null, "", url.toString());
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-8">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" role="presentation" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-neutral-200/80 bg-white/95 p-8 shadow-2xl shadow-neutral-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
              Release launched
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900">{productName}</h2>
          </div>
          <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-100">
            v{version}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          Your changelog page is live. Share it with your community or open it in a new tab to review the
          final polish.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">Public link</p>
          <p className="mt-2 break-all text-sm font-medium text-neutral-900">{publicUrl}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button className="rounded-full px-5" onClick={handleCopy} type="button">
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button asChild variant="outline" className="rounded-full border-neutral-300 px-5 text-neutral-600">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              View public page
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn("ml-auto text-sm font-medium text-neutral-500 hover:text-neutral-900")}
            onClick={handleClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

