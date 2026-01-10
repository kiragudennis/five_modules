"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function GlobalLoader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => setLoading(true);
    const stop = () => setLoading(false);

    // router.events is NOT exposed in App Router, so:
    const origPush = router.push;
    router.push = async (...args: any) => {
      start();
      try {
        await origPush.apply(router, args);
      } finally {
        stop();
      }
    };

    return () => {
      router.push = origPush;
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
