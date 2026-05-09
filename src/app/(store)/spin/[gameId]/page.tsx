"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Wheel } from "react-custom-roulette";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useAuth } from "@/lib/context/AuthContext";

type WheelSegment = {
  label: string;
  value: string;
  type: string;
  probability: number;
  color: string;
};

type SpinGameDetails = {
  id: string;
  name: string;
  is_active: boolean;
  free_spins_per_day: number;
  points_per_spin: number;
  wheel_config: WheelSegment[];
  prize_claimed_by?: string | null;
  is_locked?: boolean;
};

export default function SpinGameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { supabase, profile } = useAuth();
  const [game, setGame] = useState<SpinGameDetails | null>(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinsToday, setSpinsToday] = useState(0);
  const [points, setPoints] = useState(0);

  const freeSpinsRemaining = useMemo(() => {
    if (!game) return 0;
    return Math.max(0, game.free_spins_per_day - spinsToday);
  }, [game, spinsToday]);

  const load = async () => {
    if (!profile) return;

    const [{ data: gameData }, { data: loyaltyData }, { data: spinDayData }] =
      await Promise.all([
        supabase.from("spin_games").select("*").eq("id", gameId).single(),
        supabase
          .from("loyalty_points")
          .select("points")
          .eq("user_id", profile.id)
          .single(),
        supabase
          .from("user_spins")
          .select("spins_used")
          .eq("user_id", profile.id)
          .eq("spin_date", new Date().toISOString().split("T")[0])
          .single(),
      ]);

    if (!gameData) return;
    const parsedGame = {
      ...gameData,
      wheel_config:
        typeof gameData.wheel_config === "string"
          ? JSON.parse(gameData.wheel_config)
          : gameData.wheel_config,
    } as SpinGameDetails;

    setGame(parsedGame);
    setPoints(loyaltyData?.points || 0);
    setSpinsToday(spinDayData?.spins_used || 0);
  };

  useEffect(() => {
    void load();
  }, [gameId, profile?.id]);

  useSupabaseRealtime({
    supabase,
    channelName: `spin-game-${gameId}-${profile?.id || "anon"}`,
    tables: [
      { table: "spin_games", filter: `id=eq.${gameId}` },
      { table: "spin_results", filter: `game_id=eq.${gameId}` },
      ...(profile?.id
        ? [
            { table: "user_spins", filter: `user_id=eq.${profile.id}` },
            { table: "loyalty_points", filter: `user_id=eq.${profile.id}` },
          ]
        : []),
    ],
    onEvent: () => {
      void load();
    },
    enabled: Boolean(gameId && profile?.id),
  });

  const doSpin = async (usePoints: boolean) => {
    if (!game || !profile || spinning || game.is_locked) return;

    if (!usePoints && freeSpinsRemaining <= 0) {
      toast.error("No free spins left. Use points instead.");
      return;
    }
    if (usePoints && points < game.points_per_spin) {
      toast.error("Not enough points.");
      return;
    }

    const random = Math.random();
    let cumulative = 0;
    let selected = 0;
    for (let i = 0; i < game.wheel_config.length; i += 1) {
      cumulative += game.wheel_config[i].probability || 0;
      if (random <= cumulative) {
        selected = i;
        break;
      }
    }

    setSpinning(true);
    setPrizeNumber(selected);
    setMustSpin(true);

    const chosen = game.wheel_config[selected];
    const { data, error } = await supabase.rpc("record_spin", {
      p_user_id: profile.id,
      p_game_id: game.id,
      p_used_points: usePoints ? game.points_per_spin : 0,
      p_segment_index: selected,
      p_prize_type: chosen.type,
      p_prize_value: chosen.value,
    });

    if (error || !data?.success) {
      toast.error("Spin failed. Please retry.");
      setMustSpin(false);
      setSpinning(false);
      return;
    }

    setSpinsToday((prev) => prev + (usePoints ? 0 : 1));
    if (usePoints) setPoints((prev) => prev - game.points_per_spin);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!game ? (
        <p className="text-sm text-muted-foreground">Loading game...</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold">{game.name}</h1>
            <Badge variant={game.is_active ? "default" : "secondary"}>
              {game.is_active ? "Active" : "Inactive"}
            </Badge>
            {game.is_locked ? (
              <Badge variant="destructive">
                Prize claimed by {game.prize_claimed_by || "winner"}
              </Badge>
            ) : null}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={game.wheel_config.map((seg) => ({
                    option: seg.label,
                    style: { backgroundColor: seg.color },
                  }))}
                  onStopSpinning={() => {
                    setMustSpin(false);
                    setSpinning(false);
                    const won = game.wheel_config[prizeNumber];
                    toast.success(`You won ${won.label}`);
                  }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{freeSpinsRemaining} free spins left</Badge>
                <Badge variant="outline">{points} loyalty points</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => void doSpin(false)}
                  disabled={spinning || game.is_locked}
                >
                  {freeSpinsRemaining > 0
                    ? `Free spin (${freeSpinsRemaining})`
                    : "No free spins left"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void doSpin(true)}
                  disabled={spinning || game.is_locked}
                >
                  Spend {game.points_per_spin} points to spin
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
