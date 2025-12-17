"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  variant?: "default" | "outline" | "ghost";
  children?: React.ReactNode;
  className?: string;
};

export function SignOutButton({ variant = "ghost", children, className }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      className={className || "justify-start"}
      onClick={() =>
        startTransition(async () => {
          await signOut({
            callbackUrl: "/login",
          });
        })
      }
      disabled={isPending}
    >
      {children ?? (isPending ? "Signing out..." : "Sign out")}
    </Button>
  );
}

