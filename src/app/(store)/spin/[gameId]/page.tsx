// app/(store)/spin/[gameId]/page.tsx
// Main customer-facing spin game page - Interactive wheel with real-time updates

"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Wheel } from "react-custom-roulette";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/context/AuthContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useLiveBroadcast } from "@/hooks/useLiveBroadcast";
import { PointsService } from "@/lib/services/points-service";
// import { SpinningWheelService } from "@/lib/services/spinning-wheel-service";
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
import { cn, formatCurrency } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";
import { Radio } from "lucide-react";
import { SpinningWheelClientService } from "@/lib/services/spining-wheel-service.client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpinGame, UserSpinState } from "@/types/spinning_wheel";

const GAME_TYPE_CONFIG = {
  standard: {
    icon: <Sparkles className="h-5 w-5" />,
    label: "Daily Spin",
    color: "from-blue-500 to-cyan-500",
  },
  vip: {
    icon: <Crown className="h-5 w-5" />,
    label: "VIP Exclusive",
    color: "from-yellow-500 to-amber-500",
  },
  new_customer: {
    icon: <Users className="h-5 w-5" />,
    label: "Welcome Bonus",
    color: "from-green-500 to-emerald-500",
  },
  weekend: {
    icon: <Calendar className="h-5 w-5" />,
    label: "Weekend Special",
    color: "from-purple-500 to-pink-500",
  },
  flash: {
    icon: <Zap className="h-5 w-5" />,
    label: "Flash Game",
    color: "from-red-500 to-orange-500",
  },
};

