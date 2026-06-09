// components/spin/countdown-timer.tsx
"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "lucide-react";

interface CountdownTimerProps {
  endsAt: string;
}

export default function CountdownTimer({ endsAt }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(endsAt);
      if (end > now) {
        const distance = end.getTime() - now.getTime();
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown("0h 0m 0s");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!countdown) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 text-sm">
      <ClockIcon className="h-4 w-4 text-purple-400" />
      <span className="text-purple-300">Game ends {countdown}</span>
    </div>
  );
}
