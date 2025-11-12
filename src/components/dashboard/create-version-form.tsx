"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import {
  initialChangelogActionState,
  createChangelogAction,
} from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CreateVersionFormProps = {
  projectId: string;
  projectSlug: string;
  projectName: string;
};

export function CreateVersionForm({ projectId, projectSlug, projectName }: CreateVersionFormProps) {
  const [state, formAction] = useFormState(createChangelogAction, initialChangelogActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.projectSlug === projectSlug) {
      formRef.current?.reset();
    }
  }, [projectSlug, state]);

  return (
    <div className="rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/80 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-neutral-800">नई रिलीज़ बनाएँ</h4>
          <p className="text-xs text-neutral-500">Markdown का उपयोग करें और हम इसे खूबसूरती से रेंडर करेंगे।</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "रद्द करें" : "फॉर्म खोलें"}
        </Button>
      </div>

      {expanded ? (
        <form ref={formRef} action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="space-y-2">
            <Label htmlFor={`version-${projectId}`}>संस्करण नाम</Label>
            <Input
              id={`version-${projectId}`}
              name="versionLabel"
              placeholder="जैसे — 2.4.0, Spring 2025"
              required
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`markdown-${projectId}`}>रिलीज़ नोट्स (Markdown)</Label>
            <Textarea
              id={`markdown-${projectId}`}
              name="content"
              placeholder="- नया ऑनबोर्डिंग अनुभव\n- बेहतर डैशबोर्ड अंतर्दृष्टि\n- अधिसूचना सेटिंग्स अपडेट"
              rows={8}
              required
            />
            <label className="flex items-center gap-2 text-xs text-neutral-500">
              <input
                type="checkbox"
                name="publish"
                defaultChecked
                className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-800 focus:ring-neutral-400"
              />
              प्रकाशित करें (सार्वजनिक changelog पर तुरंत दिखाएँ)
            </label>
          </div>

          {state.status === "error" ? <p className="text-sm text-red-500">{state.message}</p> : null}
          {state.status === "success" && state.projectSlug === projectSlug ? (
            <p className="text-sm text-emerald-500">
              रिलीज़ तैयार है! सार्वजनिक लिंक: /projects/{projectSlug}/versions/{state.versionSlug}
            </p>
          ) : null}

          <Button type="submit" className="rounded-full px-6">
            {projectName} के लिए रिलीज़ शिप करें
          </Button>
        </form>
      ) : null}
    </div>
  );
}

