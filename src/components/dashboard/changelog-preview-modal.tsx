"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "@/components/changelog-markdown";

type ChangelogPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changelog: string;
  versionLabel: string;
  projectSlug: string;
  versionSlug: string;
  projectName: string;
  published: boolean;
};

export function ChangelogPreviewModal({
  open,
  onOpenChange,
  changelog,
  versionLabel,
  projectSlug,
  versionSlug,
  projectName,
  published,
}: ChangelogPreviewModalProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleViewChangelog = () => {
    setIsNavigating(true);
    router.push(`/projects/${projectSlug}/versions/${versionSlug}`);
    onOpenChange(false);
  };

  // Get preview (first 500 characters or first 10 lines, whichever is shorter)
  const previewLines = changelog.split("\n").slice(0, 10);
  const previewText = previewLines.join("\n");
  const hasMore = changelog.length > previewText.length;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Changelog Generated Successfully!"
      description={`Your changelog for ${projectName} version ${versionLabel} has been ${published ? "generated and published" : "generated"}.`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Success Message */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900">
                {published ? "Changelog generated and published!" : "Changelog generated successfully!"}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                {published
                  ? "Your changelog is now live on your public project page."
                  : "Your changelog has been saved as a draft. You can publish it anytime."}
              </p>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-neutral-400" />
            <h3 className="text-sm font-semibold text-neutral-900">Preview</h3>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="changelog-content w-full">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {previewText}
              </ReactMarkdown>
              {hasMore && (
                <p className="mt-4 text-xs italic text-neutral-500">... (more content below)</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4">
          <Button
            onClick={handleViewChangelog}
            disabled={isNavigating}
            className="w-full rounded-lg"
          >
            {isNavigating ? (
              <>
                <Sparkles className="mr-2 size-4 animate-pulse" />
                Opening changelog...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 size-4" />
                View Full Changelog
              </>
            )}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

