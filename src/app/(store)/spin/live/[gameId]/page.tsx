"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { LiveDisplayShell } from "@/components/live/live-display-shell";
import { usePolling } from "@/hooks/usePolling";
import { useAuth } from "@/lib/context/AuthContext";

type SpinLiveResult = {
  id: string;
  created_at: string;
  prize_type: string;
  prize_value: string;
  users?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
};

export default function SpinLiveDisplayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { supabase } = useAuth();
  const [gameName, setGameName] = useState("Spin Live");
  const [activeSpinners, setActiveSpinners] = useState(0);
  const [latestResults, setLatestResults] = useState<SpinLiveResult[]>([]);
  const [playSound, setPlaySound] = useState(true);

  const loadLiveData = async () => {
    const [{ data: game }, { data: spins }, { data: results }] =
      await Promise.all([
        supabase.from("spin_games").select("name").eq("id", gameId).single(),
        supabase
          .from("user_spins")
          .select("id")
          .eq("game_id", gameId)
          .gte("updated_at", new Date(Date.now() - 5 * 60_000).toISOString()),
        supabase
          .from("spin_results")
          .select(
            "id, created_at, prize_type, prize_value, users:user_id (full_name, email)",
          )
          .eq("game_id", gameId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (game?.name) setGameName(game.name);
    setActiveSpinners(spins?.length || 0);
    setLatestResults((results || []) as SpinLiveResult[]);
  };

  useEffect(() => {
    void loadLiveData();
  }, [gameId]);

  usePolling(loadLiveData, { intervalMs: 2500 });

  const tickerItems = useMemo(
    () =>
      latestResults.slice(0, 10).map((result) => {
        const name =
          result.users?.full_name || result.users?.email || "Customer";
        return `${name} won ${result.prize_type}: ${result.prize_value}`;
      }),
    [latestResults],
  );

  useEffect(() => {
    if (!playSound || latestResults.length === 0) return;
    const audio = new Audio("/sounds/chime.mp3");
    audio.volume = 0.2;
    audio.play().catch(() => {});
  }, [latestResults[0]?.id]);

  return (
    <LiveDisplayShell
      title={gameName}
      subtitle="Live spin broadcast"
      activeCount={activeSpinners}
      tickerItems={tickerItems}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 md:col-span-2">
          <CardContent className="pt-6">
            <p className="mb-3 text-sm text-slate-300">
              Waiting for customer spins. This display updates every 2.5 seconds.
            </p>
            <div className="rounded-md border border-slate-800 p-4">
              <p className="text-5xl font-extrabold">{activeSpinners}</p>
              <p className="text-sm text-slate-400">active spinners now</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="pt-6">
            <button
              onClick={() => setPlaySound((s) => !s)}
              className="mb-4 rounded-md border border-slate-700 px-3 py-1 text-xs"
            >
              Sound: {playSound ? "On" : "Off"}
            </button>
            <div className="space-y-2">
              {latestResults.slice(0, 6).map((result) => (
                <div key={result.id} className="rounded border border-slate-800 p-2">
                  <p className="text-sm">
                    {result.users?.full_name || result.users?.email || "Customer"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {result.prize_type} - {result.prize_value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LiveDisplayShell>
  );
}
