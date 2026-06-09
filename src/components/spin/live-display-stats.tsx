// components/spin/live-stats.tsx
"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Clock, Users, TrendingUp, Eye } from "lucide-react";

interface LiveStatsProps {
  activeViewers: number;
  totalParticipants: number;
  totalSpins: number;
}

const LiveStats = memo(function LiveStats({
  activeViewers,
  totalParticipants,
  totalSpins,
}: LiveStatsProps) {
  return (
    <Card className="bg-gradient-to-br from-pink-900/40 to-red-900/40 backdrop-blur border-pink-500/30">
      <div className="p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-pink-400" />
          Live Statistics
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="text-xl font-bold text-yellow-400">
              {activeViewers}
            </div>
            <div className="text-xs text-purple-300 flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" />
              Active Viewers
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="text-xl font-bold text-green-400">
              {totalParticipants}
            </div>
            <div className="text-xs text-purple-300 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Total Players
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="text-xl font-bold text-blue-400">{totalSpins}</div>
            <div className="text-xs text-purple-300 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total Spins
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

LiveStats.displayName = "LiveStats";

export default LiveStats;
