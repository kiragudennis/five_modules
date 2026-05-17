"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { usePolling } from "@/hooks/usePolling";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import LiveDisplayShell from "@/components/live/live-display-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DrawLiveData = {
  id: string;
  name: string;
  status: "entry_collection" | "entries_locked" | "winner_reveal" | "completed";
  draw_at: string | null;
  winner_name?: string | null;
};

export default function DrawLivePage() {
  const { drawId } = useParams<{ drawId: string }>();
  const { supabase } = useAuth();
  const [draw, setDraw] = useState<DrawLiveData | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [recentEntries, setRecentEntries] = useState<
    {
      entries_count: number;
      users?: { full_name?: string | null; email?: string | null } | null;
    }[]
  >([]);

  const load = async () => {
    const [{ data: drawData }, { data: entriesData }] = await Promise.all([
      supabase
        .from("draws")
        .select("id,name,status,draw_at,winner_name")
        .eq("id", drawId)
        .single(),
      supabase
        .from("draw_entries")
        .select("entries_count,users:user_id(full_name,email)")
        .eq("draw_id", drawId)
        .order("updated_at", { ascending: false })
        .limit(30),
    ]);

    setDraw((drawData || null) as DrawLiveData | null);
    const rows = (entriesData || []) as {
      entries_count: number;
      users?: { full_name?: string | null; email?: string | null } | null;
    }[];
    setRecentEntries(rows);
    setTotalEntries(rows.reduce((sum, r) => sum + (r.entries_count || 0), 0));
  };

  useEffect(() => {
    void load();
  }, [drawId]);

  usePolling(load, { intervalMs: 2500 });
  useSupabaseRealtime({
    supabase,
    channelName: `draw-live-${drawId}`,
    tables: [
      { table: "draws", filter: `id=eq.${drawId}` },
      { table: "draw_entries", filter: `draw_id=eq.${drawId}` },
    ],
    onEvent: () => {
      void load();
    },
    enabled: Boolean(drawId),
  });

  const ticker = useMemo(
    () =>
      recentEntries.slice(0, 10).map((entry) => {
        const name = entry.users?.full_name || entry.users?.email || "Customer";
        return `${name} has ${entry.entries_count} entries`;
      }),
    [recentEntries],
  );

  const statusText =
    draw?.status === "entries_locked"
      ? "Entries locked"
      : draw?.status === "winner_reveal"
        ? "Winner reveal in progress"
        : draw?.status === "completed"
          ? "Completed"
          : "Entry collection";

  return (
    <LiveDisplayShell
      title={draw?.name || "Live Draw"}
      subtitle={statusText}
      tickerItems={ticker}
      activeCount={recentEntries.length}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 md:col-span-2">
          <CardContent className="pt-6">
            <p className="mb-2 text-sm text-slate-300">Total entries</p>
            <p className="text-6xl font-black">{totalEntries}</p>
            <div className="mt-4 flex items-center gap-2">
              <Badge>{draw?.status || "entry_collection"}</Badge>
              {draw?.winner_name ? (
                <Badge variant="secondary">Winner: {draw.winner_name}</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="pt-6">
            <p className="mb-2 text-sm text-slate-300">Recent participants</p>
            <div className="space-y-2">
              {recentEntries.slice(0, 8).map((entry, idx) => (
                <div key={idx} className="rounded border border-slate-800 p-2">
                  <p className="text-sm">
                    {entry.users?.full_name || entry.users?.email || "Customer"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {entry.entries_count} entries
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
