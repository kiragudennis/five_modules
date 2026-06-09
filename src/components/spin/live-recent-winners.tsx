// components/spin/live-recent-winners.tsx
"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Coins, Gift, Sparkles } from "lucide-react";

interface Winner {
  name: string;
  prize: string;
  timestamp: string;
}

interface LiveRecentWinnersProps {
  winners: Winner[];
  onNewWinner?: () => void;
}

const LiveRecentWinners = memo(function LiveRecentWinners({
  winners,
  onNewWinner,
}: LiveRecentWinnersProps) {
  const prevWinnersLengthRef = useRef(winners.length);
  const [animateIndex, setAnimateIndex] = useState<number | null>(null);

  // Detect new winner and trigger animation
  useEffect(() => {
    if (winners.length > prevWinnersLengthRef.current) {
      // New winner added
      setAnimateIndex(0);
      onNewWinner?.();

      // Clear animation after 1 second
      const timer = setTimeout(() => {
        setAnimateIndex(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
    prevWinnersLengthRef.current = winners.length;
  }, [winners.length, onNewWinner]);

  if (winners.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur border-green-500/30">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Recent Winners
            </h3>
            <Badge
              variant="outline"
              className="border-green-500/50 text-green-300"
            >
              0 wins
            </Badge>
          </div>
          <div className="text-center py-8 text-purple-300 text-sm">
            No winners yet. Be the first!
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur border-green-500/30">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Recent Winners
          </h3>
          <Badge
            variant="outline"
            className="border-green-500/50 text-green-300"
          >
            {winners.length} wins
          </Badge>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {winners.map((win, idx) => {
            const isNew = idx === animateIndex;
            const prizeType = win.prize.includes("Points")
              ? "points"
              : win.prize.includes("%")
                ? "discount"
                : "prize";

            return (
              <div
                key={`${win.name}-${win.timestamp}-${idx}`}
                className={`flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all 
                  ${isNew ? "animate-slide-in-right border-l-4 border-yellow-500" : "animate-in fade-in slide-in-from-right duration-300"}`}
                style={{
                  animationDelay: `${Math.min(idx * 20, 300)}ms`,
                }}
              >
                <div className="flex-shrink-0">
                  {prizeType === "points" && (
                    <Coins className="h-5 w-5 text-yellow-400" />
                  )}
                  {prizeType === "discount" && (
                    <Gift className="h-5 w-5 text-blue-400" />
                  )}
                  {prizeType === "prize" && (
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {win.name}
                    {isNew && (
                      <span className="ml-2 text-xs text-yellow-400 animate-pulse">
                        NEW!
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-green-300">Won {win.prize}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-purple-300">
                    {new Date(win.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
});

LiveRecentWinners.displayName = "LiveRecentWinners";

export default LiveRecentWinners;
