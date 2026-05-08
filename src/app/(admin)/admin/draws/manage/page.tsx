"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/usePolling";

type DrawRow = {
  id: string;
  name: string;
  prize_name: string;
  status: string;
  winner_name?: string | null;
  winner_claim_status?: "pending" | "claimed" | "unclaimed" | "redraw" | null;
};

export default function AdminDrawsManagePage() {
  const { supabase } = useAuth();
  const [draws, setDraws] = useState<DrawRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("draws")
      .select("id,name,prize_name,status,winner_name,winner_claim_status")
      .order("created_at", { ascending: false });
    setDraws((data || []) as DrawRow[]);
  };

  const updateClaim = async (draw: DrawRow, value: DrawRow["winner_claim_status"]) => {
    await supabase
      .from("draws")
      .update({ winner_claim_status: value })
      .eq("id", draw.id);
    await load();
  };

  useEffect(() => {
    void load();
  }, []);

  usePolling(load, { intervalMs: 4000 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Manage Draws</h1>
        <Button asChild>
          <Link href="/admin/draws/create">Create draw</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Winner management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {draws.map((draw) => (
            <div
              key={draw.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"
            >
              <div>
                <p className="font-medium">{draw.name}</p>
                <p className="text-sm text-muted-foreground">
                  {draw.prize_name}
                  {draw.winner_name ? ` • Winner: ${draw.winner_name}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{draw.status}</Badge>
                <Badge variant="outline">
                  {draw.winner_claim_status || "pending"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void updateClaim(draw, "claimed")}
                >
                  Mark claimed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void updateClaim(draw, "unclaimed")}
                >
                  Mark unclaimed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void updateClaim(draw, "redraw")}
                >
                  Redraw
                </Button>
                <Button asChild size="sm">
                  <Link href={`/admin/draws/${draw.id}/control`}>Control</Link>
                </Button>
              </div>
            </div>
          ))}
          {draws.length === 0 ? (
            <p className="text-sm text-muted-foreground">No draws created yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
