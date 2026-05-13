"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminChallengesCreateRedirectPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Create Challenge</h1>
      <p className="mb-4 text-muted-foreground">
        Use the challenge wizard in marketing.
      </p>
      <Button onClick={() => router.push("/admin/marketing/challenges?create=true")}>
        Open creation wizard
      </Button>
    </div>
  );
}
