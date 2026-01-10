"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-2 py-8">
      <div className="flex flex-col items-center w-full gap-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || "Something went wrong!"}
          </AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button onClick={reset}>Try Again</Button>
          <Button asChild variant="outline">
            <Link href="/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
