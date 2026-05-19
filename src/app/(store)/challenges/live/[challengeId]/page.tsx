// app/(store)/challenges/live/[challengeId]/page.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ChallengesService } from "@/lib/services/challenges-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  TrendingUp,
  Users,
  Flame,
  Crown,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  Target,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Eye,
  Award,
  Medal,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Challenge } from "@/types/challenges";

interface Participant {
  id: string;
  user_id: string;
  current_score: number;
  current_rank: number;
  current_streak: number;
  users?: {
    full_name: string;
    avatar_url: string;
  };
  team_name?: string;
}

interface TickerEntry {
  id: string;
  user_name: string;
  team_name: string;
  action_text: string;
  points_awarded: number;
  created_at: string;
}

type LivePhase = "countdown" | "active" | "final_hour" | "ended";

const PHASE_CONFIG = {
  countdown: {
    label: "Starting Soon",
    icon: Clock,
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-900/50",
    border: "border-blue-500/30",
  },
  active: {
    label: "LIVE - Competition in Progress",
    icon: Zap,
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-900/50",
    border: "border-green-500/30",
  },
  final_hour: {
    label: "🔥 FINAL HOUR - DOUBLE POINTS 🔥",
    icon: Flame,
    color: "from-red-500 to-orange-500",
    bg: "bg-red-900/50",
    border: "border-red-500/30",
    animation: "animate-pulse",
  },
  ended: {
    label: "Challenge Complete",
    icon: Trophy,
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-900/50",
    border: "border-purple-500/30",
  },
};

