// components/providers/StreakTrackProvider.tsx
"use client";

import { useStreakTracker } from "@/hooks/useStreakTracker";

export function StreakTrackerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useStreakTracker();
  return <>{children}</>;
}
