"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";

type DrawAccountRow = {
  draw: {
    id: string;
    name: string;
    status: string;
    draw_at: string | null;
    prize_name: string;
  };
  entries_count: number;
};

export default function MyDrawsPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const { supabase, profile } = useAuth();
  const [rows, setRows] = useState<DrawAccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;

      const { data } = await supabase
        .from("draw_entries")
        .select(
          "entries_count, draw:draw_id(id,name,status,draw_at,prize_name)",
        )
        .eq("user_id", accountId)
        .order("updated_at", { ascending: false });

      setRows((data || []) as DrawAccountRow[]);
      setLoading(false);
    };

    void load();
  }, [supabase, accountId, profile?.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Draws</h1>
        <p className="text-muted-foreground">
          Active and upcoming draws you have entered.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your draws...</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.draw.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{row.draw.name}</span>
                  <Badge>{row.draw.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm">
                    Prize: <span className="font-medium">{row.draw.prize_name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Countdown:{" "}
                    {row.draw.draw_at
                      ? formatDistanceToNowStrict(new Date(row.draw.draw_at), {
                          addSuffix: true,
                        })
                      : "TBA"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{row.entries_count} entries</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/draws/${row.draw.id}`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {rows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                You have not entered any draws yet.
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
