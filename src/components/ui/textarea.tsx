import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 shadow-sm transition-colors outline-none resize-y",
        "focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
