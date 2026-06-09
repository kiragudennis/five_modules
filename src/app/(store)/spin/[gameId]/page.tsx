// app/(store)/spin/[gameId]/page.tsx
// STABLE VERSION - All re-render sources extracted

"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { PointsService } from "@/lib/services/points-service";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useLiveBroadcast } from "@/hooks/useLiveBroadcast";
import {
  Coins,
  Gift,
  Trophy,
  Crown,
  Users,
  TrendingUp,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Eye,
  Loader2,
  Ticket,
  Target,
  Calendar,
  ShoppingBag,
  TrendingDown,
  Gift as GiftIcon,
  Sparkles as SparklesIcon,
  Flame,
  Star,
  Gem,
  Clock as ClockIcon,
  AlertCircle,
  Truck,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Radio } from "lucide-react";
import { SpinningWheelClientService } from "@/lib/services/spining-wheel-service.client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpinGame, UserSpinState } from "@/types/spinning_wheel";
import SpinWheel from "@/components/spin/spin-wheel";
import CountdownTimer from "@/components/spin/countdown-timer";
import RecentWinners from "@/components/spin/recent-winners";
import LiveStats from "@/components/spin/live-stats";
import UserStats from "@/components/spin/user-stats";

const GAME_TYPE_CONFIG = {
  standard: {
    icon: <Sparkles className="h-5 w-5" />,
    label: "Daily Spin",
    color: "from-blue-500 to-cyan-500",
    spinDuration: 0.8,
  },
  vip: {
    icon: <Crown className="h-5 w-5" />,
    label: "VIP Exclusive",
    color: "from-yellow-500 to-amber-500",
    spinDuration: 1.2,
  },
  new_customer: {
    icon: <Users className="h-5 w-5" />,
    label: "Welcome Bonus",
    color: "from-green-500 to-emerald-500",
    spinDuration: 1.0,
  },
  weekend: {
    icon: <Calendar className="h-5 w-5" />,
    label: "Weekend Special",
    color: "from-purple-500 to-pink-500",
    spinDuration: 0.9,
  },
  flash: {
    icon: <Zap className="h-5 w-5" />,
    label: "Flash Game",
    color: "from-red-500 to-orange-500",
    spinDuration: 0.6,
  },
};

