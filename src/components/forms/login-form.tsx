"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      setError("कृपया मान्य ईमेल और पासवर्ड दर्ज करें।");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("लॉगिन विवरण मेल नहीं खाते।");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">ईमेल</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">पासवर्ड</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="********"
          minLength={8}
          required
        />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "लॉगिन जारी है..." : "डैशबोर्ड में प्रवेश करें"}
      </Button>
    </form>
  );
}

