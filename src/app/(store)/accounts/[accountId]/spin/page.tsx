// app/accounts/[accountId]/spin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Gift,
  History,
  ChevronLeft,
  Loader2,
  Coins,
  Ticket,
  Award,
} from "lucide-react";
import { Wheel } from "react-custom-roulette";
import { toast } from "sonner";
import { format } from "date-fns";
import { SpinGame, SpinResult } from "@/types/customer";

export default function SpinPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [game, setGame] = useState<SpinGame | null>(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [spinsToday, setSpinsToday] = useState(0);
  const [recentResults, setRecentResults] = useState<SpinResult[]>([]);
  const [usingPoints, setUsingPoints] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (!profile || profile.id !== accountId) {
      router.push("/login");
      return;
    }
    fetchSpinData();
  }, [accountId, profile]);

  const fetchSpinData = async () => {
    try {
      setLoading(true);

      // Get user's loyalty points
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from("loyalty_points")
        .select("points")
        .eq("user_id", accountId)
        .single();

      if (!loyaltyError && loyaltyData) {
        setLoyaltyPoints(loyaltyData.points);
      }

      // Get active spin game
      const { data: gameData, error: gameError } = await supabase
        .from("spin_games")
        .select("*")
        .eq("is_active", true)
        .single();

      if (gameError) {
        console.error("Error fetching game:", gameError);
        // No active game, just return
        setLoading(false);
        return;
      }
      setGame(gameData);

      // Get today's spins
      const today = new Date().toISOString().split("T")[0];
      const { data: spinsData, error: spinsError } = await supabase
        .from("user_spins")
        .select("spins_used")
        .eq("user_id", accountId)
        .eq("spin_date", today)
        .single();

      if (!spinsError && spinsData) {
        setSpinsToday(spinsData.spins_used);
      }

      // Get recent results with coupon info
      const { data: resultsData, error: resultsError } = await supabase
        .from("spin_results")
        .select(
          `
          *,
          coupons:coupon_id (
            code,
            discount_type,
            discount_value,
            valid_until
          )
        `,
        )
        .eq("user_id", accountId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!resultsError && resultsData) {
        setRecentResults(resultsData);
      }
    } catch (error: any) {
      console.error("Error fetching spin data:", error);
      toast.error("Could not load spin game");
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (!game) return;

    // Check if user has daily spins left
    if (spinsToday >= game.free_spins_per_day && !usingPoints) {
      toast.error("You've used all your free spins today");
      return;
    }

    // Check points if using points
    if (usingPoints) {
      if (loyaltyPoints < game.points_per_spin) {
        toast.error("Not enough loyalty points");
        return;
      }
    }

    setSpinning(true);

    try {
      // Calculate prize based on probabilities
      const random = Math.random();
      let cumulativeProbability = 0;
      let selectedSegment = 0;

      for (let i = 0; i < game.wheel_config.length; i++) {
        cumulativeProbability += game.wheel_config[i].probability;
        if (random < cumulativeProbability) {
          selectedSegment = i;
          break;
        }
      }

      setPrizeNumber(selectedSegment);
      setMustSpin(true);

      // Record the spin using your RPC function
      const { data, error } = await supabase.rpc("record_spin", {
        p_user_id: accountId,
        p_game_id: game.id,
        p_used_points: usingPoints ? game.points_per_spin : 0,
        p_segment_index: selectedSegment,
        p_prize_type: game.wheel_config[selectedSegment].type,
        p_prize_value: game.wheel_config[selectedSegment].value,
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        setSpinsToday((prev) => prev + 1);
        if (usingPoints) {
          setLoyaltyPoints((prev) => prev - game.points_per_spin);
        }

        // Refresh data to show new results
        fetchSpinData();
      }
    } catch (error: any) {
      console.error("Error recording spin:", error);
      toast.error("Could not complete spin");
    } finally {
      setSpinning(false);
    }
  };

  const handleSpinStop = () => {
    setMustSpin(false);
    const prize = game?.wheel_config[prizeNumber];
    toast.success(`You won: ${prize?.label}!`);
  };

  const getPrizeIcon = (type: string) => {
    switch (type) {
      case "points":
        return <Coins className="h-4 w-4" />;
      case "discount":
        return <Ticket className="h-4 w-4" />;
      case "product":
        return <Gift className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Spin Game Available</h3>
              <p className="text-muted-foreground mb-6">
                Check back later for exciting spin games!
              </p>
              <Button onClick={() => router.push(`/accounts/${accountId}`)}>
                Back to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/accounts/${accountId}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{game.name}</h1>
            {game.description && (
              <p className="text-muted-foreground mt-1">{game.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Wheel */}
          <div className="lg:col-span-2">
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
                    onStopSpinning={handleSpinStop}
                    backgroundColors={game.wheel_config.map((seg) => seg.color)}
                    textDistance={70}
                    fontSize={14}
                    outerBorderColor="#333"
                    outerBorderWidth={3}
                    innerRadius={10}
                    radiusLineColor="#333"
                    radiusLineWidth={1}
                  />
                </div>

                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      Free Spins Left:{" "}
                      {Math.max(0, game.free_spins_per_day - spinsToday)}
                    </Badge>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      <Coins className="h-4 w-4 mr-2" />
                      {loyaltyPoints} pts
                    </Badge>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      onClick={() => {
                        setUsingPoints(false);
                        handleSpin();
                      }}
                      disabled={
                        spinning || spinsToday >= game.free_spins_per_day
                      }
                      className="min-w-[200px]"
                    >
                      {spinning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Spinning...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Free Spin ({game.free_spins_per_day - spinsToday}{" "}
                          left)
                        </>
                      )}
                    </Button>

                    {loyaltyPoints >= game.points_per_spin && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          setUsingPoints(true);
                          handleSpin();
                        }}
                        disabled={spinning}
                      >
                        <Coins className="h-4 w-4 mr-2" />
                        Use {game.points_per_spin} Points
                      </Button>
                    )}
                  </div>

                  {game.rules && (
                    <p className="text-xs text-muted-foreground mt-4">
                      {game.rules}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Prizes & History */}
          <div className="space-y-6">
            {/* Prizes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Prizes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {game.wheel_config.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded"
                      style={{ backgroundColor: `${segment.color}20` }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="flex items-center gap-1">
                          {getPrizeIcon(segment.type)}
                          {segment.label}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {Math.round(segment.probability * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Wins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No spins yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-3 bg-muted/50 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPrizeIcon(result.prize_type)}
                            <span className="font-medium capitalize">
                              {result.prize_type}
                            </span>
                          </div>
                          <Badge
                            variant={result.is_claimed ? "default" : "outline"}
                          >
                            {result.is_claimed ? "Claimed" : "Available"}
                          </Badge>
                        </div>

                        {result.prize_type === "discount" && result.coupon && (
                          <div className="text-sm bg-green-50 p-2 rounded">
                            <p className="font-mono text-green-700">
                              {result.coupon.code}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {result.coupon.discount_type === "percentage"
                                ? `${result.coupon.discount_value}% off`
                                : `KES ${result.coupon.discount_value} off`}
                              {result.coupon.valid_until &&
                                ` · Expires ${format(new Date(result.coupon.valid_until), "MMM d")}`}
                            </p>
                          </div>
                        )}

                        {result.prize_type === "points" &&
                          result.loyalty_points_awarded > 0 && (
                            <div className="text-sm bg-blue-50 p-2 rounded">
                              <p className="text-blue-700">
                                +{result.loyalty_points_awarded} points
                              </p>
                            </div>
                          )}

                        <p className="text-xs text-muted-foreground">
                          {format(new Date(result.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
