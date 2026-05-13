"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/usePolling";

type SpinGameRow = {
  id: string;
  name: string;
  is_active: boolean;
  end_date: string | null;
};

export default function AdminSpinManagePage() {
  const { supabase } = useAuth();
  const [games, setGames] = useState<SpinGameRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("spin_games")
      .select("id,name,is_active,end_date")
      .order("created_at", { ascending: false });
    setGames((data || []) as SpinGameRow[]);
  };

  const toggleActive = async (game: SpinGameRow) => {
    await supabase
      .from("spin_games")
      .update({ is_active: !game.is_active })
      .eq("id", game.id);
    await load();
  };

  useEffect(() => {
    void load();
  }, []);

  usePolling(load, { intervalMs: 5000 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Manage Spin Games</h1>
        <Button asChild>
          <Link href="/admin/spin/create">Create game</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"
            >
              <div>
                <p className="font-medium">{game.name}</p>
                <p className="text-xs text-muted-foreground">
                  Ends: {game.end_date || "No end date"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={game.is_active ? "default" : "secondary"}>
                  {game.is_active ? "Active" : "Inactive"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void toggleActive(game)}
                >
                  {game.is_active ? "Pause" : "Activate"}
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/spin/live/${game.id}`} target="_blank">
                    Open live screen
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {games.length === 0 ? (
            <p className="text-sm text-muted-foreground">No games created yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
