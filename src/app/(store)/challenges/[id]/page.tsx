"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, Clock } from "lucide-react";

type Challenge = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  end_date: string | null;
};

type Entry = {
  user_id: string;
  score: number;
  users?: { full_name?: string | null; email?: string | null } | null;
};

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const { supabase, profile } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [board, setBoard] = useState<Entry[]>([]);

  const load = async () => {
    const [{ data: c }, { data: scores }] = await Promise.all([
      supabase
        .from("challenges")
        .select("id,name,description,type,end_date")
        .eq("id", id)
        .single(),
      supabase
        .from("challenge_scores")
        .select("user_id,score,users:user_id(full_name,email)")
        .eq("challenge_id", id)
        .order("score", { ascending: false })
        .limit(50),
    ]);
    setChallenge((c || null) as Challenge | null);
    setBoard((scores || []) as Entry[]);
  };

  useEffect(() => {
    void load();
  }, [id]);

  const myRank = useMemo(() => {
    if (!profile?.id) return null;
    const idx = board.findIndex((b) => b.user_id === profile.id);
    return idx >= 0 ? idx + 1 : null;
  }, [board, profile?.id]);

  const pointsToOvertake = useMemo(() => {
    if (!profile?.id || myRank === null || myRank <= 1) return 0;
    const me = board[myRank - 1];
    const above = board[myRank - 2];
    return Math.max(0, (above?.score || 0) - (me?.score || 0) + 1);
  }, [board, myRank, profile?.id]);

  const catchThem = async () => {
    if (!profile?.id) return;
    const current = board.find((b) => b.user_id === profile.id)?.score || 0;
    await supabase.from("challenge_scores").upsert(
      {
        challenge_id: id,
        user_id: profile.id,
        score: current + 1,
      },
      { onConflict: "challenge_id,user_id" },
    );
    await load();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!challenge ? (
        <p className="text-sm text-muted-foreground">Loading challenge...</p>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{challenge.name}</span>
                <Badge>{challenge.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{challenge.description}</p>
              <p className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ends: {challenge.end_date || "Not set"}
              </p>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Your rank</p>
                <p className="text-3xl font-bold">{myRank || "Unranked"}</p>
                <p className="text-sm text-muted-foreground">
                  Need {pointsToOvertake} point(s) to overtake next player.
                </p>
                <Button className="mt-2" onClick={() => void catchThem()}>
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Catch Them
                </Button>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/challenges/${id}/leaderboard`}>Leaderboard</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/challenges/${id}/live`} target="_blank">
                    Live display
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
