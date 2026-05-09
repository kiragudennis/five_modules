"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { usePolling } from "@/hooks/usePolling";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { LiveDisplayShell } from "@/components/live/live-display-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Challenge = {
  id: string;
  name: string;
  end_date: string | null;
};

type ScoreRow = {
  user_id: string;
  score: number;
  users?: { full_name?: string | null; email?: string | null } | null;
};

export default function ChallengeLivePage() {
  const { id } = useParams<{ id: string }>();
  const { supabase } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const load = async () => {
    const [{ data: c }, { data: scores }] = await Promise.all([
      supabase.from("challenges").select("id,name,end_date").eq("id", id).single(),
      supabase
        .from("challenge_scores")
        .select("user_id,score,users:user_id(full_name,email)")
        .eq("challenge_id", id)
        .order("score", { ascending: false })
        .limit(10),
    ]);
    setChallenge((c || null) as Challenge | null);
    setRows((scores || []) as ScoreRow[]);
    if (c?.end_date) {
      setSecondsLeft(
        Math.max(0, Math.floor((new Date(c.end_date).getTime() - Date.now()) / 1000)),
      );
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  usePolling(load, { intervalMs: 2500 });
  usePolling(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), {
    intervalMs: 1000,
    runImmediately: false,
  });
  useSupabaseRealtime({
    supabase,
    channelName: `challenge-live-${id}`,
    tables: [
      { table: "challenges", filter: `id=eq.${id}` },
      { table: "challenge_scores", filter: `challenge_id=eq.${id}` },
    ],
    onEvent: () => {
      void load();
    },
    enabled: Boolean(id),
  });

  const finalHour = secondsLeft <= 3600;
  const ticker = useMemo(
    () =>
      rows.slice(0, 10).map((r) => {
        const name = r.users?.full_name || r.users?.email || "Customer";
        return `${name} now has ${r.score} points`;
      }),
    [rows],
  );

  return (
    <LiveDisplayShell
      title={challenge?.name || "Challenge Live"}
      subtitle={finalHour ? "FINAL HOUR MODE" : "Live scoreboard"}
      tickerItems={ticker}
      activeCount={rows.length}
    >
      {finalHour ? (
        <div className="mb-4 rounded border border-red-500 bg-red-900/30 p-3 text-red-200">
          Final Hour Mode active. Urgency notifications should fire now.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 md:col-span-2">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Time remaining</p>
            <p className={`text-6xl font-black ${finalHour ? "text-red-400" : "text-green-400"}`}>
              {Math.floor(secondsLeft / 3600)
                .toString()
                .padStart(2, "0")}
              :
              {Math.floor((secondsLeft % 3600) / 60)
                .toString()
                .padStart(2, "0")}
              :
              {(secondsLeft % 60).toString().padStart(2, "0")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="pt-6">
            <p className="mb-2 text-sm text-slate-300">Top 10</p>
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div
                  key={r.user_id}
                  className="flex items-center justify-between rounded border border-slate-800 p-2"
                >
                  <span className="text-sm">
                    #{idx + 1} {r.users?.full_name || r.users?.email || "Customer"}
                  </span>
                  <Badge>{r.score}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LiveDisplayShell>
  );
}
