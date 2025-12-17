import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 shadow-sm transition-colors outline-none",
        "focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
