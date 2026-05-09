"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

type Row = {
  user_id: string;
  score: number;
  users?: { full_name?: string | null; email?: string | null } | null;
};

export default function ChallengeLeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const { supabase } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const previousRanks = useRef<Map<string, number>>(new Map());

  const load = async () => {
    const { data } = await supabase
      .from("challenge_scores")
      .select("user_id,score,users:user_id(full_name,email)")
      .eq("challenge_id", id)
      .order("score", { ascending: false })
      .limit(100);
    setRows((data || []) as Row[]);
  };

  useEffect(() => {
    void load();
  }, [id]);
  usePolling(load, { intervalMs: 2500 });
  useSupabaseRealtime({
    supabase,
    channelName: `challenge-leaderboard-${id}`,
    tables: [
      { table: "challenge_scores", filter: `challenge_id=eq.${id}` },
      { table: "challenges", filter: `id=eq.${id}` },
    ],
    onEvent: () => {
      void load();
    },
    enabled: Boolean(id),
  });

  const rankMovement = useMemo(() => {
    const next = new Map<string, "up" | "down" | "flat">();
    rows.forEach((row, index) => {
      const current = index + 1;
      const previous = previousRanks.current.get(row.user_id);
      if (!previous) next.set(row.user_id, "flat");
      else if (current < previous) next.set(row.user_id, "up");
      else if (current > previous) next.set(row.user_id, "down");
      else next.set(row.user_id, "flat");
    });
    const snapshot = new Map<string, number>();
    rows.forEach((r, idx) => snapshot.set(r.user_id, idx + 1));
    previousRanks.current = snapshot;
    return next;
  }, [rows]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Live Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row, idx) => (
            <div
              key={row.user_id}
              className="flex items-center justify-between rounded border p-3"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{idx + 1}</Badge>
                <span>{row.users?.full_name || row.users?.email || row.user_id}</span>
                {rankMovement.get(row.user_id) === "up" ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : rankMovement.get(row.user_id) === "down" ? (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                ) : null}
              </div>
              <span className="font-bold">{row.score}</span>
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scores yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
