"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg";
  footer?: ReactNode;
};

export function Modal({ open, onOpenChange, title, description, children, size = "md", footer }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (typeof document === "undefined") {
    return null;
  }

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div
        role="presentation"
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-xl border border-neutral-200 bg-white shadow-xl",
          size === "lg" ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 pb-4 pt-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
          </div>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            onClick={() => onOpenChange(false)}
            aria-label="Close modal"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>

        {footer ? <footer className="border-t border-neutral-200 px-6 py-4">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