export default function ChallengeLivePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { supabase } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [ticker, setTicker] = useState<TickerEntry[]>([]);
  const [phase, setPhase] = useState<LivePhase>("active");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(
    new Map(),
  );
  const [rankChanges, setRankChanges] = useState<
    Map<string, "up" | "down" | "flat">
  >(new Map());
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalPointsAwarded, setTotalPointsAwarded] = useState(0);
  const [lastAction, setLastAction] = useState<TickerEntry | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const challengesService = useRef<ChallengesService>(
    new ChallengesService(supabase),
  );
  const intervalRefs = useRef<{
    countdown?: NodeJS.Timeout;
    refresh?: NodeJS.Timeout;
  }>({});
  const subscriptionRefs = useRef<{ participants?: any; ticker?: any }>({});

  // Load challenge data
  const loadChallenge = useCallback(async () => {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (error) {
      console.error("Error loading challenge:", error);
      return;
    }

    setChallenge(data);

    // Determine phase based on timing
    if (data) {
      const now = new Date();
      const start = new Date(data.starts_at);
      const end = new Date(data.ends_at);
      const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (now < start) {
        setPhase("countdown");
      } else if (hoursLeft <= 1 && hoursLeft > 0) {
        setPhase("final_hour");
      } else if (now >= end) {
        setPhase("ended");
      } else {
        setPhase("active");
      }
    }
  }, [challengeId, supabase]);

  // Load leaderboard with rank change tracking - OPTIMIZED
  const loadLeaderboard = useCallback(async () => {
    try {
      const participants = await challengesService.current.getLeaderboard(
        challengeId,
        50,
      );

      if (!participants || participants.length === 0) return;

      // Calculate rank changes efficiently
      const changes = new Map<string, "up" | "down" | "flat">();
      const newRanks = new Map<string, number>();

      participants.forEach((p: Participant, index: number) => {
        const currentRank = index + 1;
        newRanks.set(p.user_id, currentRank);

        const previousRank = previousRanks.get(p.user_id);
        if (previousRank) {
          if (currentRank < previousRank) changes.set(p.user_id, "up");
          else if (currentRank > previousRank) changes.set(p.user_id, "down");
          else changes.set(p.user_id, "flat");
        } else {
          changes.set(p.user_id, "flat");
        }
      });

      // Batch state updates
      setLeaderboard(participants);
      setRankChanges(changes);
      setPreviousRanks(newRanks);
      setTotalParticipants(participants.length);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  }, [challengeId, previousRanks]);

  // Load total points awarded - OPTIMIZED with single query
  const loadTotalPoints = useCallback(async () => {
    try {
      const { data: actions } = await supabase
        .from("challenge_actions")
        .select("points_awarded")
        .eq("challenge_id", challengeId);

      const total =
        actions?.reduce((sum, a) => sum + (a.points_awarded || 0), 0) || 0;
      setTotalPointsAwarded(total);
    } catch (error) {
      console.error("Error loading total points:", error);
    }
  }, [challengeId, supabase]);

  // Load live ticker - OPTIMIZED with debounce
  const loadTicker = useCallback(async () => {
    try {
      const items = await challengesService.current.getLiveTicker(
        challengeId,
        20,
      );
      if (!items) return;

      setTicker(items);

      // Show last action as floating alert (only if different)
      if (items.length > 0) {
        const latestItem = items[0];
        setLastAction((prev) => {
          if (prev?.id !== latestItem.id) {
            // Play sound for new action
            if (isSoundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            return latestItem;
          }
          return prev;
        });

        // Auto-hide after 3 seconds
        setTimeout(() => setLastAction(null), 3000);
      }
    } catch (error) {
      console.error("Error loading ticker:", error);
    }
  }, [challengeId, isSoundEnabled]);

  // Update countdown timer - OPTIMIZED with requestAnimationFrame
  const updateCountdown = useCallback(() => {
    if (!challenge) return;

    const now = new Date();
    const target =
      phase === "countdown"
        ? new Date(challenge.starts_at)
        : new Date(challenge.ends_at);

    if (target > now) {
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    } else {
      setTimeRemaining("00:00:00");
    }
  }, [challenge, phase]);

  // Clean up all subscriptions and intervals
  const cleanup = useCallback(() => {
    // Unsubscribe from all channels
    Object.values(subscriptionRefs.current).forEach((sub) => {
      if (sub?.unsubscribe) sub.unsubscribe();
    });
    subscriptionRefs.current = {};

    // Clear all intervals
    Object.values(intervalRefs.current).forEach((interval) => {
      if (interval) clearInterval(interval);
    });
    intervalRefs.current = {};
  }, []);

  // Initialize real-time subscriptions with proper cleanup
  useEffect(() => {
    if (!challengeId) return;

    // Cleanup previous subscriptions
    cleanup();

    // Subscribe to participant changes with debounced updates
    const participantChannel = supabase
      .channel(`challenge-live-participants-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_participants",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          // Debounce leaderboard updates
          if (intervalRefs.current.refresh) {
            clearTimeout(intervalRefs.current.refresh as any);
          }
          intervalRefs.current.refresh = setTimeout(() => {
            loadLeaderboard();
            loadTotalPoints();
          }, 100) as any;
        },
      )
      .subscribe();

    // Subscribe to ticker changes
    const tickerChannel = supabase
      .channel(`challenge-live-ticker-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_live_ticker",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          loadTicker();
        },
      )
      .subscribe();

    subscriptionRefs.current = {
      participants: participantChannel,
      ticker: tickerChannel,
    };

    // Initial loads
    loadChallenge();
    loadLeaderboard();
    loadTicker();
    loadTotalPoints();

    // Countdown interval (only when needed)
    intervalRefs.current.countdown = setInterval(updateCountdown, 1000);

    return cleanup;
  }, [
    challengeId,
    supabase,
    loadChallenge,
    loadLeaderboard,
    loadTicker,
    loadTotalPoints,
    updateCountdown,
    cleanup,
  ]);

  // Fullscreen handling
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Memoize phase config to prevent re-renders
  const phaseConfig = PHASE_CONFIG[phase];
  const PhaseIcon = phaseConfig?.icon || Zap;
  const isFinalHour = phase === "final_hour";

  // Get top 3 for podium
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 15);

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-white">Loading live display...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden"
    >
      {/* Audio for new actions */}
      <audio ref={audioRef} src="/sounds/score-update.mp3" preload="auto" />

      {/* OBS Metadata */}
      <div className="hidden obs-metadata">
        <div data-title={challenge.name} />
        <div data-phase={phase} />
        <div data-participants={totalParticipants} />
        <div data-points={totalPointsAwarded} />
        <div data-top1={top3[0]?.users?.full_name || ""} />
        <div data-top1Score={top3[0]?.current_score || 0} />
      </div>

      {/* Header Banner with Phase Indicator */}
      <div
        className={cn(
          "bg-gradient-to-r py-4 px-6 text-white",
          phaseConfig?.color || "from-purple-600 to-pink-600",
        )}
      >
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 animate-pulse" />
                <span className="text-xs font-mono tracking-wider">
                  LIVE BROADCAST
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {challenge.name}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {challenge.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Banner */}
      <div
        className={cn(
          "border-b py-3 px-6",
          phaseConfig?.bg,
          phaseConfig?.border,
        )}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <PhaseIcon
                className={cn(
                  "h-5 w-5",
                  phase === "final_hour" && "animate-pulse",
                )}
              />
              <span
                className={cn(
                  "font-semibold",
                  phase === "final_hour" && "animate-pulse text-red-400",
                )}
              >
                {phaseConfig?.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-xl font-bold tracking-wider">
                  {timeRemaining}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-bold">{totalParticipants}</span>
                <span className="text-sm">participants</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-bold">
                  {totalPointsAwarded.toLocaleString()}
                </span>
                <span className="text-sm">points earned</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Hour Double Points Banner */}
      {isFinalHour && (
        <div className="bg-red-600/80 backdrop-blur py-2 px-6 text-center animate-pulse">
          <p className="text-white font-bold text-lg">
            ⚡ DOUBLE POINTS ACTIVE - EVERY ACTION COUNTS DOUBLE! ⚡
          </p>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        {/* Main Content - Sports Style Scoreboard */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Center/Left: Leaderboard - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Podium for Top 3 */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                {top3[1] && (
                  <div className="text-center order-1">
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-2">
                        <Medal className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                        2
                      </div>
                    </div>
                    <p className="font-bold text-white truncate max-w-[120px] mx-auto">
                      {top3[1].users?.full_name || "Anonymous"}
                    </p>
                    <p className="text-2xl font-bold text-gray-300">
                      {top3[1].current_score}
                    </p>
                    <Badge className="mt-1 bg-gray-500/20 text-gray-300">
                      Silver
                    </Badge>
                  </div>
                )}

                {/* 1st Place */}
                {top3[0] && (
                  <div className="text-center order-0 lg:order-2">
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-2 shadow-lg">
                        <Crown className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl">
                        1
                      </div>
                    </div>
                    <p className="font-bold text-white text-lg truncate max-w-[150px] mx-auto">
                      {top3[0].users?.full_name || "Anonymous"}
                    </p>
                    <p className="text-3xl font-bold text-yellow-400">
                      {top3[0].current_score}
                    </p>
                    <Badge className="mt-1 bg-yellow-500/20 text-yellow-400">
                      Champion
                    </Badge>
                  </div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <div className="text-center order-2 lg:order-1">
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mb-2">
                        <Medal className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-amber-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                        3
                      </div>
                    </div>
                    <p className="font-bold text-white truncate max-w-[120px] mx-auto">
                      {top3[2].users?.full_name || "Anonymous"}
                    </p>
                    <p className="text-2xl font-bold text-amber-400">
                      {top3[2].current_score}
                    </p>
                    <Badge className="mt-1 bg-amber-500/20 text-amber-400">
                      Bronze
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Scoreboard Table */}
            <Card className="bg-black/50 backdrop-blur border-white/10">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-sm font-medium text-purple-300">
                          Rank
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-purple-300">
                          Player
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-purple-300">
                          Points
                        </th>
                        <th className="text-center p-4 text-sm font-medium text-purple-300">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((participant, idx) => {
                        const rank = idx + 4;
                        const change = rankChanges.get(participant.user_id);
                        return (
                          <tr
                            key={participant.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-4 font-mono font-bold text-white">
                              #{rank}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-purple-400" />
                                </div>
                                <span className="text-white font-medium">
                                  {participant.users?.full_name || "Anonymous"}
                                </span>
                                {participant.team_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {participant.team_name}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right font-bold text-white">
                              {participant.current_score.toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              {change === "up" && (
                                <div className="inline-flex items-center gap-1 text-green-500">
                                  <ArrowUp className="h-4 w-4" />
                                  <span className="text-xs">↑</span>
                                </div>
                              )}
                              {change === "down" && (
                                <div className="inline-flex items-center gap-1 text-red-500">
                                  <ArrowDown className="h-4 w-4" />
                                  <span className="text-xs">↓</span>
                                </div>
                              )}
                              {change === "flat" && (
                                <div className="text-gray-500">—</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {rest.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-purple-300"
                          >
                            Waiting for participants...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Live Ticker & Prize Info */}
          <div className="space-y-6">
            {/* Live Ticker */}
            <Card className="bg-black/50 backdrop-blur border-white/10 h-[400px] flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Live Activity Feed
                  <Badge variant="outline" className="ml-2 text-purple-300">
                    {ticker.length} updates
                  </Badge>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ticker.length === 0 ? (
                  <div className="text-center py-8 text-purple-300">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Waiting for activity...</p>
                  </div>
                ) : (
                  ticker.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 animate-in fade-in slide-in-from-right duration-300"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-purple-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          <span className="font-medium">{item.user_name}</span>
                          {item.team_name && (
                            <span className="text-purple-400">
                              {" "}
                              ({item.team_name})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-purple-300">
                          {item.action_text}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className="bg-green-500/20 text-green-400">
                          +{item.points_awarded}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Prize Tiers */}
            <Card className="bg-black/50 backdrop-blur border-white/10">
              <div className="p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  Prize Tiers
                </h3>
                <div className="space-y-2">
                  {challenge.prize_tiers?.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        {tier.rank === 1 && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        {tier.rank === 2 && (
                          <Medal className="h-4 w-4 text-gray-400" />
                        )}
                        {tier.rank === 3 && (
                          <Medal className="h-4 w-4 text-amber-600" />
                        )}
                        <span className="text-white">Rank {tier.rank}</span>
                      </div>
                      <Badge variant="outline">
                        {tier.prize_type === "points" &&
                          `${tier.prize_value} points`}
                        {tier.prize_type === "discount" &&
                          `${tier.prize_value}% off`}
                        {tier.prize_type === "badge" && tier.prize_value}
                      </Badge>
                    </div>
                  ))}
                </div>

                {challenge.participation_points > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-purple-300">
                        Participation Prize
                      </span>
                      <Badge variant="outline">
                        {challenge.participation_points} points
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Streak Leader (if streak challenge) */}
            {challenge.challenge_type === "streak" && (
              <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                <div className="p-4 text-center">
                  <Flame className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">Longest Streak</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {Math.max(...leaderboard.map((p) => p.current_streak || 0))}{" "}
                    days
                  </p>
                </div>
              </Card>
            )}

            {/* Call to Action for Viewers */}
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
              <div className="p-4 text-center">
                <Target className="h-8 w-8 text-white mx-auto mb-2" />
                <h3 className="text-white font-bold">Want to Join?</h3>
                <p className="text-sm text-white/80 mt-1 mb-3">
                  Visit our challenges page to participate!
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    window.open(`/challenges/${challengeId}`, "_blank")
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Join Challenge
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Alert */}
      {lastAction && (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50">
            <div className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {lastAction.user_name}
                </p>
                <p className="text-xs text-green-300">
                  {lastAction.action_text} +{lastAction.points_awarded}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeInSlideRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-in {
          animation-name: fadeInSlideRight;
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}
