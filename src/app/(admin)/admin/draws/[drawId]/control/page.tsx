"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePolling } from "@/hooks/usePolling";

type DrawControl = {
  id: string;
  name: string;
  status: "entry_collection" | "entries_locked" | "winner_reveal" | "completed";
  winner_name?: string | null;
};

export default function DrawControlPage() {
  const { drawId } = useParams<{ drawId: string }>();
  const { supabase } = useAuth();
  const [draw, setDraw] = useState<DrawControl | null>(null);
  const [participants, setParticipants] = useState<
    { user_id: string; entries_count: number; users?: { full_name?: string | null; email?: string | null } | null }[]
  >([]);

  const load = async () => {
    const [{ data: drawData }, { data: entries }] = await Promise.all([
      supabase
        .from("draws")
        .select("id,name,status,winner_name")
        .eq("id", drawId)
        .single(),
      supabase
        .from("draw_entries")
        .select("user_id,entries_count,users:user_id(full_name,email)")
        .eq("draw_id", drawId),
    ]);

    setDraw((drawData || null) as DrawControl | null);
    setParticipants(
      (entries || []) as {
        user_id: string;
        entries_count: number;
        users?: { full_name?: string | null; email?: string | null } | null;
      }[],
    );
  };

  useEffect(() => {
    void load();
  }, [drawId]);

  usePolling(load, { intervalMs: 2500 });

  const setStatus = async (status: DrawControl["status"]) => {
    if (!draw) return;
    const { error } = await supabase.from("draws").update({ status }).eq("id", draw.id);
    if (error) {
      toast.error("Could not update phase.");
      return;
    }
    toast.success(`Phase switched to ${status}`);
    await load();
  };

  const selectWinner = async () => {
    if (!draw || participants.length === 0) {
      toast.error("No participants available.");
      return;
    }
    const weightedPool: typeof participants = [];
    participants.forEach((p) => {
      for (let i = 0; i < Math.max(1, p.entries_count); i += 1) {
        weightedPool.push(p);
      }
    });
    const winner = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    const winnerName = winner.users?.full_name || winner.users?.email || "Customer";

    const { error } = await supabase
      .from("draws")
      .update({
        status: "completed",
        winner_name: winnerName,
        winner_user_id: winner.user_id,
        winner_claim_status: "pending",
      })
      .eq("id", draw.id);

    if (error) {
      toast.error("Could not store winner.");
      return;
    }
    toast.success(`Winner selected: ${winnerName}`);
    await load();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!draw ? (
        <p className="text-sm text-muted-foreground">Loading control panel...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>{draw.name} control panel</span>
              <Badge>{draw.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void setStatus("entry_collection")}
              >
                Phase 1: Entry collection
              </Button>
              <Button
                variant="outline"
                onClick={() => void setStatus("entries_locked")}
              >
                Phase 2: Entries locked
              </Button>
              <Button
                variant="outline"
                onClick={() => void setStatus("winner_reveal")}
              >
                Phase 3: Winner reveal
              </Button>
              <Button onClick={() => void selectWinner()}>Select winner</Button>
              <Button asChild variant="secondary">
                <Link href={`/draws/live/${draw.id}`} target="_blank">
                  Open live screen
                </Link>
              </Button>
            </div>

            {draw.winner_name ? (
              <div className="rounded border p-3">
                <p className="text-sm text-muted-foreground">Winner</p>
                <p className="text-xl font-bold">{draw.winner_name}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Participants ({participants.length})
              </p>
              {participants.slice(0, 20).map((p) => (
                <div
                  key={p.user_id}
                  className="flex items-center justify-between rounded border p-2 text-sm"
                >
                  <span>{p.users?.full_name || p.users?.email || p.user_id}</span>
                  <Badge variant="outline">{p.entries_count} entries</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
