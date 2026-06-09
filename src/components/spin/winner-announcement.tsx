// components/spin/winner-announcement.tsx
"use client";

import { useEffect, useState } from "react";
import { Crown, Gift, Coins, Sparkles } from "lucide-react";

interface Winner {
  name: string;
  prize: string;
  timestamp?: string; // Make timestamp optional for the announcement
}

interface WinnerAnnouncementProps {
  winner: Winner | null; // Only show the most recent winner
  onComplete: () => void;
}

export function WinnerAnnouncement({
  winner,
  onComplete,
}: WinnerAnnouncementProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!winner) {
      setIsVisible(false);
      return;
    }

    // Show the announcement
    setIsVisible(true);

    // Auto-hide after 4 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    // Notify parent after animation completes
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(completeTimer);
    };
  }, [winner, onComplete]);

  if (!winner || !isVisible) return null;

  const prizeType = winner.prize.includes("Points")
    ? "points"
    : winner.prize.includes("%")
      ? "discount"
      : "prize";

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
      <div
        className={`transition-all duration-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
        }`}
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-6 py-3 shadow-lg border-2 border-yellow-400/50">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              {prizeType === "points" && (
                <Coins className="h-5 w-5 text-yellow-300" />
              )}
              {prizeType === "discount" && (
                <Gift className="h-5 w-5 text-green-300" />
              )}
              {prizeType === "prize" && (
                <Sparkles className="h-5 w-5 text-yellow-300" />
              )}
            </div>
            <span className="text-white font-medium">
              🎉 {winner.name} won {winner.prize}! 🎉
            </span>
            <div className="animate-pulse">
              <Crown className="h-4 w-4 text-yellow-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
