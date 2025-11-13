"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  variant?: "default" | "outline" | "ghost";
  children?: React.ReactNode;
};

export function SignOutButton({ variant = "ghost", children }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      className="justify-start"
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

