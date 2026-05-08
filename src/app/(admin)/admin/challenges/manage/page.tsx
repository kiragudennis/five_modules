"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminChallengesManageRedirectPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Manage Challenges</h1>
      <p className="mb-4 text-muted-foreground">
        Challenge management is currently in marketing dashboard.
      </p>
      <Button onClick={() => router.push("/admin/marketing/challenges")}>
        Open challenge dashboard
      </Button>
    </div>
  );
}
