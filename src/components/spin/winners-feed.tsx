// components/spin/winners-feed.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Coins, Tag, Sparkles } from "lucide-react";

interface Winner {
  name: string;
  prize: string;
  timestamp: string;
}

interface WinnersFeedProps {
  winners: Winner[];
}

export default function WinnersFeed({ winners }: WinnersFeedProps) {
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
          {winners.length === 0 ? (
            <div className="text-center py-8 text-purple-300 text-sm">
              No winners yet. Be the first!
            </div>
          ) : (
            winners.map((win, idx) => (
              <div
                key={`${win.name}-${win.timestamp}-${idx}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex-shrink-0">
                  {win.prize.includes("Points") ? (
                    <Coins className="h-5 w-5 text-yellow-400" />
                  ) : win.prize.includes("%") ? (
                    <Tag className="h-5 w-5 text-blue-400" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {win.name}
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
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
