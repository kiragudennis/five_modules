// app/accounts/[accountId]/spin/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  Trophy,
  Flame,
  Zap,
  Star,
  Crown,
  TrendingUp,
  Share2,
  Users,
  Copy,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Wheel } from "react-custom-roulette";
import { toast } from "sonner";
import { format } from "date-fns";
import { SpinGame, SpinResult } from "@/types/customer";
import { motion, AnimatePresence } from "framer-motion";

export default function SpinPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [game, setGame] = useState<SpinGame | null>(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [spinsToday, setSpinsToday] = useState(0);
  const [recentResults, setRecentResults] = useState<SpinResult[]>([]);
  const [usingPoints, setUsingPoints] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [lastWin, setLastWin] = useState<any>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  useEffect(() => {
    if (!profile || profile.id !== accountId) {
      router.push("/login");
      return;
    }
    fetchSpinData();
  }, [accountId, profile]);

  const fetchSpinData = async () => {
    try {
      setInitialLoading(true);

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
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (gameError) {
        console.error("Error fetching game:", gameError);
        setInitialLoading(false);
        return;
      }

      // Parse JSON strings if needed
      if (gameData) {
        if (typeof gameData.wheel_config === "string") {
          gameData.wheel_config = JSON.parse(gameData.wheel_config);
        }
        if (typeof gameData.segment_colors === "string") {
          gameData.segment_colors = JSON.parse(gameData.segment_colors);
        }
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

      // Get total spin count for this user
      const { count, error: countError } = await supabase
        .from("spin_results")
        .select("*", { count: "exact", head: true })
        .eq("user_id", accountId);

      if (!countError && count) {
        setSpinCount(count);
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
        .limit(3);

      if (!resultsError && resultsData) {
        setRecentResults(resultsData);
      }
    } catch (error: any) {
      console.error("Error fetching spin data:", error);
      toast.error("Could not load spin game");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSpin = async () => {
    if (!game || spinning) return;

    if (spinsToday >= game.free_spins_per_day && !usingPoints) {
      toast.error("You've used all your free spins today", {
        icon: "😢",
        style: { background: "#fee", color: "#c00" },
      });
      return;
    }

    if (usingPoints) {
      if (loyaltyPoints < game.points_per_spin) {
        toast.error("Not enough loyalty points", { icon: "💔" });
        return;
      }
    }

    setSpinning(true);

    try {
      const random = Math.random();
      let cumulativeProbability = 0;
      let selectedSegment = 0;

      for (let i = 0; i < game.wheel_config.length; i++) {
        cumulativeProbability += game.wheel_config[i].probability || 0;
        if (random < cumulativeProbability) {
          selectedSegment = i;
          break;
        }
      }

      setPrizeNumber(selectedSegment);

      setTimeout(() => {
        setMustSpin(true);
      }, 50);

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
        setSpinsToday((prev) => prev + 1);
        setSpinCount((prev) => prev + 1);
        if (usingPoints) {
          setLoyaltyPoints((prev) => prev - game.points_per_spin);
        }
        refreshResults();
      }
    } catch (error: any) {
      console.error("Error recording spin:", error);
      toast.error("Could not complete spin");
      setMustSpin(false);
      setSpinning(false);
    }
  };

  const refreshResults = async () => {
    try {
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
    } catch (error) {
      console.error("Error refreshing results:", error);
    }
  };

  const handleSpinStop = () => {
    setMustSpin(false);
    setSpinning(false);
    const prize = game?.wheel_config[prizeNumber];
    setLastWin(prize);
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 2000);

    // Special toast for big wins
    if (prize?.type === "points" && parseInt(prize.value) > 50) {
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-xl shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <div>
              <p className="font-bold text-lg">🎉 JACKPOT! 🎉</p>
              <p className="text-sm">You won {prize.label}!</p>
            </div>
          </div>
        </motion.div>
      ));
    } else {
      toast.success(`✨ You won: ${prize?.label}! ✨`, {
        icon: "🎁",
        style: { background: "#4CAF50", color: "white" },
      });
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Game loading...</p>
        </div>
      </div>
    );
  }

  const getPrizeIcon = (type: string, className?: string) => {
    switch (type) {
      case "points":
        return <Coins className={className || "h-4 w-4 text-yellow-500"} />;
      case "discount":
        return <Ticket className={className || "h-4 w-4 text-green-500"} />;
      case "product":
        return <Gift className={className || "h-4 w-4 text-purple-500"} />;
      default:
        return <Award className={className || "h-4 w-4 text-blue-500"} />;
    }
  };

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
    <>
      {/* Win Animation Overlay */}
      <AnimatePresence>
        {showWinAnimation && lastWin && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
          >
            <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text animate-bounce">
              {lastWin.label}!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-2 py-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-10 w-10 text-yellow-500 animate-pulse" />
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text">
                WIN-A-TRON
              </h1>
              <Zap className="h-10 w-10 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground mt-2 text-lg">
              Spin the wheel and power up your Blessed Two experience!
            </p>
          </div>
          {/* Header with gaming flair */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-wrap items-center gap-4 mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/accounts/${accountId}`)}
              className="hover:scale-105 transition-transform backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </motion.div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                  {game.name}
                </h1>
              </div>
              {game.description && (
                <p className="text-muted-foreground mt-1 ml-11">
                  {game.description}
                </p>
              )}
            </div>
          </motion.div>

          {/* Gaming Stats Bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-3 mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  <span className="text-xs">Free Spins</span>
                </div>
                <p className="text-xl font-bold">
                  {Math.max(0, game.free_spins_per_day - spinsToday)}
                </p>
                <p className="text-[10px] opacity-80">left today</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  <span className="text-xs">Points</span>
                </div>
                <p className="text-xl font-bold">{loyaltyPoints}</p>
                <p className="text-[10px] opacity-80">available</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-none shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs">Total Spins</span>
                </div>
                <p className="text-xl font-bold">{spinCount}</p>
                <p className="text-[10px] opacity-80">all time</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Win Rate</span>
                </div>
                <p className="text-xl font-bold">
                  {recentResults.length > 0
                    ? Math.round(
                        (recentResults.filter((r) => r.prize_type !== "nothing")
                          .length /
                          recentResults.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="text-[10px] opacity-80">last 5 spins</p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Wheel with gaming effects */}
            <div className="lg:col-span-2 gap-4 flex flex-col">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
              >
                <Card className="border-2 border-purple-200 shadow-xl backdrop-blur-sm">
                  <CardContent className="pt-6">
                    {/* Points required to spin */}
                    {game.points_per_spin > 0 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {game.points_per_spin} pts/spin
                      </div>
                    )}

                    <div className="flex justify-center relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full blur-3xl opacity-30" />

                      {/* Wheel with decorative elements */}
                      <div className="relative">
                        <Wheel
                          mustStartSpinning={mustSpin}
                          prizeNumber={prizeNumber}
                          data={game.wheel_config.map((seg) => ({
                            option: seg.label,
                            style: { backgroundColor: seg.color },
                          }))}
                          onStopSpinning={handleSpinStop}
                          backgroundColors={game.wheel_config.map(
                            (seg) => seg.color,
                          )}
                          textDistance={70}
                          fontSize={14}
                          outerBorderColor="#333"
                          outerBorderWidth={3}
                          innerRadius={10}
                          radiusLineColor="#333"
                          radiusLineWidth={1}
                        />

                        {/* Center decoration */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 10,
                            ease: "linear",
                          }}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center"
                        >
                          <Star className="h-8 w-8 text-yellow-500" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 text-center">
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            size="lg"
                            onClick={() => {
                              setUsingPoints(false);
                              handleSpin();
                            }}
                            disabled={
                              spinning || spinsToday >= game.free_spins_per_day
                            }
                            className="min-w-[200px] bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-6 text-lg shadow-lg"
                          >
                            {spinning ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                SPINNING...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-5 w-5 mr-2" />
                                FREE SPIN (
                                {game.free_spins_per_day - spinsToday})
                              </>
                            )}
                          </Button>
                        </motion.div>

                        {loyaltyPoints >= game.points_per_spin && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={() => {
                                setUsingPoints(true);
                                handleSpin();
                              }}
                              disabled={spinning}
                              className="min-w-[200px] border-2 border-purple-400 bg-white/90 hover:bg-purple-50 font-bold py-6 text-lg"
                            >
                              <Coins className="h-5 w-5 mr-2 text-yellow-500" />
                              USE {game.points_per_spin} POINTS
                            </Button>
                          </motion.div>
                        )}
                      </div>

                      {game.rules && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-xs text-muted-foreground mt-4 italic"
                        >
                          {game.rules}
                        </motion.p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Gaming Tips Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-2 border-purple-200 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-xl">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                          🏆 BTE Rewards Zone
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          The ultimate place to be! Here's how to maximize your
                          experience:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Refer & Earn
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Get points when friends create account
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Share2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Share Products
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Earn points sharing with friends
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Gift className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Birthday/Anniversary
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Special presents on your special day
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <Trophy className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Win Direct Products
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Spin to win actual electronics!
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <Coins className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Redeem Points
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Use points to buy products
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-indigo-100 p-2 rounded-lg">
                            <Zap className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              Daily Free Spins
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {game.free_spins_per_day} free spins every day!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-xs text-muted-foreground italic border-t pt-3">
                        *Terms and conditions apply. Blessed Two Electronics -
                        Your Ultimate Electronics Destination! ✨
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right: Prizes & History with animations */}
            <div className="space-y-6">
              {/* Prizes Card */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-2 border-yellow-200 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-yellow-500" />
                      Prize Pool
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {game.wheel_config.map((segment, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onHoverStart={() => setHoveredSegment(index)}
                          onHoverEnd={() => setHoveredSegment(null)}
                          className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all"
                          style={{
                            backgroundColor: `${segment.color}20`,
                            scale: hoveredSegment === index ? 1.02 : 1,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: segment.color }}
                            />
                            <span className="flex items-center gap-1 font-medium">
                              {getPrizeIcon(segment.type)}
                              {segment.label}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {Math.round(segment.probability * 100)}%
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Wins Card */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-2 border-pink-200 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-pink-500" />
                      Recent Wins
                      {recentResults.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {recentResults.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentResults.length === 0 ? (
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-center text-muted-foreground py-8"
                      >
                        <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>No spins yet</p>
                        <p className="text-xs mt-1">Be the first to win!</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        <AnimatePresence>
                          {recentResults.map((result, index) => (
                            <motion.div
                              key={result.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="p-3 rounded-lg space-y-2 border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 2,
                                    }}
                                  >
                                    {getPrizeIcon(result.prize_type, "h-5 w-5")}
                                  </motion.div>
                                  <span className="font-medium capitalize">
                                    {result.prize_type}
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    result.is_claimed ? "default" : "outline"
                                  }
                                  className={
                                    result.is_claimed
                                      ? "bg-green-500 dark:bg-green-800"
                                      : ""
                                  }
                                >
                                  {result.is_claimed
                                    ? "Claimed ✓"
                                    : "Available"}
                                </Badge>
                              </div>

                              {result.prize_type === "discount" &&
                                result.coupon && (
                                  <div className="text-sm p-2 rounded border border-green-200">
                                    <p className="font-mono font-bold text-green-700">
                                      {result.coupon.code}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {result.coupon.discount_type ===
                                      "percentage"
                                        ? `${result.coupon.discount_value}% off`
                                        : `KES ${result.coupon.discount_value} off`}
                                      {result.coupon.valid_until &&
                                        ` · Expires ${format(new Date(result.coupon.valid_until), "MMM d")}`}
                                    </p>
                                  </div>
                                )}

                              {result.prize_type === "discount" &&
                                result.coupon && (
                                  <div className="text-sm bg-green-50 p-3 rounded border border-green-200">
                                    <div className="flex items-center justify-between">
                                      <p className="font-mono font-bold text-green-700">
                                        {result.coupon.code}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            result.coupon?.code || "",
                                          );
                                          toast.success("Coupon code copied!", {
                                            icon: "📋",
                                            style: {
                                              background: "#4CAF50",
                                              color: "white",
                                            },
                                          });
                                        }}
                                      >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {result.coupon.discount_type ===
                                      "percentage"
                                        ? `${result.coupon.discount_value}% off`
                                        : `KES ${result.coupon.discount_value} off`}
                                      {result.coupon.valid_until &&
                                        ` · Expires ${format(new Date(result.coupon.valid_until), "MMM d")}`}
                                    </p>
                                  </div>
                                )}

                              {result.prize_type === "points" &&
                                result.loyalty_points_awarded > 0 && (
                                  <div className="text-sm bg-blue-100 p-2 rounded border border-blue-200">
                                    <p className="text-blue-700 font-bold">
                                      +{result.loyalty_points_awarded} points
                                    </p>
                                  </div>
                                )}
                              {result.prize_type === "product" &&
                                result.product_name && (
                                  <div className="text-sm bg-purple-50 p-3 rounded border border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Gift className="h-5 w-5 text-purple-600" />
                                      <p className="font-bold text-purple-700">
                                        🎉 You won: {result.product_name}! 🎉
                                      </p>
                                    </div>

                                    <div className="space-y-2 mt-2">
                                      <p className="text-xs text-purple-800 font-medium">
                                        📞 To claim your prize:
                                      </p>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-100"
                                          onClick={() =>
                                            window.open(
                                              "https://wa.me/254700000000",
                                              "_blank",
                                            )
                                          }
                                        >
                                          <MessageCircle className="h-4 w-4 mr-2" />
                                          WhatsApp
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-100"
                                          onClick={() =>
                                            window.open("tel:+254700000000")
                                          }
                                        >
                                          <Phone className="h-4 w-4 mr-2" />
                                          Call
                                        </Button>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-2 italic">
                                        Our team will help you arrange
                                        collection/delivery of your prize.
                                        Please have your order details ready
                                        when contacting us.
                                      </p>
                                    </div>

                                    {!result.is_claimed && (
                                      <Badge
                                        variant="outline"
                                        className="mt-2 bg-yellow-50 text-yellow-700 border-yellow-300"
                                      >
                                        ⏰ Awaiting Claim
                                      </Badge>
                                    )}
                                  </div>
                                )}

                              <p className="text-xs text-muted-foreground">
                                {format(
                                  new Date(result.created_at),
                                  "MMM d, h:mm a",
                                )}
                              </p>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