export default function SpinGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();

  // Game State
  const [game, setGame] = useState<SpinGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wheel State
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<{
    prize: string;
    type: string;
  } | null>(null);

  // User State
  const [userState, setUserState] = useState<UserSpinState | null>(null);
  const [recentWinners, setRecentWinners] = useState<
    Array<{ name: string; prize: string; time: string }>
  >([]);
  const [totalSpinsToday, setTotalSpinsToday] = useState(0);
  const [activePlayers, setActivePlayers] = useState(0);
  const [countdown, setCountdown] = useState("0h 0m 0s");

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const wheelService = useMemo(
    () => new SpinningWheelClientService(supabase),
    [supabase],
  );

  // Set up a countdown timer for time-limited games
  useEffect(() => {
    if (!game?.ends_at) return;
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(game.ends_at!);
      if (end > now) {
        const distance = end.getTime() - now.getTime();
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown("0h 0m 0s");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [game?.ends_at]);

  // WebSocket for live updates
  const { isConnected } = useLiveBroadcast({
    channels: [`spin:${gameId}`, "global"],
    onMessage: (msg) => {
      if (msg.type === "winner" && msg.data?.type === "grand_prize_won") {
        toast.success(`🎉 GRAND PRIZE WINNER: ${msg.data.winnerName}! 🎉`, {
          duration: 10000,
        });
        fetchGameData(); // Refresh game state
      }
      if (msg.type === "ticker") {
        fetchRecentWinners(); // Refresh winners list
      }
    },
  });

  const fetchGameData = useCallback(async () => {
    if (!gameId) return;

    // Fetch game details - handle case when game doesn't exist
    const { data: gameData, error: gameError } = await supabase
      .from("spin_games")
      .select("*")
      .eq("id", gameId)
      .maybeSingle(); // Use maybeSingle() instead of single() - returns null if no rows

    if (gameError || !gameData) {
      setError("Game not found");
      setLoading(false);
      return;
    }

    setGame(gameData as SpinGame);

    // If user is logged in, fetch their state
    if (profile?.id) {
      try {
        const allocation = await wheelService.getUserAllocation(
          profile.id,
          gameId,
        );
        const balance = await PointsService.getBalance(supabase, profile.id);

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
        // Set default user state
        setUserState({
          spins_used_today: 0,
          spins_used_week: 0,
          spins_used_total: 0,
          free_remaining_today: gameData.free_spins_per_day || 0,
          free_remaining_week: gameData.free_spins_per_week || 0,
          free_remaining_total: gameData.free_spins_total || 0,
          points_balance: 0,
          can_spin_free: true,
          can_spin_paid: false,
        });
      }
    }

    setLoading(false);
  }, [gameId, profile?.id, supabase, wheelService]);

  const fetchRecentWinners = useCallback(async () => {
    // Handle case when there are no spin attempts yet
    const { data, error } = await supabase
      .from("spin_attempts")
      .select(
        `prize_type, prize_value, created_at, users!spin_attempts_user_id_fkey (
      full_name
    )`,
      )
      .eq("game_id", gameId)
      .not("prize_value", "is", null)
      .gt("points_awarded", 0)
      .order("created_at", { ascending: false })
      .limit(10);

    // Handle empty results gracefully
    if (error) {
      // If table is empty or no results, just set empty array
      if (error.code === "PGRST116") {
        setRecentWinners([]);
      } else {
        console.error("Error fetching winners:", error);
        setRecentWinners([]);
      }
    } else if (data && data.length > 0) {
      setRecentWinners(
        data.map((w: any) => ({
          name: w.users?.full_name || "Anonymous",
          prize:
            w.prize_type === "points"
              ? `${w.prize_value} Points`
              : w.prize_value,
          time: w.created_at,
        })),
      );
    } else {
      setRecentWinners([]);
    }

    // Get total spins today - handle when no records exist
    const today = new Date().toISOString().split("T")[0];
    const { count, error: countError } = await supabase
      .from("spin_attempts")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId)
      .gte("created_at", today);

    // Only update if there's no error
    if (!countError) {
      setTotalSpinsToday(count || 0);
    } else {
      setTotalSpinsToday(0);
    }

    // Get active players - handle when no records exist
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: activeCount, error: activeError } = await supabase
      .from("spin_attempts")
      .select("user_id", { count: "exact", head: true })
      .eq("game_id", gameId)
      .gte("created_at", fiveMinsAgo);

    if (!activeError) {
      setActivePlayers(activeCount || 0);
    } else {
      setActivePlayers(0);
    }
  }, [gameId, supabase]);

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
      fetchRecentWinners();
    },
    enabled: Boolean(gameId),
  });

  useEffect(() => {
    fetchGameData();
    fetchRecentWinners();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchRecentWinners();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchGameData, fetchRecentWinners]);

  const handleSpin = async (usePoints: boolean) => {
    if (!profile) {
      toast.error("Please login to play");
      router.push("/login");
      return;
    }

    if (!game) return;
    if (spinning) return;
    if (game.is_single_prize && game.single_prize_claimed) {
      toast.error("Grand prize has already been claimed!");
      return;
    }

    if (!usePoints && (!userState || !userState.can_spin_free)) {
      toast.error("No free spins remaining. Use points to spin!");
      return;
    }

    if (usePoints && (!userState || !userState.can_spin_paid)) {
      toast.error(
        `Insufficient points. Need ${game.points_per_paid_spin} points`,
      );
      return;
    }

    setSpinning(true);

    // Random selection based on probabilities
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedIndex = 0;
    for (let i = 0; i < game.prize_config.length; i++) {
      cumulative += game.prize_config[i].probability;
      if (random <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    setPrizeNumber(selectedIndex);
    setMustSpin(true);

    try {
      const result = await wheelService.spin(
        game.id,
        usePoints ? "points" : "free",
      );

      setLastWin({
        prize: result.prizeDisplay,
        type: result.prize_type,
      });

      // Play sound
      if (soundEnabled && game.play_sounds) {
        const audio = new Audio("/sounds/win-chime.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }

      // Refresh user state
      fetchGameData();
      fetchRecentWinners();
    } catch (error: any) {
      toast.error("Error during spin:", error.message);
      setMustSpin(false);
    } finally {
      setSpinning(false);
    }
  };

  const getWheelData = () => {
    if (!game) return [];
    return game.prize_config.map((prize) => ({
      option: prize.label,
      style: { backgroundColor: prize.color },
    }));
  };

  const isGameLive =
    game?.is_active && (!game.ends_at || new Date(game.ends_at) > new Date());
  const gameConfig = game
    ? GAME_TYPE_CONFIG[game.game_type]
    : GAME_TYPE_CONFIG.standard;
  const timeRemaining = game?.ends_at
    ? formatDistanceToNowStrict(new Date(game.ends_at), { addSuffix: true })
    : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
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
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                      <ClockIcon className="h-4 w-4" />
                      <span>Game ends {countdown}</span>
                    </div>
                  </div>
                )}
                {/* Wheel */}
                <div className="flex justify-center mb-6">
                  <Wheel
                    mustStartSpinning={mustSpin}
                    prizeNumber={prizeNumber}
                    data={getWheelData()}
                    onStopSpinning={() => {
                      setMustSpin(false);
                      if (lastWin) {
                        toast.success(`🎉 You won: ${lastWin.prize}! 🎉`, {
                          duration: 5000,
                        });
                      }
                    }}
                    outerBorderColor="#e2e8f0"
                    outerBorderWidth={3}
                    innerRadius={15}
                    radiusLineColor="#e2e8f0"
                    radiusLineWidth={2}
                    textDistance={65}
                    fontSize={14}
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
                        spinning ||
                        !isGameLive ||
                        (!!userState && !userState?.can_spin_free)
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
                        spinning ||
                        !isGameLive ||
                        (!!userState && !userState.can_spin_paid)
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
                                • GRAND PRIZE still available - one lucky winner
                                takes it all!
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
                              Don't let your daily free spins go to waste - they
                              reset every day!
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
                              Accumulate points through purchases and use them
                              strategically for extra spins
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
                              Weekend and flash games offer enhanced prizes and
                              better odds
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
                      <div className="text-2xl font-bold text-primary">
                        {totalSpinsToday}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Spins Today
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {activePlayers}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Playing Now
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        {recentWinners.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Recent Winners
                      </div>
                    </div>
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

                  {/* Progress to next milestone */}
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

          {/* Stats Column */}
          <div className="space-y-4">
            {/* Show last win prominently */}
            {lastWin && (
              <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
            {/* User Stats Card */}
            {profile && userState ? (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Your Stats
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Free Spins Today</span>
                        <span className="font-medium">
                          {userState.free_remaining_today} /{" "}
                          {game.free_spins_per_day}
                        </span>
                      </div>
                      <Progress
                        value={
                          (userState.spins_used_today /
                            game.free_spins_per_day) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Points Balance</span>
                        <span className="font-medium text-amber-600">
                          {userState.points_balance.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={
                          (userState.points_balance /
                            (game.points_per_paid_spin * 10)) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                    <div className="pt-2 text-xs text-muted-foreground">
                      <p>• Free spins reset daily</p>
                      <p>• Earn points by making purchases</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

            {/* Live Stats Card */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Live Stats
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-500">
                      {activePlayers}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Playing Now
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      {totalSpinsToday}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Spins Today
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-500">
                      {game.prize_config.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Prizes</div>
                  </div>
                </div>

                {timeRemaining && timeRemaining !== "Ended" && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ends</span>
                    <span className="font-mono">{timeRemaining}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Winners Card */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Recent Winners
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentWinners.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No winners yet. Be the first!
                    </p>
                  ) : (
                    recentWinners.map((winner, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Trophy className="h-3 w-3 text-yellow-500" />
                          <span className="font-medium">{winner.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {winner.prize}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

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
                <p className="text-xs text-muted-foreground mt-3">
                  Probabilities based on wheel segments
                </p>
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
