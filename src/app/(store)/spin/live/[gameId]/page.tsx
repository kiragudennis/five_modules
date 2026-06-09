// app/(store)/spin/live/[gameId]/page.tsx
// COMPLETELY FIXED - No glitches, all functionality preserved

"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SpinningWheelClientService } from "@/lib/services/spining-wheel-service.client";
import CurrentSpinner from "@/components/spin/current-spinner";
import LiveWheel from "@/components/spin/live-wheel";
import CountdownTimer from "@/components/spin/countdown-timer";
import ParticipantsLeaderboard from "@/components/spin/participants-leaderboard";
import WinnersFeed from "@/components/spin/winners-feed";
import {
  Trophy,
  Gift,
  Zap,
  Crown,
  Users,
  TrendingUp,
  Clock,
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

const GAME_TYPE_CONFIG = {
  standard: {
    icon: <Zap className="h-5 w-5" />,
    label: "Standard Spin",
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
    icon: <Gift className="h-5 w-5" />,
    label: "Welcome Bonus",
    color: "from-green-500 to-emerald-500",
    spinDuration: 1.0,
  },
  weekend: {
    icon: <Zap className="h-5 w-5" />,
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

export default function SpinLivePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { supabase } = useAuth();
  const [game, setGame] = useState<SpinGame | null>(null);
  const [loading, setLoading] = useState(true);

  // Wheel State - ONLY these affect the wheel component
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [mustSpin, setMustSpin] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [currentSpinner, setCurrentSpinner] = useState<{
    user_name: string;
  } | null>(null);

  // Data States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [recentWins, setRecentWins] = useState<Winner[]>([]);
  const [activeViewers, setActiveViewers] = useState(0);
  const [participantStats, setParticipantStats] = useState({
    total_participants: 0,
    total_spins: 0,
  });

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs
  const wheelServiceRef = useRef<SpinningWheelClientService | null>(null);
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null);
  const dataFetchedRef = useRef(false);

  // Initialize service
  if (!wheelServiceRef.current && supabase) {
    wheelServiceRef.current = new SpinningWheelClientService(supabase);
  }
  const wheelService = wheelServiceRef.current;

  // Memoized values - Stable references
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

  // Fullscreen handlers
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Fetch initial data ONCE
  useEffect(() => {
    if (!gameId || !wheelService || dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    const fetchData = async () => {
      try {
        const [gameData, participantsList, stats, winnersData] =
          await Promise.all([
            wheelService.getGame(gameId),
            wheelService.getAllParticipants(gameId, 50),
            wheelService.getParticipantStats(gameId),
            wheelService.getRecentWinners(gameId, 20),
          ]);

        if (gameData) setGame(gameData);
        if (participantsList) setParticipants(participantsList);
        if (stats) setParticipantStats(stats);
        if (winnersData) {
          setRecentWins(
            winnersData.map((w: any) => ({
              name: w.name,
              prize: w.prize,
              timestamp: w.timestamp ?? w.time ?? new Date().toISOString(),
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId, wheelService]);

  // Real-time subscriptions - NO MANUAL TIMEOUTS
  useEffect(() => {
    if (!supabase || !gameId) return;

    const channel = supabase
      .channel(`spin-live-${gameId}`)
      // Spin events
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spin_live_ticker",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const event = payload.new;

          if (event.action_type === "spin_start") {
            // Set prize index if available
            if (event.prize_index !== undefined && event.prize_index !== null) {
              setPrizeNumber(event.prize_index);
            }

            setCurrentSpinner({ user_name: event.user_name });
            setWheelSpinning(true);

            // Start spinning - wheel handles its own timing!
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setMustSpin(true);
              });
            });
          } else if (event.action_type === "win") {
            setRecentWins((prev) => [
              {
                name: event.user_name,
                prize: event.prize_text || "Prize!",
                timestamp: event.created_at,
              },
              ...prev.slice(0, 19),
            ]);

            if (winnerAudioRef.current) {
              winnerAudioRef.current.play().catch(() => {});
            }

            // Don't manually stop - let onStopSpinning handle it
            setCurrentSpinner(null);
          }
        },
      )
      // Participant updates
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "spin_attempts",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from("users")
            .select("id, full_name")
            .eq("id", payload.new.user_id)
            .single();

          if (userData) {
            const newParticipant = {
              id: userData.id,
              name: userData.full_name || "Anonymous",
              avatar: (userData.full_name?.charAt(0) || "?").toUpperCase(),
              first_spin_at: payload.new.created_at,
              spin_count: 1,
            };

            setParticipants((prev) => {
              const exists = prev.some((p) => p.id === newParticipant.id);
              if (!exists) return [newParticipant, ...prev.slice(0, 49)];
              return prev.map((p) =>
                p.id === newParticipant.id
                  ? { ...p, spin_count: p.spin_count + 1 }
                  : p,
              );
            });

            setParticipantStats((prev) => ({
              total_participants: prev.total_participants + 1,
              total_spins: prev.total_spins + 1,
            }));
          }
        },
      )
      // Grand prize updates
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
                name: "🎉 GRAND PRIZE WINNER! 🎉",
                prize: "Jackpot Winner!",
                timestamp: new Date().toISOString(),
              },
              ...prev.slice(0, 19),
            ]);
          }
        },
      )
      // Viewer presence
      .on("presence", { event: "sync" }, () => {
        setActiveViewers(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: "viewer",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, gameId]);

  // Handle wheel stop - THE ONLY PLACE mustSpin becomes false
  const handleStopSpinning = useCallback(() => {
    setMustSpin(false);
    setWheelSpinning(false);
    setCurrentSpinner(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Skeleton className="h-96 w-96 rounded-full" />
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
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
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

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="grid lg:grid-cols-14 gap-6">
          {/* LEFT: Participants */}
          <div className="lg:col-span-4 space-y-4">
            <ParticipantsLeaderboard
              participants={participants}
              totalParticipants={participantStats.total_participants}
            />
          </div>

          {/* CENTER: Wheel */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
              <div className="p-6">
                {/* Isolated spinner - won't re-render wheel */}
                <CurrentSpinner userName={currentSpinner?.user_name || null} />

                {/* Isolated countdown - won't re-render wheel */}
                {game.ends_at && new Date(game.ends_at) > new Date() && (
                  <div className="mb-4 text-center">
                    <CountdownTimer endsAt={game.ends_at} />
                  </div>
                )}

                {/* MEMOIZED WHEEL - Completely isolated from parent renders */}
                <div className="flex justify-center">
                  <LiveWheel
                    mustSpin={mustSpin}
                    prizeNumber={prizeNumber}
                    data={wheelData}
                    spinning={wheelSpinning}
                    onStopSpinning={handleStopSpinning}
                  />
                </div>

                {/* Game Info Badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r",
                      gameConfig.color,
                      "bg-opacity-20",
                    )}
                  >
                    {gameConfig.icon}
                    <span className="text-xs font-medium text-white">
                      {gameConfig.label}
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

          {/* RIGHT: Winners */}
          <div className="lg:col-span-4 space-y-4">
            <WinnersFeed winners={recentWins} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
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

        {/* CTA */}
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

      <audio
        ref={winnerAudioRef}
        src="/sounds/claim-chime.mp3"
        preload="auto"
        className="hidden"
      />
    </div>
  );
}
