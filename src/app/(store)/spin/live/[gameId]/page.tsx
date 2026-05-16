// app/(store)/spin/live/[gameId]/page.tsx
// Professional live broadcast page with funnel visualization: Participants → Wheel → Winners

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wheel } from "react-custom-roulette";
import { Skeleton } from "@/components/ui/skeleton";
import { SpinningWheelClientService } from "@/lib/services/spining-wheel-service.client";
import {
  Trophy,
  Gift,
  Zap,
  Crown,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  Sparkles,
  Medal,
  Star,
  Coins,
  ClockIcon,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SpinGame } from "@/types/spinning_wheel";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  first_spin_at: string;
  spin_count: number;
}

interface Winner {
  name: string;
  prize: string;
  timestamp: string;
}

export default function SpinLivePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { supabase } = useAuth();
  const [game, setGame] = useState<SpinGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("0h 0m 0s");

  // Create service instance
  const wheelService = new SpinningWheelClientService(supabase);

  // Funnel States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentSpinner, setCurrentSpinner] = useState<any>(null);
  const [recentWins, setRecentWins] = useState<Winner[]>([]);

  // Stats States
  const [activeViewers, setActiveViewers] = useState(0);
  const [participantStats, setParticipantStats] = useState({
    total_participants: 0,
    total_spins: 0,
  });

  // Wheel Animation State
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [mustSpin, setMustSpin] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const spinningTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen toggle function
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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

  // Fetch game data
  const fetchGameData = useCallback(async () => {
    if (!gameId) return;
    try {
      const gameData = await wheelService.getGame(gameId);
      if (gameData) {
        setGame(gameData);
      } else {
        setGame(null);
      }
    } catch (error) {
      console.error("Error fetching game:", error);
      setGame(null);
    } finally {
      setLoading(false);
    }
  }, [gameId, wheelService]);

  // Fetch participants and stats
  const fetchParticipants = useCallback(async () => {
    if (!gameId) return;
    try {
      const participantsList = await wheelService.getAllParticipants(
        gameId,
        50,
      );
      setParticipants(participantsList || []);

      const stats = await wheelService.getParticipantStats(gameId);
      setParticipantStats(stats || { total_participants: 0, total_spins: 0 });
    } catch (error) {
      console.error("Error fetching participants:", error);
      setParticipants([]);
      setParticipantStats({ total_participants: 0, total_spins: 0 });
    }
  }, [gameId, wheelService]);

  // Fetch recent winners
  const fetchRecentWinners = useCallback(async () => {
    if (!gameId) return;
    try {
      const winnersData = await wheelService.getRecentWinners(gameId, 20);
      setRecentWins(
        (winnersData || []).map((winner: any) => ({
          name: winner.name,
          prize: winner.prize,
          timestamp:
            winner.timestamp ?? winner.time ?? new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error("Error fetching winners:", error);
      setRecentWins([]);
    }
  }, [gameId, wheelService]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!supabase || !gameId) return;

    // Subscribe to new participants
    const unsubscribeParticipants = wheelService.subscribeToParticipants(
      gameId,
      (newParticipant) => {
        // Add to participants list if not already there
        setParticipants((prev) => {
          const exists = prev.some((p) => p.id === newParticipant.id);
          if (!exists) {
            return [newParticipant, ...prev.slice(0, 49)];
          }
          // Update spin count for existing participant
          return prev.map((p) =>
            p.id === newParticipant.id
              ? { ...p, spin_count: p.spin_count + 1 }
              : p,
          );
        });

        // Update stats
        setParticipantStats((prev) => ({
          total_participants: prev.total_participants + 1,
          total_spins: prev.total_spins + 1,
        }));
      },
    );

    // Presence channel for active viewers
    const presenceChannel = supabase.channel(`live-viewers-${gameId}`);
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        setActiveViewers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: "viewer",
            online_at: new Date().toISOString(),
          });
        }
      });

    // Spin attempts channel for wheel animation
    const spinChannel = supabase
      .channel(`spin-events-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spin_attempts",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          const newRecord = payload.new;

          // Fetch user name
          const { data: userData } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", newRecord.user_id)
            .single();

          const userName = userData?.full_name || "Someone";

          // Set current spinner to trigger wheel animation
          setCurrentSpinner({
            id: newRecord.id,
            user_id: newRecord.user_id,
            user_name: userName,
            is_spinning: true,
            started_at: new Date().toISOString(),
          });

          // Trigger wheel animation
          setWheelSpinning(true);

          // Randomly select a prize index for animation
          const randomIndex = Math.floor(
            Math.random() * (game?.prize_config.length || 10),
          );
          setPrizeNumber(randomIndex);
          setMustSpin(true);

          // Clear any existing timeout
          if (spinningTimeoutRef.current) {
            clearTimeout(spinningTimeoutRef.current);
          }

          // Stop animation after spin duration
          spinningTimeoutRef.current = setTimeout(async () => {
            setMustSpin(false);
            setWheelSpinning(false);

            // If it's a winner, add to recent wins
            if (newRecord.points_awarded > 0 || newRecord.prize_value) {
              const prizeText =
                newRecord.prize_type === "points"
                  ? `${newRecord.points_awarded} Points`
                  : newRecord.prize_value;

              setRecentWins((prev) => [
                {
                  name: userName,
                  prize: prizeText,
                  timestamp: newRecord.created_at,
                },
                ...prev.slice(0, 19),
              ]);
            }

            setCurrentSpinner(null);

            // Refresh stats
            const stats = await wheelService.getParticipantStats(gameId);
            setParticipantStats(stats);
          }, 3000);
        },
      )
      .subscribe();

    // Game updates channel (for grand prize)
    const gameChannel = supabase
      .channel(`game-updates-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "spin_games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (
            payload.new.single_prize_claimed &&
            !payload.old.single_prize_claimed
          ) {
            setGame(payload.new as SpinGame);
            setRecentWins((prev) => [
              {
                name: "GRAND PRIZE WINNER! 🎉",
                prize: "Jackpot Winner!",
                timestamp: new Date().toISOString(),
              },
              ...prev.slice(0, 19),
            ]);
          }
        },
      )
      .subscribe();

    return () => {
      unsubscribeParticipants();
      presenceChannel.unsubscribe();
      spinChannel.unsubscribe();
      gameChannel.unsubscribe();
      if (spinningTimeoutRef.current) {
        clearTimeout(spinningTimeoutRef.current);
      }
    };
  }, [supabase, gameId, game?.prize_config.length, wheelService]);

  // Initial data fetch
  useEffect(() => {
    fetchGameData();
    fetchParticipants();
    fetchRecentWinners();
  }, [fetchGameData, fetchParticipants, fetchRecentWinners]);

  // Refresh stats periodically
  useEffect(() => {
    if (!gameId) return;
    const interval = setInterval(() => {
      fetchParticipants();
      fetchRecentWinners();
    }, 30000);
    return () => clearInterval(interval);
  }, [gameId, fetchParticipants, fetchRecentWinners]);

  const wheelData = game
    ? game.prize_config.map((prize) => ({
        option: prize.label,
        style: { backgroundColor: prize.color },
      }))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center">
            <Skeleton className="h-96 w-96 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">This spin game doesn't exist</p>
        </div>
      </div>
    );
  }

  const gameTypeConfig = {
    standard: {
      icon: <Zap className="h-5 w-5" />,
      label: "Standard Spin",
      color: "from-blue-500 to-cyan-500",
    },
    vip: {
      icon: <Crown className="h-5 w-5" />,
      label: "VIP Exclusive",
      color: "from-yellow-500 to-amber-500",
    },
    new_customer: {
      icon: <Gift className="h-5 w-5" />,
      label: "Welcome Bonus",
      color: "from-green-500 to-emerald-500",
    },
    weekend: {
      icon: <Zap className="h-5 w-5" />,
      label: "Weekend Special",
      color: "from-purple-500 to-pink-500",
    },
    flash: {
      icon: <Zap className="h-5 w-5" />,
      label: "Flash Game",
      color: "from-red-500 to-orange-500",
    },
  }[game.game_type];

  // Get top 3 participants for medal display
  const topParticipants = participants.slice(0, 3);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 border-b backdrop-blur-sm bg-purple-950/80 border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-mono">
                  LIVE BROADCAST
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{game.name}</h1>
              <p className="text-sm text-purple-300">{game.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* OBS/Fullscreen Button - Added back */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                title={
                  isFullscreen
                    ? "Exit Fullscreen"
                    : "Enter Fullscreen (OBS Mode)"
                }
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 text-purple-400" />
                ) : (
                  <Maximize2 className="h-3 w-3 text-purple-400" />
                )}
                <span className="text-xs text-purple-300 hidden sm:inline">
                  {isFullscreen ? "Exit" : "OBS Mode"}
                </span>
              </button>

              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20">
                <Users className="h-3 w-3 text-purple-400" />
                <span className="text-sm text-white">{activeViewers}</span>
                <span className="text-xs text-purple-300">watching</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-sm text-white">
                  {participantStats.total_spins}
                </span>
                <span className="text-xs text-purple-300">spins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Funnel Layout */}
      <div className="px-4 py-6">
        <div className="grid lg:grid-cols-14 gap-6">
          {/* LEFT COLUMN: Participants Leaderboard */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur border-blue-500/30">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    Participants Leaderboard
                  </h3>
                  <Badge
                    variant="outline"
                    className="border-blue-500/50 text-blue-300"
                  >
                    {participantStats.total_participants} players
                  </Badge>
                </div>

                {/* Top 3 Medals */}
                {topParticipants.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-400 mb-2">
                      🏆 TOP SPINNERS
                    </p>
                    <div className="space-y-2">
                      {topParticipants.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <div className="w-6 text-center">
                            {idx === 0 && (
                              <Medal className="h-4 w-4 text-yellow-400" />
                            )}
                            {idx === 1 && (
                              <Medal className="h-4 w-4 text-gray-400" />
                            )}
                            {idx === 2 && (
                              <Medal className="h-4 w-4 text-amber-600" />
                            )}
                            {idx > 2 && (
                              <span className="text-xs text-purple-300">
                                #{idx + 1}
                              </span>
                            )}
                          </div>
                          <Avatar className="h-6 w-6 bg-purple-600">
                            <AvatarFallback className="text-xs">
                              {p.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-white flex-1">
                            {p.name}
                          </span>
                          <span className="text-xs text-purple-300">
                            {p.spin_count} spins
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Participants List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {participants.length === 0 ? (
                    <div className="text-center py-8 text-purple-300 text-sm">
                      Waiting for players...
                    </div>
                  ) : (
                    participants.map((participant, idx) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all animate-in fade-in slide-in-from-left duration-300"
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8 bg-purple-600">
                            <AvatarFallback>
                              {participant.avatar}
                            </AvatarFallback>
                          </Avatar>
                          {idx === 0 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {participant.name}
                          </p>
                          <p className="text-xs text-purple-300">
                            {participant.spin_count} spin
                            {participant.spin_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-purple-400" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* CENTER COLUMN: Wheel (Action) */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
              <div className="p-6">
                {/* Current Spinner Indicator */}
                {currentSpinner && (
                  <div className="mb-4 text-center animate-in fade-in slide-in-from-top duration-300">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/50">
                      <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
                      <span className="text-sm font-medium text-yellow-400">
                        {currentSpinner.user_name} is spinning...
                      </span>
                    </div>
                  </div>
                )}

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
                <div className="flex justify-center">
                  <div className="relative">
                    <Wheel
                      mustStartSpinning={mustSpin}
                      prizeNumber={prizeNumber}
                      data={wheelData}
                      onStopSpinning={() => {
                        setMustSpin(false);
                        setWheelSpinning(false);
                      }}
                      outerBorderColor="#9333ea"
                      outerBorderWidth={3}
                      innerRadius={5}
                      radiusLineColor="#9333ea"
                      radiusLineWidth={2}
                      textDistance={65}
                      fontSize={14}
                      textColors={["#ffffff"]}
                      backgroundColors={["#1e1b4b"]}
                    />

                    {/* Spin Overlay Effect */}
                    {wheelSpinning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse rounded-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Info Badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r",
                      gameTypeConfig.color,
                      "bg-opacity-20",
                    )}
                  >
                    {gameTypeConfig.icon}
                    <span className="text-xs font-medium text-white">
                      {gameTypeConfig.label}
                    </span>
                  </div>
                  {game.is_single_prize && !game.single_prize_claimed && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 animate-pulse">
                      <Trophy className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-400">
                        GRAND PRIZE
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Winners Feed */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur border-green-500/30">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    Recent Winners
                  </h3>
                  <Badge
                    variant="outline"
                    className="border-green-500/50 text-green-300"
                  >
                    {recentWins.length} wins
                  </Badge>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {recentWins.length === 0 ? (
                    <div className="text-center py-8 text-purple-300 text-sm">
                      No winners yet. Be the first!
                    </div>
                  ) : (
                    recentWins.map((win, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all animate-in fade-in slide-in-from-right duration-300"
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <div className="flex-shrink-0">
                          {win.prize.includes("Points") ? (
                            <Coins className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <Sparkles className="h-5 w-5 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {win.name}
                          </p>
                          <p className="text-xs text-green-300">
                            Won {win.prize}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-purple-300">
                            {new Date(win.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* BOTTOM SECTION: Prize Pool & Stats */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {/* Prize Pool Details */}
          <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur border-purple-500/30">
            <div className="p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-400" />
                Prize Pool Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {game.prize_config.map((prize, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: prize.color }}
                      />
                      <span className="text-xs text-white">{prize.label}</span>
                    </div>
                    <span className="text-xs text-purple-300">
                      {prize.probability}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Live Statistics */}
          <Card className="bg-gradient-to-br from-pink-900/40 to-red-900/40 backdrop-blur border-pink-500/30">
            <div className="p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-pink-400" />
                Live Statistics
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <div className="text-xl font-bold text-yellow-400">
                    {activeViewers}
                  </div>
                  <div className="text-xs text-purple-300">Active Viewers</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <div className="text-xl font-bold text-green-400">
                    {participantStats.total_participants}
                  </div>
                  <div className="text-xs text-purple-300">Total Players</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <div className="text-xl font-bold text-blue-400">
                    {participantStats.total_spins}
                  </div>
                  <div className="text-xs text-purple-300">Total Spins</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-6">
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
            <div className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white mb-1">
                Want to join the fun?
              </h3>
              <p className="text-sm text-purple-100 mb-3">
                Spin the wheel for your chance to win amazing prizes!
              </p>
              <button
                onClick={() => window.open(`/spin/${gameId}`, "_blank")}
                className="bg-white text-purple-600 hover:bg-purple-100 font-semibold py-2 px-6 rounded-lg transition-all"
              >
                Play Now →
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
