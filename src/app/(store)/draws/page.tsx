"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";

type DrawRow = {
  id: string;
  name: string;
  prize_name: string;
  status: "active" | "upcoming" | "closed" | "completed";
  draw_at: string | null;
  entry_rules: {
    purchase_above?: number;
    entries_per_qualifying_purchase?: number;
    referral_entries?: number;
  } | null;
};

export default function DrawsPage() {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [draws, setDraws] = useState<DrawRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("draws")
        .select("id,name,prize_name,status,draw_at,entry_rules")
        .order("draw_at", { ascending: true });

      setDraws((data || []) as DrawRow[]);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Live Draws</h1>
        <p className="text-muted-foreground">
          Active and upcoming lottery draws for customers.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading draws...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {draws.map((draw) => (
            <Card key={draw.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{draw.name}</span>
                  <Badge
                    variant={draw.status === "active" ? "default" : "secondary"}
                  >
                    {draw.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  Prize: <span className="font-medium">{draw.prize_name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {draw.draw_at
                    ? `Draw ${formatDistanceToNowStrict(new Date(draw.draw_at), { addSuffix: true })}`
                    : "Draw time not set"}
                </p>
                <div className="text-xs text-muted-foreground">
                  Purchase rule:{" "}
                  {draw.entry_rules?.purchase_above
                    ? `Spend ${draw.entry_rules.purchase_above} to earn ${draw.entry_rules.entries_per_qualifying_purchase || 1} entries`
                    : "Not configured"}
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link href={`/draws/${draw.id}`}>Open draw</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/draws/live/${draw.id}`} target="_blank">
                      Open live display
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {draws.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No draws published yet.
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
