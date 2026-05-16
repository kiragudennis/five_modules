// app/(store)/spin/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { formatDistanceToNowStrict, format } from "date-fns";
import {
  Trophy,
  Users,
  Coins,
  Gift,
  Crown,
  Zap,
  Clock,
  Sparkles,
  TrendingUp,
  Eye,
  Star,
  Flame,
  Calendar,
  ChevronRight,
  Loader2,
  Ticket,
  Award,
  Target,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SpinGame {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  game_type: "standard" | "vip" | "new_customer" | "weekend" | "flash";
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  free_spins_per_day: number;
  free_spins_per_week: number;
  free_spins_total: number;
  points_per_paid_spin: number;
  eligible_tiers: string[];
  is_single_prize: boolean;
  single_prize_claimed: boolean;
  prize_config: Array<{
    label: string;
    type: string;
    value: string | number;
    color: string;
    probability: number;
  }>;
  live_theme: string;
  show_confetti: boolean;
  play_sounds: boolean;
}

interface LiveStats {
  active_players: number;
  spins_today: number;
  spins_total: number;
  recent_winners: Array<{
    user_name: string;
    prize: string;
    created_at: string;
  }>;
  top_prize: {
    label: string;
    value: string | number;
    color: string;
  } | null;
}

const GAME_TYPE_CONFIG = {
  standard: { icon: <Sparkles className="h-5 w-5" />, label: "Daily", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  vip: { icon: <Crown className="h-5 w-5" />, label: "VIP Exclusive", color: "from-yellow-500 to-amber-500", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  new_customer: { icon: <Users className="h-5 w-5" />, label: "Welcome Bonus", color: "from-green-500 to-emerald-500", bg: "bg-green-50 dark:bg-green-950/30" },
  weekend: { icon: <Calendar className="h-5 w-5" />, label: "Weekend Special", color: "from-purple-500 to-pink-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  flash: { icon: <Zap className="h-5 w-5" />, label: "Flash Game", color: "from-red-500 to-orange-500", bg: "bg-red-50 dark:bg-red-950/30" },
};

export default function SpinGamesIndexPage() {
  const { supabase, profile } = useAuth();
  const [games, setGames] = useState<SpinGame[]>([]);
  const [liveStats, setLiveStats] = useState<Record<string, LiveStats>>({});
  const [loading, setLoading] = useState(true);
  const [featuredGame, setFeaturedGame] = useState<SpinGame | null>(null);
  const [globalStats, setGlobalStats] = useState({
    total_spins: 0,
    active_players: 0,
    total_winners: 0,
  });

  const fetchGames = useCallback(async () => {
    const { data } = await supabase
      .from("spin_games")
      .select("*")
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });

    const gamesData = (data || []) as SpinGame[];
    setGames(gamesData);

    // Find featured game (first active game or highest prize)
    const featured = gamesData.find(g => g.is_active && g.game_type === "vip") || 
                     gamesData.find(g => g.is_active && g.is_single_prize) ||
                     gamesData.find(g => g.is_active);
    setFeaturedGame(featured || gamesData[0] || null);

    // Fetch live stats for each game
    for (const game of gamesData) {
      const [spinsRes, winnersRes, activeRes] = await Promise.all([
        supabase
          .from("spin_attempts")
          .select("id", { count: "exact", head: true })
          .eq("game_id", game.id)
          .gte("created_at", new Date().toISOString().split("T")[0]),
        supabase
          .from("spin_attempts")
          .select("user_id, prize_value, prize_type, created_at, profiles(full_name)")
          .eq("game_id", game.id)
          .not("prize_value", "is", null)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("spin_attempts")
          .select("user_id", { count: "exact", head: true })
          .eq("game_id", game.id)
          .gt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()),
      ]);

      const topPrize = game.prize_config?.find(p => 
        (p.type === "product" || p.type === "bundle" || (p.type === "points" && Number(p.value) > 500))
      ) || game.prize_config?.[0];

      setLiveStats(prev => ({
        ...prev,
        [game.id]: {
          active_players: activeRes.count || 0,
          spins_today: spinsRes.count || 0,
          spins_total: 0,
          recent_winners: (winnersRes.data || []).map((w: any) => ({
            user_name: w.profiles?.full_name || "Anonymous",
            prize: w.prize_type === "points" ? `${w.prize_value} Points` : w.prize_value,
            created_at: w.created_at,
          })),
          top_prize: topPrize ? { label: topPrize.label, value: topPrize.value, color: topPrize.color } : null,
        },
      }));
    }

    // Global stats
    const { count: totalSpins } = await supabase
      .from("spin_attempts")
      .select("id", { count: "exact", head: true });
    
    const { count: activePlayers } = await supabase
      .from("spin_attempts")
      .select("user_id", { count: "exact", head: true })
      .gt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    const { count: totalWinners } = await supabase
      .from("spin_attempts")
      .select("id", { count: "exact", head: true })
      .not("prize_value", "is", null)
      .gt("points_awarded", 0);

    setGlobalStats({
      total_spins: totalSpins || 0,
      active_players: activePlayers || 0,
      total_winners: totalWinners || 0,
    });

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchGames();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  const getTimeRemaining = (endsAt: string | null) => {
    if (!endsAt) return null;
    const end = new Date(endsAt);
    if (end < new Date()) return "Ended";
    return formatDistanceToNowStrict(end, { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground">Loading exciting games...</p>
        </div>
      </div>
    );
  }

  const activeGames = games.filter(g => g.is_active);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section - Live Broadcast Style */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-12">
          <div className="flex flex-col items-center text-center">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono uppercase tracking-wider">Live Now</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {activeGames.length} Active Games
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Spin & Win Big! 🎡
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mb-8">
              Test your luck and win amazing prizes. Every spin brings you closer to exclusive rewards!
            </p>

            {/* Live Stats Bar */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
              <div className="text-center">
                <div className="text-3xl font-bold">{globalStats.active_players}</div>
                <div className="text-sm opacity-80">Playing Now</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{globalStats.total_spins.toLocaleString()}</div>
                <div className="text-sm opacity-80">Total Spins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{globalStats.total_winners.toLocaleString()}</div>
                <div className="text-sm opacity-80">Happy Winners</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent" />
      </div>

      {/* Featured Game Banner */}
      {featuredGame && (
        <div className="container mx-auto px-4 -mt-8">
          <Link href={`/spin/${featuredGame.id}`}>
            <Card className={cn(
              "overflow-hidden hover:shadow-xl transition-all cursor-pointer border-2",
              featuredGame.is_single_prize && "border-yellow-500 animate-pulse"
            )}>
              <div className={cn(
                "bg-gradient-to-r p-6 text-white",
                GAME_TYPE_CONFIG[featuredGame.game_type]?.color || "from-blue-500 to-cyan-500"
              )}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {GAME_TYPE_CONFIG[featuredGame.game_type]?.icon}
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {GAME_TYPE_CONFIG[featuredGame.game_type]?.label}
                      </Badge>
                      {featuredGame.is_single_prize && !featuredGame.single_prize_claimed && (
                        <Badge className="bg-yellow-500 text-white border-0">
                          <Trophy className="h-3 w-3 mr-1" />
                          Grand Prize Available!
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{featuredGame.name}</h2>
                    <p className="opacity-90 max-w-lg">{featuredGame.description}</p>
                  </div>
                  <div className="text-center">
                    {liveStats[featuredGame.id]?.top_prize && (
                      <div className="mb-2">
                        <p className="text-sm opacity-80">Top Prize</p>
                        <p className="text-xl font-bold">{liveStats[featuredGame.id]?.top_prize?.label}</p>
                      </div>
                    )}
                    <Button size="lg" variant="secondary" className="gap-2">
                      Play Now <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Games Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">All Spin Games</h2>
            <p className="text-muted-foreground">Choose your game and start winning!</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {activeGames.length} Active
            </Badge>
          </div>
        </div>

        {activeGames.length === 0 && games.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Spin Games Available</h3>
              <p className="text-muted-foreground">Check back soon for exciting opportunities!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => {
              const stats = liveStats[game.id];
              const endsIn = getTimeRemaining(game.ends_at);
              const isLive = game.is_active && (!game.ends_at || new Date(game.ends_at) > new Date());
              const gameConfig = GAME_TYPE_CONFIG[game.game_type] || GAME_TYPE_CONFIG.standard;
              
              return (
                <Card key={game.id} className={cn(
                  "overflow-hidden hover:shadow-lg transition-all group relative",
                  isLive && "border-l-4 border-l-green-500"
                )}>
                  {isLive && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="default" className="bg-green-500 gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className={cn("pb-3", gameConfig.bg)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          {gameConfig.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{game.name}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">{gameConfig.label}</p>
                        </div>
                      </div>
                      {stats?.top_prize && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: stats.top_prize.color }}
                              >
                                <Trophy className="h-5 w-5 text-white" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Top Prize: {stats.top_prize.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {game.description || "Spin the wheel for a chance to win amazing prizes!"}
                    </p>

                    {/* Live Stats */}
                    {stats && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                          <p className="text-sm font-bold">{stats.active_players}</p>
                          <p className="text-xs text-muted-foreground">Playing</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
                          <p className="text-sm font-bold">{stats.spins_today}</p>
                          <p className="text-xs text-muted-foreground">Today</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <Award className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                          <p className="text-sm font-bold">{stats.recent_winners.length}</p>
                          <p className="text-xs text-muted-foreground">Winners</p>
                        </div>
                      </div>
                    )}

                    {/* Game Rules */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Free spins:</span>
                        <span className="font-medium">{game.free_spins_per_day}/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid spin:</span>
                        <span className="font-medium">{game.points_per_paid_spin} points</span>
                      </div>
                      {game.eligible_tiers.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Required tier:</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {game.eligible_tiers.join("+")}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Recent Winner */}
                    {stats?.recent_winners.length > 0 && (
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg p-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Trophy className="h-3 w-3 text-yellow-500" />
                          <span className="text-muted-foreground">Latest winner:</span>
                          <span className="font-medium truncate">
                            {stats.recent_winners[0].user_name} won {stats.recent_winners[0].prize}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Time Remaining */}
                    {endsIn && endsIn !== "Ended" && (
                      <div className="flex items-center gap-2 text-xs text-orange-500">
                        <Clock className="h-3 w-3" />
                        <span>Ends {endsIn}</span>
                      </div>
                    )}

                    {/* Prize Preview */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      {game.prize_config?.slice(0, 5).map((prize, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: prize.color }}
                        >
                          {prize.type === "points" && <Coins className="h-3 w-3" />}
                          {prize.type === "discount" && <span>%</span>}
                          {prize.type === "product" && <Gift className="h-3 w-3" />}
                        </div>
                      ))}
                      {game.prize_config?.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                          +{game.prize_config.length - 5}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button asChild className="flex-1 gap-2" disabled={!isLive}>
                        <Link href={`/spin/${game.id}`}>
                          <Target className="h-4 w-4" />
                          {isLive ? "Spin Now" : "Coming Soon"}
                        </Link>
                      </Button>
                      <Button asChild size="icon" variant="outline">
                        <Link href={`/spin/live/${game.id}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Recent Winners Ticker */}
        {games.some(g => liveStats[g.id]?.recent_winners?.length > 0) && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">Recent Winners</h3>
              <Badge variant="secondary">Live Updates</Badge>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 overflow-hidden">
              <div className="flex gap-6 animate-scroll-x whitespace-nowrap">
                {games.flatMap(g => 
                  (liveStats[g.id]?.recent_winners || []).map((winner, idx) => (
                    <div key={`${g.id}-${idx}`} className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{winner.user_name}</span>
                      <span>won</span>
                      <Badge variant="outline" className="text-xs">
                        {winner.prize}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNowStrict(new Date(winner.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add animation to globals.css */}
      <style jsx global>{`
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scroll-x 30s linear infinite;
        }
        .animate-scroll-x:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}