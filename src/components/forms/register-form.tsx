"use client";

import { useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
};

const initialState: RegisterFormState = {
  name: "",
  email: "",
  password: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [formState, setFormState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSubmitDisabled = useMemo(() => {
    const validName = formState.name.trim().length >= 2;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email);
    const validPassword = formState.password.length >= 8;
    return !(validName && validEmail && validPassword);
  }, [formState]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "खाता नहीं बनाया जा सका।");
        return;
      }

      setSuccess("खाता सफलतापूर्वक बना।");

      const result = await signIn("credentials", {
        redirect: false,
        email: formState.email,
        password: formState.password,
      });

      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">पूरा नाम</Label>
        <Input
          id="name"
          name="name"
          value={formState.name}
          onChange={handleChange}
          placeholder="आपका नाम"
          minLength={2}
          maxLength={120}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">ईमेल</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">पासवर्ड</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          autoComplete="new-password"
          placeholder="कम से कम 8 अक्षर"
          minLength={8}
          required
        />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-500">{success}</p> : null}

      <Button type="submit" className="w-full" disabled={isPending || isSubmitDisabled}>
        {isPending ? "खाता बना रहे हैं..." : "खाता बनाएँ"}
      </Button>
    </form>
  );
}

