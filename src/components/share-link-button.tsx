"use client";

import { useMemo, useState } from "react";
import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type ShareLinkButtonProps = {
  url: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  modalTitle?: string;
  modalDescription?: string;
  shareMessage?: string;
  fieldLabel?: string;
  copyButtonLabel?: string;
  ariaLabel?: string;
  className?: string;
};

export function ShareLinkButton({
  url,
  triggerLabel = "Share",
  triggerVariant = "ghost",
  triggerSize = "sm",
  modalTitle = "Share Link",
  modalDescription = "Share this page with your audience.",
  shareMessage,
  fieldLabel = "Project link",
  copyButtonLabel = "Copy link",
  ariaLabel,
  className,
}: ShareLinkButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const message = shareMessage ?? "Explore the latest changelog update on Changelogy";
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(url);

    return `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
  }, [shareMessage, url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy share link", error);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2",
          triggerSize === "icon"
            ? "rounded-full border border-transparent text-neutral-400 hover:border-neutral-200 hover:text-neutral-700"
            : "",
          className,
        )}
        aria-label={ariaLabel ?? triggerLabel}
      >
        <Share className={cn("size-4", triggerSize === "icon" ? "shrink-0" : "")} />
        {triggerSize !== "icon" ? triggerLabel : null}
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={modalTitle}
        description={modalDescription}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" type="button" className="rounded-full">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  Share on X
                </a>
              </Button>
              <Button type="button" className="rounded-full" onClick={handleCopy}>
                {copied ? "Copied!" : copyButtonLabel}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">{fieldLabel}</p>
          <Input value={url} readOnly className="text-sm" onFocus={(event) => event.currentTarget.select()} />
        </div>
      </Modal>
    </>
  );
}


