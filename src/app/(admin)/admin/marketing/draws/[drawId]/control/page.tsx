// app/(admin)/admin/marketing/draws/[drawId]/control/page.tsx - Enhanced version

"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Trophy,
  Users,
  Ticket,
  RefreshCw,
  Play,
  Lock,
  Eye,
  Crown,
} from "lucide-react";

type DrawControl = {
  id: string;
  name: string;
  status: "draft" | "open" | "closed" | "drawing" | "completed" | "cancelled";
  winner_name?: string | null;
  winner_user_id?: string | null;
  total_entries?: number;
  total_participants?: number;
};

export default function DrawControlPage() {
  const { drawId } = useParams<{ drawId: string }>();
  const { supabase } = useAuth();
  const [draw, setDraw] = useState<DrawControl | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingWinner, setSelectingWinner] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    if (!drawId) return;

    try {
      const [
        { data: drawData, error: drawError },
        { data: entries, error: entriesError },
      ] = await Promise.all([
        supabase
          .from("draws")
          .select("id, name, status, winner_id, winner_name")
          .eq("id", drawId)
          .single(),
        supabase
          .from("draw_entries")
          .select(
            `user_id, entry_count, users!draw_entries_user_id_fkey (
      full_name,
      email
    )`,
          )
          .eq("draw_id", drawId)
          .order("entry_count", { ascending: false }),
      ]);

      if (drawError) {
        toast.error("Could not load draw data.");
        console.error(drawError);
        return;
      }

      if (entriesError) {
        toast.error("Could not load participant data.");
        console.error(entriesError);
        return;
      }

      // Calculate totals
      const totalEntries =
        entries?.reduce((sum, e) => sum + (e.entry_count || 0), 0) || 0;
      const uniqueParticipants = entries
        ? new Set(entries.map((e) => e.user_id)).size
        : 0;

      setDraw({
        ...(drawData || {}),
        total_entries: totalEntries,
        total_participants: uniqueParticipants,
      } as DrawControl);
      setParticipants(entries || []);
    } catch (error) {
      console.error("Error loading draw control data:", error);
    } finally {
      setLoading(false);
    }
  }, [drawId, supabase]);

  // Use polling instead of real-time to avoid resource issues
  useEffect(() => {
    loadData();

    // Poll every 5 seconds
    pollingRef.current = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadData]);

  const updateStatus = async (newStatus: string) => {
    if (!draw) return;
    setUpdatingStatus(true);

    const { error } = await supabase
      .from("draws")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", draw.id);

    if (error) {
      toast.error("Could not update phase.");
      console.error(error);
    } else {
      toast.success(`Phase switched to ${newStatus}`);
      await loadData();
    }
    setUpdatingStatus(false);
  };

  const selectWinner = async () => {
    if (!draw || participants.length === 0) {
      toast.error("No participants available.");
      return;
    }

    setSelectingWinner(true);

    // Build weighted pool based on entry counts
    const weightedPool: typeof participants = [];
    participants.forEach((p) => {
      const weight = Math.min(p.entry_count, 100); // Cap at 100 to prevent huge arrays
      for (let i = 0; i < weight; i++) {
        weightedPool.push(p);
      }
    });

    // Simulate "shuffling" for drama (brief delay)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const winner =
      weightedPool[Math.floor(Math.random() * weightedPool.length)];
    const winnerName =
      winner.users?.full_name || winner.users?.email || "Customer";

    const { error } = await supabase
      .from("draws")
      .update({
        status: "completed",
        winner_name: winnerName,
        winner_id: winner.user_id,
      })
      .eq("id", draw.id);

    if (error) {
      toast.error("Could not store winner.");
      console.error(error);
    } else {
      toast.success(`Winner selected: ${winnerName}`);
      await loadData();
    }
    setSelectingWinner(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Play className="h-4 w-4 text-green-500" />;
      case "closed":
        return <Lock className="h-4 w-4 text-orange-500" />;
      case "drawing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!draw) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Draw not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{draw.name}</h1>
        <p className="text-muted-foreground">Draw Control Panel</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Draw Phases</span>
                <Badge variant="outline" className="gap-1">
                  {getStatusIcon(draw.status)}
                  Current: {draw.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={draw.status === "open" ? "default" : "outline"}
                  onClick={() => updateStatus("open")}
                  disabled={updatingStatus || draw.status === "completed"}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Phase 1: Entry Collection
                </Button>
                <Button
                  variant={draw.status === "closed" ? "default" : "outline"}
                  onClick={() => updateStatus("closed")}
                  disabled={updatingStatus || draw.status === "completed"}
                  className="gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Phase 2: Entries Locked
                </Button>
                <Button
                  variant="outline"
                  onClick={selectWinner}
                  disabled={
                    selectingWinner ||
                    draw.status === "completed" ||
                    participants.length === 0
                  }
                  className="gap-2"
                >
                  {selectingWinner ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trophy className="h-4 w-4" />
                  )}
                  Select Winner
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button asChild variant="secondary" className="w-full gap-2">
                  <Link href={`/draws/${draw.id}`} target="_blank">
                    <Eye className="h-4 w-4" />
                    Open Live Display
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Winner Display */}
          {draw.winner_name && (
            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
              <CardContent className="py-6 text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Current Winner</p>
                <p className="text-2xl font-bold">{draw.winner_name}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Ticket className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">
                  {draw.total_entries?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">
                  {draw.total_participants?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">Participants</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {participants.slice(0, 50).map((p, idx) => (
                  <div
                    key={p.user_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                  >
                    <span className="truncate flex-1">
                      {p.users?.full_name ||
                        p.users?.email ||
                        p.user_id.slice(0, 8)}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {p.entry_count} entry{p.entry_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No participants yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
