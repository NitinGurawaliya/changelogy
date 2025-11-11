import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

async function createChangelog(formData: FormData) {
  "use server";

  const productName = formData.get("productName");
  const text = formData.get("text");

  if (typeof productName !== "string" || productName.trim().length === 0) {
    throw new Error("Product name is required.");
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Changelog text is required.");
  }

  const changelog = await prisma.changelog.create({
    data: {
      productName: productName.trim(),
      text: text.trim(),
    },
    select: {
      id: true,
    },
  });

  redirect(`/c/${changelog.id}`);
}

export default function Dashboard() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-16">
      <div className="mb-10 space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
          Generate a public changelog
        </h1>
        <p className="text-neutral-600">
          Paste your latest product updates and we&apos;ll craft a polished page you can share instantly.
        </p>
      </div>

      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle>Create in seconds</CardTitle>
          <CardDescription>Fill in the details below and we&apos;ll do the rest.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createChangelog} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="productName">Product name</Label>
              <Input
                id="productName"
                name="productName"
                placeholder="Acme Docs"
                required
                maxLength={120}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Changelog notes</Label>
              <Textarea
                id="text"
                name="text"
                placeholder="- Added workspace search\n- Improved onboarding checklist\n- Fixed invite link bug"
                rows={10}
                required
                className="bg-white"
              />
              <p className="text-xs text-neutral-500">Supports Markdown — lists, headings, links, and more.</p>
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full">
              Generate Public Page
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
