"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";

type DrawDetail = {
  id: string;
  name: string;
  prize_name: string;
  status: string;
  draw_at: string | null;
  entry_rules: {
    purchase_above?: number;
    entries_per_qualifying_purchase?: number;
    referral_entries?: number;
  } | null;
};

export default function DrawDetailPage() {
  const { drawId } = useParams<{ drawId: string }>();
  const { supabase, profile } = useAuth();
  const [draw, setDraw] = useState<DrawDetail | null>(null);
  const [entries, setEntries] = useState(0);
  const [loading, setLoading] = useState(true);

  const timeLabel = useMemo(() => {
    if (!draw?.draw_at) return "Draw schedule pending";
    return formatDistanceToNowStrict(new Date(draw.draw_at), {
      addSuffix: true,
    });
  }, [draw?.draw_at]);

  const load = async () => {
    if (!profile?.id) return;
    const [{ data: drawData }, { data: entriesData }] = await Promise.all([
      supabase
        .from("draws")
        .select("id,name,prize_name,status,draw_at,entry_rules")
        .eq("id", drawId)
        .single(),
      supabase
        .from("draw_entries")
        .select("entries_count")
        .eq("draw_id", drawId)
        .eq("user_id", profile.id)
        .single(),
    ]);

    setDraw((drawData || null) as DrawDetail | null);
    setEntries(entriesData?.entries_count || 0);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [drawId, profile?.id]);

  const simulatePurchaseEntry = async () => {
    if (!profile?.id || !draw) return;
    const addCount = draw.entry_rules?.entries_per_qualifying_purchase || 1;
    const next = entries + addCount;

    const { error } = await supabase.from("draw_entries").upsert(
      {
        draw_id: draw.id,
        user_id: profile.id,
        entries_count: next,
      },
      { onConflict: "draw_id,user_id" },
    );

    if (error) {
      toast.error("Could not add entries.");
      return;
    }

    setEntries(next);
    toast.success(`You earned ${addCount} entries in ${draw.name}.`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {loading || !draw ? (
        <p className="text-sm text-muted-foreground">Loading draw...</p>
      ) : (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>{draw.name}</span>
              <Badge variant={draw.status === "active" ? "default" : "secondary"}>
                {draw.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Prize: <span className="font-semibold">{draw.prize_name}</span>
            </p>
            <p className="text-sm text-muted-foreground">Draw: {timeLabel}</p>
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Your entries</p>
              <p className="text-4xl font-bold">{entries}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void simulatePurchaseEntry()}>
                Simulate qualifying purchase
              </Button>
              <Button asChild variant="outline">
                <a href={`/draws/live/${draw.id}`} target="_blank">
                  Open live draw screen
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
