"use client";

import { useEffect, useRef, useActionState } from "react";
import { createProjectAction } from "@/app/dashboard/actions";
import { initialProjectActionState } from "@/app/dashboard/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CreateProjectFormProps = {
  onSuccess?: () => void;
};

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const [state, formAction] = useActionState(createProjectAction, initialProjectActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [onSuccess, state.status]);

  return (
    <form ref={formRef} className="space-y-6" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Project name</Label>
          <Input id="name" name="name" placeholder="e.g. Nova Analytics" required maxLength={80} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Short description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What problem does this project solve?"
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-neutral-500">This appears on your public changelog homepage.</p>
        </div>

        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            name="visibility"
            defaultValue="PUBLIC"
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200/60"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
      </div>

      {state.status === "error" ? <p className="text-sm text-red-500">{state.message}</p> : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-500">{state.message ?? "Project created successfully."}</p>
      ) : null}

      <Button type="submit" className="w-full sm:w-auto">
        Create project
      </Button>
    </form>
  );
}

