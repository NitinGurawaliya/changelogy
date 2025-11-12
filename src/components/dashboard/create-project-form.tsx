"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { initialProjectActionState, createProjectAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateProjectForm() {
  const [state, formAction] = useFormState(createProjectAction, initialProjectActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} className="space-y-6" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">प्रोजेक्ट का नाम</Label>
          <Input id="name" name="name" placeholder="जैसे — Nova Analytics" required maxLength={80} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">संक्षिप्त विवरण</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="यह प्रोजेक्ट किस समस्या को हल करता है?"
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-neutral-500">यह विवरण सार्वजनिक changelog होमपेज पर दिखाई देगा।</p>
        </div>

        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="visibility">दृश्यता</Label>
          <select
            id="visibility"
            name="visibility"
            defaultValue="PUBLIC"
            className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
          >
            <option value="PUBLIC">सार्वजनिक</option>
            <option value="PRIVATE">निजी</option>
          </select>
        </div>
      </div>

      {state.status === "error" ? <p className="text-sm text-red-500">{state.message}</p> : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-500">{state.message ?? "प्रोजेक्ट तैयार है।"}</p>
      ) : null}

      <Button type="submit" className="w-full sm:w-auto">
        नया प्रोजेक्ट बनाएँ
      </Button>
    </form>
  );
}

