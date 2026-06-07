// app/(store)/challenges/live/[challengeId]/page.tsx (REFACTORED)
// Challenge Live Display - Real-time leaderboard, live ticker, and dynamic visuals
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  ShoppingBag,
  UserCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Challenge } from "@/types/challenges";
import { formatDistanceToNow } from "date-fns";

// ─── Types ──────────────────────────────────────────────
interface Participant {
  id: string;
  user_id: string;
  current_score: number;
  current_rank: number;
  current_streak: number;
  users?: { full_name: string; avatar_url: string };
  team_name?: string;

  // Trivia-specific extras
  correct_answers?: number;
  questions_answered?: number;
  accuracy?: number;
  fastest_response_ms?: number;
  best_streak?: number;
  full_name?: string; // for team challenges where user info is not joined in participant query
  total_score?: number; // for trivia to show total score instead of current score (if different)
}

interface TickerEntry {
  id: string;
  user_name: string;
  team_name?: string;
  action_text: string;
  points_awarded: number;
  created_at: string;
}

type LivePhase = "countdown" | "active" | "final_hour" | "ended";

const PHASE_CONFIG: Record<
  LivePhase,
  {
    label: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    animation?: string;
  }
> = {
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

// ─── Helpers ────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// ─── Component ──────────────────────────────────────────
export default function ChallengeLivePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { supabase } = useAuth();

  // ─── Core State ───────────────────────────────────────
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [ticker, setTicker] = useState<TickerEntry[]>([]);
  const [phase, setPhase] = useState<LivePhase>("active");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalPointsAwarded, setTotalPointsAwarded] = useState(0);
  const [lastAction, setLastAction] = useState<TickerEntry | null>(null);

  // Rank tracking
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(
    new Map(),
  );
  const [rankChanges, setRankChanges] = useState<
    Map<string, "up" | "down" | "flat">
  >(new Map());

  // ─── Type-Specific State (single object, lazily populated) ───
  const [typeData, setTypeData] = useState<Record<string, any>>({});

  // ─── Refs ─────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const countdownRef = useRef<NodeJS.Timeout>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout>(null);
  const triviaTimerRef = useRef<NodeJS.Timeout>(null);
  const challengesService = useRef(new ChallengesService(supabase));

  // ─── Data Loaders ─────────────────────────────────────
  const loadChallenge = useCallback(async () => {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();
    if (!data) return;
    setChallenge(data);
    const now = Date.now();
    const start = new Date(data.starts_at).getTime();
    const end = new Date(data.ends_at).getTime();
    const hoursLeft = (end - now) / 36e5;
    if (now < start) setPhase("countdown");
    else if (hoursLeft <= 1 && hoursLeft > 0) setPhase("final_hour");
    else if (now >= end) setPhase("ended");
    else setPhase("active");
  }, [challengeId, supabase]);

  const loadLeaderboard = useCallback(async () => {
    // Check if challenge is trivia type
    if (challenge?.challenge_type === "trivia") {
      // Trivia leaderboard is loaded via loadTypeData, but we can also load it here
      const { data } = await supabase.rpc("get_trivia_leaderboard", {
        p_challenge_id: challengeId,
        p_limit: 50,
      });
      if (!data?.length) return;

      // Normalize trivia data to match participant structure
      const normalized = data.map((entry: any) => ({
        id: entry.user_id,
        user_id: entry.user_id,
        current_score: entry.total_score,
        current_rank: entry.current_rank,
        current_streak: entry.current_streak || 0,
        users: {
          full_name: entry.full_name,
          avatar_url: null,
        },
        // Trivia-specific extras
        correct_answers: entry.correct_answers,
        questions_answered: entry.questions_answered,
        accuracy: entry.accuracy,
        fastest_response_ms: entry.fastest_response_ms,
        best_streak: entry.best_streak,
      }));

      console.log("Normalized Trivia Leaderboard:", normalized);

      const changes = new Map<string, "up" | "down" | "flat">();
      const newRanks = new Map<string, number>();
      normalized.forEach((p: any, i: number) => {
        const rank = i + 1;
        newRanks.set(p.user_id, rank);
        const prev = previousRanks.get(p.user_id);
        changes.set(
          p.user_id,
          prev ? (rank < prev ? "up" : rank > prev ? "down" : "flat") : "flat",
        );
      });

      setLeaderboard(normalized);
      setRankChanges(changes);
      setPreviousRanks(newRanks);
      setTotalParticipants(normalized.length);
      return;
    }

    const participants = await challengesService.current.getLeaderboard(
      challengeId,
      50,
    );
    if (!participants?.length) return;
    const changes = new Map<string, "up" | "down" | "flat">();
    const newRanks = new Map<string, number>();
    participants.forEach((p: Participant, i: number) => {
      const rank = i + 1;
      newRanks.set(p.user_id, rank);
      const prev = previousRanks.get(p.user_id);
      changes.set(
        p.user_id,
        prev ? (rank < prev ? "up" : rank > prev ? "down" : "flat") : "flat",
      );
    });
    setLeaderboard(participants);
    setRankChanges(changes);
    setPreviousRanks(newRanks);
    setTotalParticipants(participants.length);
  }, [challengeId, previousRanks]);

  const loadTicker = useCallback(async () => {
    const items = await challengesService.current.getLiveTicker(
      challengeId,
      20,
    );
    if (!items?.length) return;
    setTicker(items);
    const latest = items[0];
    setLastAction((prev) => {
      if (prev?.id !== latest.id) {
        if (isSoundEnabled && audioRef.current)
          audioRef.current.play().catch(() => {});
        return latest;
      }
      return prev;
    });
    setTimeout(() => setLastAction(null), 3000);
  }, [challengeId, isSoundEnabled]);

  const loadTotalPoints = useCallback(async () => {
    const { data } = await supabase
      .from("challenge_actions")
      .select("points_awarded")
      .eq("challenge_id", challengeId);
    setTotalPointsAwarded(
      data?.reduce((s, a) => s + (a.points_awarded || 0), 0) || 0,
    );
  }, [challengeId, supabase]);

  // ─── Type-Specific Loaders ────────────────────────────
  const loadTypeData = useCallback(
    async (type: string) => {
      if (!challengeId) return;
      const d: Record<string, any> = {};

      if (type === "team") {
        const [{ data: teams }, { data: tickerData }] = await Promise.all([
          supabase
            .from("challenge_teams")
            .select("*")
            .eq("challenge_id", challengeId)
            .order("total_team_spending", { ascending: false })
            .limit(5),
          supabase
            .from("challenge_live_ticker")
            .select("*")
            .eq("challenge_id", challengeId)
            .not("team_name", "is", null)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);
        const totalSpending =
          teams?.reduce((s, t) => s + (t.total_team_spending || 0), 0) || 0;
        const dayAgo = new Date(Date.now() - 864e5).toISOString();
        const { data: active } = await supabase
          .from("challenge_team_spending")
          .select("team_id")
          .eq("challenge_id", challengeId)
          .gte("spending_date", dayAgo);
        d.teamLeaderboard = teams || [];
        d.totalTeams = teams?.length || 0;
        d.totalTeamSpending = totalSpending;
        d.activeTeams = new Set(active?.map((s) => s.team_id)).size;
        d.teamActivities = (tickerData || []).map((t) => ({
          team_name: t.team_name,
          action: t.action_text,
          points: t.points_awarded,
        }));
      }

      if (type === "purchase") {
        const { data: lb } = await supabase.rpc(
          "get_purchase_challenge_leaderboard",
          { p_challenge_id: challengeId, p_limit: 20 },
        );
        d.purchaseLeaderboard = lb || [];
        d.totalUnitsSold =
          lb?.reduce((s: number, e: any) => s + (e.total_units || 0), 0) || 0;
        d.purchaseParticipants = lb?.length || 0;
        if (challenge?.scoring_config?.product_id) {
          const { data: rev } = await supabase
            .from("order_items")
            .select("total_price")
            .eq("product_id", challenge.scoring_config.product_id)
            .gte("created_at", challenge.starts_at)
            .lte("created_at", challenge.ends_at);
          d.totalRevenue =
            rev?.reduce((s, i) => s + (i.total_price || 0), 0) || 0;
        }
        const { data: acts } = await supabase
          .from("challenge_actions")
          .select(
            "user_id, points_awarded, action_value, action_metadata, created_at, users:user_id(full_name)",
          )
          .eq("challenge_id", challengeId)
          .eq("action_type", "purchase_made")
          .order("created_at", { ascending: false })
          .limit(20);
        d.purchaseActivities = (acts || []).map((a) => ({
          user_name: a.users?.full_name || "Anonymous",
          units: a.action_value,
          points: a.points_awarded,
          created_at: a.created_at,
        }));
      }

      if (type === "referral") {
        const { data: lb } = await supabase.rpc(
          "get_referral_challenge_leaderboard",
          { p_challenge_id: challengeId, p_limit: 20 },
        );
        d.referralLeaderboard = lb || [];
        d.referralTotalConversions =
          lb?.reduce((s: number, e: any) => s + (e.total_referrals || 0), 0) ||
          0;
        d.referralSignups =
          lb?.reduce((s: number, e: any) => s + (e.signup_referrals || 0), 0) ||
          0;
        d.referralPurchases =
          lb?.reduce(
            (s: number, e: any) => s + (e.purchase_referrals || 0),
            0,
          ) || 0;
        const { data: acts } = await supabase
          .from("challenge_actions")
          .select(
            "user_id, points_awarded, action_metadata, created_at, users:user_id(full_name)",
          )
          .eq("challenge_id", challengeId)
          .eq("action_type", "referral_completed")
          .order("created_at", { ascending: false })
          .limit(20);
        d.referralActivities = (acts || []).map((a) => ({
          user_name: a.users?.full_name || "Anonymous",
          type: a.action_metadata?.conversion_type || "unknown",
          points: a.points_awarded,
          created_at: a.created_at,
        }));
      }

      if (type === "trivia") {
        const [{ data: lb }, { data: q }] = await Promise.all([
          supabase.rpc("get_trivia_leaderboard", {
            p_challenge_id: challengeId,
            p_limit: 20,
          }),
          supabase.rpc("get_trivia_queue_status", {
            p_challenge_id: challengeId,
          }),
        ]);
        d.triviaLeaderboard = lb || [];
        d.participantQueue = q || [];
      }

      setTypeData(d);
    },
    [challengeId, supabase, challenge],
  );

  // ─── Trivia Helpers ───────────────────────────────────
  const loadTriviaQuestion = useCallback(
    async (questionId: string) => {
      const { data } = await supabase
        .from("challenge_trivia_questions")
        .select("*")
        .eq("id", questionId)
        .single();
      if (!data) return;
      setTypeData((prev) => ({
        ...prev,
        triviaCurrentQuestion: data,
        triviaTimeLeft: data.time_limit_seconds || 5,
      }));
      if (triviaTimerRef.current) clearInterval(triviaTimerRef.current);
      let left = data.time_limit_seconds || 5;
      triviaTimerRef.current = setInterval(() => {
        left--;
        setTypeData((prev) => ({ ...prev, triviaTimeLeft: left }));
        if (left <= 0 && triviaTimerRef.current)
          clearInterval(triviaTimerRef.current);
      }, 1000);
    },
    [supabase],
  );

  // ─── Unified Real-Time Channel ────────────────────────
  useEffect(() => {
    if (!challengeId) return;

    // Initial load
    loadChallenge().then(() => {
      // type-specific data will load after challenge is set
    });
    loadLeaderboard();
    loadTicker();
    loadTotalPoints();

    // Build a SINGLE channel listening to all relevant tables
    const ch = supabase.channel(`live-display-${challengeId}`);

    // Participants changes → refresh leaderboard (debounced)
    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "challenge_participants",
        filter: `challenge_id=eq.${challengeId}`,
      },
      () => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
          loadLeaderboard();
          loadTotalPoints();
        }, 200);
      },
    );

    // Live ticker → refresh ticker
    ch.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "challenge_live_ticker",
        filter: `challenge_id=eq.${challengeId}`,
      },
      () => loadTicker(),
    );

    // Team spending → reload type data if team challenge
    ch.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "challenge_team_spending",
        filter: `challenge_id=eq.${challengeId}`,
      },
      () => {
        if (challenge?.challenge_type === "team") loadTypeData("team");
      },
    );

    // Trivia selections → handle trivia broadcast
    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "challenge_trivia_selections",
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload) => {
        if (!challenge || challenge.challenge_type !== "trivia") return;
        const sel = payload.new as any;
        setTypeData((prev) => {
          const next = { ...prev };
          if (payload.eventType === "INSERT") {
            next.triviaSelectedPlayer = sel;
            next.triviaPhase = "question";
            next.triviaRevealAnswer = false;
            loadTriviaQuestion(sel.question_id);
            loadTypeData("trivia");
          } else if (payload.eventType === "UPDATE") {
            next.triviaSelectedPlayer = sel;
            next.triviaPlayerAnswer = sel.selected_answer ?? null;
            if (sel.status === "answered" || sel.status === "timeout") {
              next.triviaPhase = "reveal";
              setTimeout(() => {
                setTypeData((p) => ({ ...p, triviaRevealAnswer: true }));
                loadTypeData("trivia");
              }, 3000);
            }
          }
          return next;
        });
      },
    );

    // Ticker spinning messages → set trivia phase
    ch.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "challenge_live_ticker",
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload) => {
        if (payload.new.action_text?.includes("Spinning")) {
          setTypeData((prev) => ({ ...prev, triviaPhase: "spinning" }));
        }
      },
    );

    ch.subscribe();
    channelRef.current = ch;

    // Countdown
    countdownRef.current = setInterval(() => {
      if (!challenge) return;
      const now = Date.now();
      const target =
        phase === "countdown"
          ? new Date(challenge.starts_at).getTime()
          : new Date(challenge.ends_at).getTime();
      if (target <= now) {
        setTimeRemaining("00:00:00");
        return;
      }
      const diff = target - now;
      const h = Math.floor(diff / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);
      setTimeRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    }, 1000);

    return () => {
      ch.unsubscribe();
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (triviaTimerRef.current) clearInterval(triviaTimerRef.current);
    };
  }, [challengeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load type-specific data when challenge type is known
  useEffect(() => {
    if (challenge?.challenge_type) {
      loadTypeData(challenge.challenge_type);
    }
  }, [challenge?.challenge_type, loadTypeData]);

  // ─── Fullscreen ───────────────────────────────────────
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
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ─── Derived Values ───────────────────────────────────
  const phaseConfig = PHASE_CONFIG[phase];
  const PhaseIcon = phaseConfig?.icon || Zap;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 15);
  const td = typeData; // shorthand

  // ─── Loading State ────────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden"
    >
      <audio ref={audioRef} src="/sounds/score-update.mp3" preload="auto" />

      {/* OBS metadata */}
      <div className="hidden obs-metadata">
        <div data-title={challenge.name} />
        <div data-phase={phase} />
        <div data-participants={totalParticipants} />
        <div data-points={totalPointsAwarded} />
        <div data-top1={top3[0]?.users?.full_name || ""} />
        <div data-top1Score={top3[0]?.current_score || 0} />
      </div>

      {/* Header */}
      <div
        className={cn(
          "bg-gradient-to-r py-4 px-6 text-white",
          phaseConfig.color,
        )}
      >
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="text-xs font-mono tracking-wider">
                LIVE BROADCAST
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{challenge.name}</h1>
            <p className="text-white/80 text-sm mt-1">
              {challenge.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-black/30 hover:bg-black/50"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="p-2 rounded-full bg-black/30 hover:bg-black/50"
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

      {/* Phase Banner */}
      <div
        className={cn(
          "border-b py-3 px-2 sm:px-6",
          phaseConfig.bg,
          phaseConfig.border,
        )}
      >
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-3">
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
              {phaseConfig.label}
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
              <span className="text-sm">pts earned</span>
            </div>
          </div>
        </div>
      </div>

      {phase === "final_hour" && (
        <div className="bg-red-600/80 backdrop-blur py-2 px-6 text-center animate-pulse">
          <p className="text-white font-bold text-lg">
            ⚡ DOUBLE POINTS ACTIVE ⚡
          </p>
        </div>
      )}

      <div className="container mx-auto px-2 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 0, 2].map(
                  (pos) =>
                    top3[pos] && (
                      <div
                        key={pos}
                        className={cn(
                          "text-center",
                          pos === 0
                            ? "order-0 lg:order-2"
                            : pos === 1
                              ? "order-1"
                              : "order-2 lg:order-1",
                        )}
                      >
                        <div className="relative">
                          <div
                            className={cn(
                              "mx-auto rounded-full flex items-center justify-center mb-2",
                              pos === 0
                                ? "w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"
                                : "w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500",
                            )}
                          >
                            {pos === 0 ? (
                              <Crown className="h-16 w-16 text-white" />
                            ) : (
                              <Medal className="h-12 w-12 text-white" />
                            )}
                          </div>
                          <div
                            className={cn(
                              "absolute -top-2 -right-2 text-white rounded-full flex items-center justify-center font-bold",
                              pos === 0
                                ? "w-10 h-10 bg-yellow-500 text-xl"
                                : "w-8 h-8 bg-gray-500 text-lg",
                            )}
                          >
                            {pos + 1}
                          </div>
                        </div>
                        <p className="font-bold text-white truncate max-w-[150px] mx-auto">
                          {top3[pos].users?.full_name || "Anonymous"}
                        </p>
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            pos === 0
                              ? "text-yellow-400 text-3xl"
                              : pos === 1
                                ? "text-gray-300"
                                : "text-amber-400",
                          )}
                        >
                          {top3[pos].current_score}
                        </p>
                        <Badge
                          className={cn(
                            "mt-1",
                            pos === 0
                              ? "bg-yellow-500/20 text-yellow-400"
                              : pos === 1
                                ? "bg-gray-500/20 text-gray-300"
                                : "bg-amber-500/20 text-amber-400",
                          )}
                        >
                          {pos === 0
                            ? "Champion"
                            : pos === 1
                              ? "Silver"
                              : "Bronze"}
                        </Badge>
                      </div>
                    ),
                )}
              </div>
            )}

            {/* Streak stats */}
            {challenge.challenge_type === "streak" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                  <CardContent className="text-center">
                    <Flame className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                    <p className="text-4xl font-bold text-orange-400">
                      {Math.max(
                        ...leaderboard.map((p) => p.current_streak || 0),
                      )}
                    </p>
                    <p className="text-sm text-orange-300/80">
                      Longest Active Streak
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-black/50 backdrop-blur border-white/10">
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Active Streakers</span>
                      <span className="text-white font-bold">
                        {
                          leaderboard.filter((p) => (p.current_streak || 0) > 0)
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Avg Streak</span>
                      <span className="text-white font-bold">
                        {leaderboard.length > 0
                          ? Math.round(
                              leaderboard.reduce(
                                (s, p) => s + (p.current_streak || 0),
                                0,
                              ) / leaderboard.length,
                            )
                          : 0}
                        d
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {/* Scoreboard */}
            <Card className="bg-black/50 backdrop-blur border-white/10">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="">
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
                    {/* Show ALL participants including top 3 if total is small */}
                    {leaderboard.length <= 3 ? (
                      // When 3 or fewer participants, show everyone in the table (no podium needed or show podium + table)
                      leaderboard.map((p, idx) => {
                        const rank = idx + 1;
                        const change = rankChanges.get(p.user_id);
                        return (
                          <tr
                            key={p.id || p.user_id}
                            className={cn(
                              "border-b border-white/5 hover:bg-white/5",
                              rank === 1 && "bg-yellow-500/5",
                              rank === 2 && "bg-gray-500/5",
                              rank === 3 && "bg-amber-500/5",
                            )}
                          >
                            <td className="p-4 font-mono font-bold">
                              <span
                                className={cn(
                                  rank === 1
                                    ? "text-yellow-400"
                                    : rank === 2
                                      ? "text-gray-300"
                                      : rank === 3
                                        ? "text-amber-400"
                                        : "text-white",
                                )}
                              >
                                {rank === 1
                                  ? "🥇"
                                  : rank === 2
                                    ? "🥈"
                                    : rank === 3
                                      ? "🥉"
                                      : `#${rank}`}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                    rank === 1
                                      ? "bg-yellow-500/20"
                                      : rank === 2
                                        ? "bg-gray-500/20"
                                        : rank === 3
                                          ? "bg-amber-500/20"
                                          : "bg-purple-500/20",
                                  )}
                                >
                                  <Users
                                    className={cn(
                                      "h-4 w-4",
                                      rank === 1
                                        ? "text-yellow-400"
                                        : rank === 2
                                          ? "text-gray-300"
                                          : rank === 3
                                            ? "text-amber-400"
                                            : "text-purple-400",
                                    )}
                                  />
                                </div>
                                <span className="text-white font-medium">
                                  {p.users?.full_name ||
                                    p.full_name ||
                                    "Anonymous"}
                                </span>
                                {p.team_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {p.team_name}
                                  </Badge>
                                )}
                                {challenge.challenge_type === "streak" &&
                                  p.current_streak > 0 && (
                                    <Badge className="ml-2 bg-orange-500/20 text-orange-400">
                                      <Flame className="h-3 w-3 mr-1" />
                                      {p.current_streak}d
                                    </Badge>
                                  )}
                                {/* Trivia-specific stats */}
                                {challenge.challenge_type === "trivia" && (
                                  <span className="text-xs text-muted-foreground">
                                    {p.correct_answers}/{p.questions_answered} •{" "}
                                    {p.accuracy}%
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right font-bold text-white">
                              {(
                                p.current_score ||
                                p.total_score ||
                                0
                              ).toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              {change === "up" ? (
                                <div className="inline-flex items-center gap-1 text-green-500">
                                  <ArrowUp className="h-4 w-4" />
                                </div>
                              ) : change === "down" ? (
                                <div className="inline-flex items-center gap-1 text-red-500">
                                  <ArrowDown className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="text-gray-500">—</div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      // More than 3: show rest (4th place onwards)
                      <>
                        {rest.map((p, idx) => {
                          const rank = idx + 4;
                          const change = rankChanges.get(p.user_id);
                          return (
                            <tr
                              key={p.id || p.user_id}
                              className="border-b border-white/5 hover:bg-white/5"
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
                                    {p.users?.full_name ||
                                      p.full_name ||
                                      "Anonymous"}
                                  </span>
                                  {p.team_name && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {p.team_name}
                                    </Badge>
                                  )}
                                  {challenge.challenge_type === "streak" &&
                                    p.current_streak > 0 && (
                                      <Badge className="ml-2 bg-orange-500/20 text-orange-400">
                                        <Flame className="h-3 w-3 mr-1" />
                                        {p.current_streak}d
                                      </Badge>
                                    )}
                                  {/* Trivia-specific stats */}
                                  {challenge.challenge_type === "trivia" && (
                                    <span className="text-xs text-muted-foreground">
                                      {p.correct_answers}/{p.questions_answered}{" "}
                                      • {p.accuracy}%
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-right font-bold text-white">
                                {(
                                  p.current_score ||
                                  p.total_score ||
                                  0
                                ).toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                {change === "up" ? (
                                  <div className="inline-flex items-center gap-1 text-green-500">
                                    <ArrowUp className="h-4 w-4" />
                                  </div>
                                ) : change === "down" ? (
                                  <div className="inline-flex items-center gap-1 text-red-500">
                                    <ArrowDown className="h-4 w-4" />
                                  </div>
                                ) : (
                                  <div className="text-gray-500">—</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}

                    {/* Only show "Waiting" when truly empty */}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-purple-300"
                        >
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Waiting for participants to join...</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Live Ticker */}
            <Card className="bg-black/50 backdrop-blur border-white/10 h-[400px] flex flex-col">
              <div className="px-4 ">
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
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 animate-in fade-in slide-in-from-right"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-400" />
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
                      <Badge className="bg-green-500/20 text-green-400">
                        +{item.points_awarded}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Prize Tiers */}
            <Card className="bg-black/50 backdrop-blur border-white/10">
              <div className="px-4 ">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  Prize Tiers
                </h3>
                <div className="space-y-2">
                  {challenge.prize_tiers?.map((tier: any, idx: number) => (
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
                        {tier.prize_type === "points"
                          ? `${tier.prize_value} points`
                          : tier.prize_type === "discount"
                            ? `${tier.prize_value}% off`
                            : tier.prize_value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* ─── TYPE-SPECIFIC SIDEBAR SECTIONS ─── */}

            {/* PURCHASE */}
            {challenge.challenge_type === "purchase" && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                    <CardContent className="text-center">
                      <ShoppingBag className="h-4 w-4 text-green-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {td.totalUnitsSold || 0}
                      </p>
                      <p className="text-xs text-green-300">Units</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                    <CardContent className="text-center">
                      <Users className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {td.purchaseParticipants || 0}
                      </p>
                      <p className="text-xs text-blue-300">Buyers</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
                    <CardContent className="text-center">
                      <TrendingUp className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        KSH {td.totalRevenue?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-purple-300">Revenue</p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-black/50 backdrop-blur border-white/10">
                  <div className="">
                    <h3 className="text-white font-semibold">Top Buyers</h3>
                  </div>
                  <div className="space-y-1 p-2">
                    {(td.purchaseLeaderboard || [])
                      .slice(0, 5)
                      .map((e: any, i: number) => (
                        <div
                          key={e.user_id}
                          className="flex items-center justify-between p-2 rounded bg-white/5"
                        >
                          <span className="text-white text-sm">
                            {i + 1}. {e.full_name}
                          </span>
                          <span className="text-green-400 font-bold">
                            {e.total_units}u
                          </span>
                        </div>
                      ))}
                  </div>
                </Card>
              </>
            )}

            {/* TEAM */}
            {challenge.challenge_type === "team" && (
              <>
                <Card className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/30">
                  <CardContent className="text-center space-y-2">
                    <Users className="h-8 w-8 text-purple-400 mx-auto" />
                    <p className="text-white font-bold">
                      {td.totalTeams || 0} Teams
                    </p>
                    <p className="text-sm text-purple-300">
                      KSH {td.totalTeamSpending?.toLocaleString() || 0} total
                      spent
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-black/50 backdrop-blur border-white/10">
                  <div className="">
                    <h3 className="text-white font-semibold">Team Rankings</h3>
                  </div>
                  <div className="space-y-1 p-2">
                    {(td.teamLeaderboard || []).map((t: any, i: number) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2 rounded bg-white/5"
                      >
                        <span className="text-white text-sm">
                          {["🥇", "🥈", "🥉"][i] || `#${i + 1}`} {t.team_name}
                        </span>
                        <span className="text-purple-300 text-sm">
                          KSH {t.total_team_spending?.toLocaleString() || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* REFERRAL */}
            {challenge.challenge_type === "referral" && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                    <CardContent className="text-center">
                      <Users className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {td.referralTotalConversions || 0}
                      </p>
                      <p className="text-xs text-blue-300">Total</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                    <CardContent className="text-center">
                      <UserCheck className="h-4 w-4 text-green-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {td.referralSignups || 0}
                      </p>
                      <p className="text-xs text-green-300">Signups</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
                    <CardContent className="text-center">
                      <ShoppingBag className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {td.referralPurchases || 0}
                      </p>
                      <p className="text-xs text-purple-300">Purchases</p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-black/50 backdrop-blur border-white/10">
                  <div className="">
                    <h3 className="text-white font-semibold">Top Referrers</h3>
                  </div>
                  <div className="space-y-1 p-2">
                    {(td.referralLeaderboard || [])
                      .slice(0, 5)
                      .map((e: any, i: number) => (
                        <div
                          key={e.user_id}
                          className="flex items-center justify-between p-2 rounded bg-white/5"
                        >
                          <span className="text-white text-sm">
                            {i + 1}. {e.full_name}
                          </span>
                          <span className="text-blue-400 font-bold">
                            {e.total_referrals} refs
                          </span>
                        </div>
                      ))}
                  </div>
                </Card>
              </>
            )}

            {/* TRIVIA */}
            {challenge.challenge_type === "trivia" && (
              <>
                {td.triviaCurrentQuestion ? (
                  <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                    <CardContent className="text-center space-y-3">
                      <Badge className="bg-yellow-500/20 text-yellow-300">
                        {td.triviaCurrentQuestion.difficulty?.toUpperCase()} •{" "}
                        {td.triviaCurrentQuestion.points_value} PTS
                      </Badge>
                      <h3 className="text-xl font-bold text-white">
                        {td.triviaCurrentQuestion.question}
                      </h3>
                      {td.triviaTimeLeft > 0 &&
                        td.triviaPhase === "question" && (
                          <span
                            className={cn(
                              "text-4xl font-bold font-mono",
                              td.triviaTimeLeft <= 2
                                ? "text-red-500 animate-pulse"
                                : "text-yellow-400",
                            )}
                          >
                            {td.triviaTimeLeft}
                          </span>
                        )}
                      <div className="grid grid-cols-2 gap-2">
                        {td.triviaCurrentQuestion.options?.map(
                          (opt: string, i: number) => (
                            <div
                              key={i}
                              className={cn(
                                "p-2 rounded border text-sm text-white",
                                td.triviaRevealAnswer &&
                                  i ===
                                    td.triviaCurrentQuestion
                                      .correct_answer_index
                                  ? "border-green-500 bg-green-500/20"
                                  : td.triviaRevealAnswer &&
                                      i === td.triviaPlayerAnswer &&
                                      i !==
                                        td.triviaCurrentQuestion
                                          .correct_answer_index
                                    ? "border-red-500 bg-red-500/20"
                                    : "border-white/10 bg-white/5",
                              )}
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                            </div>
                          ),
                        )}
                      </div>
                      {td.triviaSelectedPlayer && (
                        <div className="text-sm text-purple-300">
                          {td.triviaPhase === "spinning" &&
                            "Selecting player..."}
                          {td.triviaPhase === "question" && (
                            <>
                              <span className="font-bold text-white">
                                {td.triviaSelectedPlayer.user_name}
                              </span>{" "}
                              is answering...
                            </>
                          )}
                          {td.triviaRevealAnswer &&
                            td.triviaSelectedPlayer.is_correct !== undefined &&
                            (td.triviaSelectedPlayer.is_correct ? (
                              <span className="text-green-400 font-bold">
                                ✅ CORRECT! +
                                {td.triviaSelectedPlayer.points_earned} pts
                              </span>
                            ) : (
                              <span className="text-red-400 font-bold">
                                ❌ WRONG!
                              </span>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-black/50 backdrop-blur border-white/10">
                    <CardContent className="text-center">
                      <Brain className="h-12 w-12 text-yellow-500 mx-auto mb-2 animate-pulse" />
                      <p className="text-white font-bold">
                        Waiting for next question...
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Contestant Queue */}
                <Card className="bg-black/50 backdrop-blur border-white/10">
                  <div className="px-4 ">
                    <h3 className="text-white font-semibold">
                      Contestants ({(td.participantQueue || []).length})
                    </h3>
                  </div>
                  <div className="p-3 flex flex-wrap gap-2">
                    {(td.participantQueue || []).map((p: any) => (
                      <div
                        key={p.ticket_number}
                        className={cn(
                          "px-3 py-2 rounded-lg text-center",
                          p.current_status === "answering"
                            ? "bg-yellow-500/20 border border-yellow-500 scale-110 animate-pulse"
                            : "bg-white/5",
                        )}
                      >
                        <p className="text-sm font-bold text-white">
                          #{p.ticket_number}
                        </p>
                        <p className="text-xs text-white/80">{p.user_name}</p>
                        <p className="text-xs text-yellow-400">
                          {p.total_score} pts
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Trivia Leaderboard */}
                <Card className="bg-black/50 backdrop-blur border-white/10">
                  <div className="px-4 ">
                    <h3 className="text-white font-semibold">
                      Trivia Standings
                    </h3>
                  </div>
                  <div className="space-y-1 p-2">
                    {(td.triviaLeaderboard || []).map((e: any, i: number) => (
                      <div
                        key={e.user_id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded",
                          i === 0 && "bg-yellow-500/10",
                        )}
                      >
                        <span className="text-white text-sm">
                          {["🥇", "🥈", "🥉"][i] || `#${i + 1}`} {e.full_name}
                        </span>
                        <span className="text-yellow-400 font-bold">
                          {e.total_score}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* CTA */}
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
              <div className="p-4 text-center">
                <Target className="h-8 w-8 text-white mx-auto mb-2" />
                <h3 className="text-white font-bold">Want to Join?</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-2"
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

      {/* Floating alert */}
      {lastAction && (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50">
            <div className="p-3 flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-green-400" />
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
