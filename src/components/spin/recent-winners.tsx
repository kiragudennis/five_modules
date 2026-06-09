// components/spin/RecentWinners.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface Winner {
  name: string;
  prize: string;
  time: string;
}

interface RecentWinnersProps {
  gameId: string;
  refreshInterval?: number; // in ms, default 30000
}

export default function RecentWinners({
  gameId,
  refreshInterval = 30000,
}: RecentWinnersProps) {
  const { supabase } = useAuth();
  const [winners, setWinners] = useState<Winner[]>([]);

  const fetchWinners = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("spin_attempts")
      .select(
        `prize_type, prize_value, created_at, users!spin_attempts_user_id_fkey (full_name)`,
      )
      .eq("game_id", gameId)
      .not("prize_value", "is", null)
      .gt("points_awarded", 0)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setWinners(
        data.map((w: any) => ({
          name: w.users?.full_name || "Anonymous",
          prize:
            w.prize_type === "points"
              ? `${w.prize_value} Points`
              : w.prize_value,
          time: w.created_at,
        })),
      );
    }
  };

  useEffect(() => {
    fetchWinners();
    const interval = setInterval(fetchWinners, refreshInterval);
    return () => clearInterval(interval);
  }, [gameId, refreshInterval]);

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Recent Winners
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {winners.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No winners yet. Be the first!
            </p>
          ) : (
            winners.map((winner, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">{winner.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {winner.prize}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
