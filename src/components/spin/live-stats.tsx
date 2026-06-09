// components/spin/LiveStats.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface LiveStatsProps {
  gameId: string;
  refreshInterval?: number;
}

export default function LiveStats({
  gameId,
  refreshInterval = 30000,
}: LiveStatsProps) {
  const { supabase } = useAuth();
  const [totalSpinsToday, setTotalSpinsToday] = useState(0);
  const [activePlayers, setActivePlayers] = useState(0);

  const fetchStats = async () => {
    if (!supabase) return;

    const today = new Date().toISOString().split("T")[0];
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [spinsResult, activeResult] = await Promise.all([
      supabase
        .from("spin_attempts")
        .select("id", { count: "exact", head: true })
        .eq("game_id", gameId)
        .gte("created_at", today),
      supabase
        .from("spin_attempts")
        .select("user_id", { count: "exact", head: true })
        .eq("game_id", gameId)
        .gte("created_at", fiveMinsAgo),
    ]);

    if (!spinsResult.error) setTotalSpinsToday(spinsResult.count || 0);
    if (!activeResult.error) setActivePlayers(activeResult.count || 0);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [gameId, refreshInterval]);

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Live Stats
        </h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-500">
              {activePlayers}
            </div>
            <div className="text-xs text-muted-foreground">Playing Now</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">
              {totalSpinsToday}
            </div>
            <div className="text-xs text-muted-foreground">Spins Today</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
