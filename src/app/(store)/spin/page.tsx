// This is the main index page for spin games, showing all configured games and their status.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { formatDistanceToNowStrict } from "date-fns";

type SpinGameRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  free_spins_per_day: number;
  points_per_spin: number;
  target_groups?: string[] | null;
};

export default function SpinGamesIndexPage() {
  const { supabase } = useAuth();
  const [games, setGames] = useState<SpinGameRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("spin_games")
        .select(
          "id,name,description,is_active,start_date,end_date,free_spins_per_day,points_per_spin,target_groups",
        )
        .order("created_at", { ascending: false });

      setGames((data || []) as SpinGameRow[]);
      setLoading(false);
    };

    void load();
  }, [supabase]);

  const activeGames = useMemo(
    () => games.filter((g) => g.is_active).length,
    [games],
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Spin Games</h1>
        <p className="text-muted-foreground">
          Live wheels for new customers, VIPs, and time-limited campaigns.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Badge>{activeGames} active now</Badge>
        <Badge variant="outline">{games.length} total configured</Badge>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading games...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => {
            const endsIn =
              game.end_date &&
              formatDistanceToNowStrict(new Date(game.end_date), {
                addSuffix: true,
              });

            return (
              <Card key={game.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{game.name}</span>
                    <Badge variant={game.is_active ? "default" : "secondary"}>
                      {game.is_active ? "Live" : "Scheduled"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {game.description || "No description set."}
                  </p>
                  <div className="text-sm">
                    <p>Free spins: {game.free_spins_per_day}/day</p>
                    <p>Paid spin: {game.points_per_spin} points</p>
                    {endsIn ? <p>Ends: {endsIn}</p> : <p>No expiry set</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm">
                      <Link href={`/spin/${game.id}`}>Open game</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/spin/live/${game.id}`} target="_blank">
                        Open live display
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