export default function SpinGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();

  // Core game state
  const [game, setGame] = useState<SpinGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wheel state - ONLY these affect the wheel component
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<{
    prize: string;
    type: string;
  } | null>(null);

  // User state
  const [userState, setUserState] = useState<UserSpinState>({
    spins_used_today: 0,
    spins_used_week: 0,
    spins_used_total: 0,
    free_remaining_today: 0,
    free_remaining_week: 0,
    free_remaining_total: 0,
    points_balance: 0,
    can_spin_free: true,
    can_spin_paid: false,
  });

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Key to force child components to refresh after spin
  const [refreshKey, setRefreshKey] = useState(0);

  // Refs for services
  const wheelServiceRef = useRef<SpinningWheelClientService | null>(null);
  const dataFetchedRef = useRef(false);

  if (!wheelServiceRef.current && supabase) {
    wheelServiceRef.current = new SpinningWheelClientService(supabase);
  }
  const wheelService = wheelServiceRef.current;

  // Memoized values that don't change often
  const wheelData = useMemo(() => {
    if (!game) return [];
    return game.prize_config.map((prize) => ({
      option: prize.label,
      style: { backgroundColor: prize.color },
    }));
  }, [game]);

  const gameConfig = useMemo(() => {
    if (!game) return GAME_TYPE_CONFIG.standard;
    return GAME_TYPE_CONFIG[game.game_type] || GAME_TYPE_CONFIG.standard;
  }, [game]);

  // WebSocket for live updates
  const { isConnected } = useLiveBroadcast({
    channels: [`spin:${gameId}`, "global"],
    onMessage: (msg) => {
      if (msg.type === "winner" && msg.data?.type === "grand_prize_won") {
        toast.success(`🎉 GRAND PRIZE WINNER: ${msg.data.winnerName}! 🎉`, {
          duration: 10000,
        });
        fetchGameData();
      }
      if (msg.type === "ticker") {
        setRefreshKey((prev) => prev + 1); // Trigger child refresh
      }
    },
  });

  const fetchGameData = useCallback(async () => {
    if (!gameId || !supabase) return;

    const { data: gameData, error: gameError } = await supabase
      .from("spin_games")
      .select("*")
      .eq("id", gameId)
      .maybeSingle();

    if (gameError || !gameData) {
      setError("Game not found");
      setLoading(false);
      return;
    }

    setGame(gameData as SpinGame);

    if (profile?.id && wheelService) {
      try {
        const [allocation, balance] = await Promise.all([
          wheelService.getUserAllocation(profile.id, gameId),
          PointsService.getBalance(supabase, profile.id),
        ]);

        setUserState({
          spins_used_today: allocation?.spins_used_today || 0,
          spins_used_week: allocation?.spins_used_this_week || 0,
          spins_used_total: allocation?.spins_used_total || 0,
          free_remaining_today: allocation?.free_spins_remaining_today || 0,
          free_remaining_week: allocation?.free_spins_remaining_week || 0,
          free_remaining_total: allocation?.free_spins_remaining_total || 0,
          points_balance: balance?.points || 0,
          can_spin_free: allocation?.can_spin_free || false,
          can_spin_paid: allocation?.can_spin_paid || false,
        });
      } catch (err) {
        console.error("Error fetching user state:", err);
      }
    }

    setLoading(false);
  }, [gameId, profile?.id, supabase, wheelService]);

  // Realtime subscriptions
  useSupabaseRealtime({
    supabase,
    channelName: `spin-game-${gameId}`,
    tables: [
      { table: "spin_games", filter: `id=eq.${gameId}` },
      { table: "spin_attempts", filter: `game_id=eq.${gameId}` },
    ],
    onEvent: () => {
      fetchGameData();
      setRefreshKey((prev) => prev + 1);
    },
    enabled: Boolean(gameId),
  });

  // Initial data fetch
  useEffect(() => {
    if (!gameId || dataFetchedRef.current) return;
    dataFetchedRef.current = true;
    fetchGameData();
  }, [gameId, fetchGameData]);

  const handleSpin = async (usePoints: boolean) => {
    if (!profile) {
      toast.error("Please login to play");
      router.push("/login");
      return;
    }

    if (!game || spinning || !wheelService) return;

    if (game.is_single_prize && game.single_prize_claimed) {
      toast.error("Grand prize has already been claimed!");
      return;
    }

    if (!usePoints && !userState.can_spin_free) {
      toast.error("No free spins remaining. Use points to spin!");
      return;
    }

    if (usePoints && !userState.can_spin_paid) {
      toast.error(
        `Insufficient points. Need ${game.points_per_paid_spin} points`,
      );
      return;
    }

    if (
      usePoints &&
      profile?.loyalty?.points &&
      profile?.loyalty?.points < game.points_per_paid_spin
    ) {
      toast.error(`You need at least ${game.points_per_paid_spin} points.`);
      return;
    }

    if (game.eligible_tiers.length > 0) {
      const userTier = profile?.loyalty?.tier || "bronze";
      if (!game.eligible_tiers.includes(userTier)) {
        toast.error(`Your loyalty tier (${userTier}) is not eligible.`);
        return;
      }
    }

    setSpinning(true);

    try {
      // Send spin_start event to live page
      await supabase.rpc("record_spin_start", {
        p_game_id: game.id,
        p_user_id: profile.id,
      });

      // Perform the actual spin
      const result = await wheelService.spin(
        game.id,
        usePoints ? "points" : "free",
      );

      // Set the winning segment and start spinning
      setPrizeNumber(result.segment_index);
      setLastWin({
        prize: result.prizeDisplay,
        type: result.prize_type,
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMustSpin(true);
        });
      });

      // Play sound
      if (soundEnabled && game.play_sounds) {
        const audio = new Audio("/sounds/claim-chime.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    } catch (error: any) {
      toast.error(error.message || "Spin failed");
      setMustSpin(false);
      setSpinning(false);
    }
  };

  const handleStopSpinning = useCallback(async () => {
    setMustSpin(false);
    setSpinning(false);

    // Refresh user data after wheel stops
    if (profile?.id && wheelService && game) {
      try {
        const [allocation, balance] = await Promise.all([
          wheelService.getUserAllocation(profile.id, game.id),
          PointsService.getBalance(supabase!, profile.id),
        ]);

        setUserState({
          spins_used_today: allocation?.spins_used_today || 0,
          spins_used_week: allocation?.spins_used_this_week || 0,
          spins_used_total: allocation?.spins_used_total || 0,
          free_remaining_today: allocation?.free_spins_remaining_today || 0,
          free_remaining_week: allocation?.free_spins_remaining_week || 0,
          free_remaining_total: allocation?.free_spins_remaining_total || 0,
          points_balance: balance?.points || 0,
          can_spin_free: allocation?.can_spin_free || false,
          can_spin_paid: allocation?.can_spin_paid || false,
        });

        // Trigger refresh of child components
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        console.error("Error refreshing user state:", err);
      }
    }
  }, [profile?.id, wheelService, game, supabase]);

  const isGameLive =
    game?.is_active && (!game.ends_at || new Date(game.ends_at) > new Date());

  if (loading) {
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Game Not Found</h2>
        <p className="text-muted-foreground mb-4">
          {error || "This spin game doesn't exist or has been removed."}
        </p>
        <Button onClick={() => router.push("/spin")}>View All Games</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-r text-white",
          gameConfig.color,
        )}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {gameConfig.icon}
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  {gameConfig.label}
                </Badge>
                {isGameLive && (
                  <Badge variant="default" className="bg-green-500 gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </Badge>
                )}
                {isConnected && (
                  <Badge
                    variant="outline"
                    className="border-white/50 text-white"
                  >
                    <Radio className="h-3 w-3 mr-1" />
                    Broadcast Active
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{game.name}</h1>
              <p className="opacity-90 mt-1 max-w-xl">{game.description}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/spin/live/${game.id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Live Broadcast
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Wheel Column */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="pt-6 relative">
                {/* Countdown for time-limited games */}
                {game.ends_at && new Date(game.ends_at) > new Date() && (
                  <div className="absolute top-[-20px] left-1/2 transform -translate-x-1/2">
                    <CountdownTimer endsAt={game.ends_at} />
                  </div>
                )}

                {/* THE MEMOIZED WHEEL - Immune to parent re-renders */}
                <div className="flex justify-center mb-6">
                  <SpinWheel
                    mustSpin={mustSpin}
                    prizeNumber={prizeNumber}
                    data={wheelData}
                    spinDuration={gameConfig.spinDuration}
                    onStopSpinning={handleStopSpinning}
                  />
                </div>

                {/* Spin Controls */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      onClick={() => handleSpin(false)}
                      disabled={
                        spinning || !isGameLive || !userState?.can_spin_free
                      }
                    >
                      <Gift className="h-5 w-5 mr-2" />
                      Free Spin
                      {userState && (
                        <Badge variant="secondary" className="ml-2 bg-white/20">
                          {userState.free_remaining_today} left
                        </Badge>
                      )}
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleSpin(true)}
                      disabled={
                        spinning || !isGameLive || !userState.can_spin_paid
                      }
                      className="border-amber-500 text-amber-600 hover:bg-amber-50"
                    >
                      <Coins className="h-5 w-5 mr-2" />
                      {game.points_per_paid_spin} Points
                    </Button>
                  </div>

                  {spinning && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Spinning...</span>
                    </div>
                  )}

                  {lastWin && !spinning && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg p-3 text-center border border-yellow-500/50">
                      <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                      <p className="text-sm font-medium">
                        You won: {lastWin.prize}!
                      </p>
                    </div>
                  )}

                  {game.is_single_prize && !game.single_prize_claimed && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg p-3 text-center border border-yellow-500/50">
                      <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                      <p className="text-sm font-medium">
                        GRAND PRIZE STILL AVAILABLE!
                      </p>
                      <p className="text-xs opacity-75">
                        Next spin could be the winner
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prize Details Section - Below Wheel */}
            <div className="mt-6 space-y-4">
              {/* Prize Pool Showcase */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GiftIcon className="h-5 w-5 text-primary" />
                    Prize Pool Breakdown
                  </CardTitle>
                  <CardDescription>
                    Every spin gives you a chance to win amazing rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {game.prize_config.map((prize, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${prize.color}10, ${prize.color}05)`,
                          borderColor: `${prize.color}30`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${prize.color}20` }}
                          >
                            {prize.type === "points" && (
                              <Coins
                                className="h-5 w-5"
                                style={{ color: prize.color }}
                              />
                            )}
                            {prize.type === "discount" && (
                              <TrendingDown
                                className="h-5 w-5"
                                style={{ color: prize.color }}
                              />
                            )}
                            {prize.type === "product" && (
                              <ShoppingBag
                                className="h-5 w-5"
                                style={{ color: prize.color }}
                              />
                            )}
                            {prize.type === "bundle" && (
                              <Package
                                className="h-5 w-5"
                                style={{ color: prize.color }}
                              />
                            )}
                            {prize.type === "free_shipping" && (
                              <Truck
                                className="h-5 w-5"
                                style={{ color: prize.color }}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{prize.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Win{" "}
                              {prize.type === "points"
                                ? `${prize.value} Points`
                                : prize.value}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          style={{ borderColor: `${prize.color}50` }}
                        >
                          {prize.probability}% chance
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Game Info Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Game Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="how-to-play" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="how-to-play">How to Play</TabsTrigger>
                      <TabsTrigger value="prizes">Prizes & Rules</TabsTrigger>
                      <TabsTrigger value="tips">Pro Tips</TabsTrigger>
                    </TabsList>

                    <TabsContent value="how-to-play" className="mt-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Get Your Free Spins</p>
                          <p className="text-sm text-muted-foreground">
                            You get {game.free_spins_per_day} free spins every
                            day. Use them before they reset!
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Spin the Wheel</p>
                          <p className="text-sm text-muted-foreground">
                            Click the spin button and watch the wheel determine
                            your prize
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Claim Your Prize</p>
                          <p className="text-sm text-muted-foreground">
                            {game.prize_config.some(
                              (p) => p.type === "discount",
                            ) && "• Discount coupons auto-apply at checkout\n"}
                            {game.prize_config.some(
                              (p) => p.type === "points",
                            ) &&
                              "• Points added instantly to your loyalty balance\n"}
                            {game.prize_config.some(
                              (p) =>
                                p.type === "product" || p.type === "bundle",
                            ) &&
                              "• Products/bundles require shipping address verification"}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="prizes" className="mt-4 space-y-3">
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          Prize Distribution
                        </h4>
                        <div className="space-y-2">
                          {game.prize_config.slice(0, 3).map((prize, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm"
                            >
                              <span>{prize.label}</span>
                              <span className="font-mono">
                                {prize.probability}% probability
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Other prizes</span>
                            <span className="font-mono">
                              {100 -
                                game.prize_config
                                  .slice(0, 3)
                                  .reduce((sum, p) => sum + p.probability, 0)}
                              % combined
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          Important Rules
                        </h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Free spins reset daily at midnight (UTC)</li>
                          <li>
                            • Points-spins don't count toward daily limits
                          </li>
                          <li>• Winnings are credited instantly</li>
                          {game.is_single_prize &&
                            !game.single_prize_claimed && (
                              <li className="text-amber-600 font-medium">
                                • GRAND PRIZE still available!
                              </li>
                            )}
                        </ul>
                      </div>
                    </TabsContent>

                    <TabsContent value="tips" className="mt-4 space-y-3">
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                          <Flame className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">
                              Use your free spins daily
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Don't let your daily free spins go to waste!
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                          <Star className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">
                              Save points for big spins
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Accumulate points through purchases for extra
                              spins
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                          <Gem className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">
                              Check back for special events
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Weekend and flash games offer enhanced prizes
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Game Stats & Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Game Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">
                        {Math.max(
                          0,
                          game.free_spins_per_day -
                            (userState?.spins_used_today || 0),
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Free Spins Left
                      </div>
                    </div>
                  </div>
                  {userState && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Weekly Free Spins Used</span>
                        <span>
                          {userState.spins_used_week} /{" "}
                          {game.free_spins_per_week}
                        </span>
                      </div>
                      <Progress
                        value={
                          (userState.spins_used_week /
                            game.free_spins_per_week) *
                          100
                        }
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Tip: Come back tomorrow for {game.free_spins_per_day}{" "}
                        more free spins!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Column - Using separate components that manage their own state */}
          <div className="space-y-4">
            {/* Last Win Card */}
            {lastWin && !spinning && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Card className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium">You won!</p>
                          <p className="text-lg font-bold">{lastWin.prize}</p>
                        </div>
                      </div>
                      <SparklesIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* User Stats - Separate component */}
            {profile ? (
              <UserStats
                key={`user-${refreshKey}`}
                spinsUsedToday={userState.spins_used_today}
                freeSpinsPerDay={game.free_spins_per_day}
                freeRemainingToday={userState.free_remaining_today}
                pointsBalance={userState.points_balance}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Login to spin and win!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/login")}
                  >
                    Login / Sign Up
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Live Stats - Separate component with own timer */}
            <LiveStats key={`stats-${refreshKey}`} gameId={game.id} />

            {/* Recent Winners - Separate component with own timer */}
            <RecentWinners key={`winners-${refreshKey}`} gameId={game.id} />

            {/* Prize Pool Card */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Prize Pool
                </h3>
                <div className="flex flex-wrap gap-2">
                  {game.prize_config.map((prize, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: prize.color }}
                    >
                      {prize.type === "points" && <Coins className="h-3 w-3" />}
                      {prize.type === "discount" && <span>%</span>}
                      {prize.type === "product" && <Gift className="h-3 w-3" />}
                      <span>{prize.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Broadcast Banner */}
      <div className="fixed bottom-4 right-4 z-50">
        <Badge
          variant="outline"
          className="bg-black/80 text-white border-0 gap-2 py-2 px-3"
        >
          <Radio className="h-3 w-3 text-red-500 animate-pulse" />
          <span className="text-xs">Live Broadcast Active</span>
          <Button size="sm" variant="ghost" className="h-6 px-2" asChild>
            <Link href={`/spin/live/${game.id}`} target="_blank">
              <Eye className="h-3 w-3" />
            </Link>
          </Button>
        </Badge>
      </div>
    </div>
  );
}
