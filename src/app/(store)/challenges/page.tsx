"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";

type ChallengeRow = {
  id: string;
  name: string;
  description: string | null;
  type: "referral" | "purchase" | "share";
  is_active: boolean;
  end_date: string | null;
};

export default function ChallengesIndexPage() {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ChallengeRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("challenges")
        .select("id,name,description,type,is_active,end_date")
        .order("created_at", { ascending: false });
      setRows((data || []) as ChallengeRow[]);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Challenges</h1>
      <p className="mb-6 text-muted-foreground">
        Referral, purchase, and share challenges with live leaderboards.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading challenges...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{c.name}</span>
                  <Badge variant={c.is_active ? "default" : "secondary"}>
                    {c.is_active ? "Live" : "Inactive"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{c.description}</p>
                <p className="text-xs text-muted-foreground">
                  Ends:{" "}
                  {c.end_date
                    ? formatDistanceToNowStrict(new Date(c.end_date), {
                        addSuffix: true,
                      })
                    : "No end date"}
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/challenges/${c.id}`}>Open challenge</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/challenges/${c.id}/leaderboard`}>
                      Leaderboard
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/challenges/${c.id}/live`} target="_blank">
                      Live
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
