// components/spin/current-spinner.tsx
"use client";

import { Loader2 } from "lucide-react";

interface CurrentSpinnerProps {
  userName: string | null;
}

export default function CurrentSpinner({ userName }: CurrentSpinnerProps) {
  if (!userName) return null;

  return (
    <div className="mb-4 text-center animate-in fade-in slide-in-from-top duration-300">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/50">
        <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
        <span className="text-sm font-medium text-yellow-400">
          {userName} is spinning...
        </span>
      </div>
    </div>
  );
}
