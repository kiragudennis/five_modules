// app/(store)/draws/live/[drawId]/page.tsx
// Live broadcast display with 3-phase show: Entry Collection → Entries Locked → Winner Reveal

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { DrawsService } from "@/lib/services/draws-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Ticket,
  Users,
  Trophy,
  PartyPopper,
  Loader2,
  Radio,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  TrendingUp,
  Sparkles,
  Crown,
  Heart,
  Award,
  Medal,
  ShoppingBag,
  Share2,
  CheckCircle,
  Eye,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import confetti from "canvas-confetti";
import { CompactCountdown } from "@/components/ui/count-down";
import { Draw } from "@/types/draws";

interface TickerEntry {
  id: string;
  user_name: string;
  entry_count: number;
  entry_method: string;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  entry_count: number;
}

type DrawPhase = "entry_collection" | "entries_locked" | "winner_reveal";

export default function DrawLivePage() {
  const { drawId } = useParams<{ drawId: string }>();
  const { supabase, profile } = useAuth();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [phase, setPhase] = useState<DrawPhase>("entry_collection");
  const [ticker, setTicker] = useState<TickerEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [countdown, setCountdown] = useState("");
  const [entryCountdown, setEntryCountdown] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [shufflingNames, setShufflingNames] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [finalWinner, setFinalWinner] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastEntry, setLastEntry] = useState<TickerEntry | null>(null);
  const [entryStats, setEntryStats] = useState<Record<string, number>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [countdownProgress, setCountdownProgress] = useState(100);
  const [participantSet, setParticipantSet] = useState<Set<string>>(new Set());
  const [liveEntryAwarded, setLiveEntryAwarded] = useState(false);
  const [showLiveEntryToast, setShowLiveEntryToast] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null);
  const drawsService = new DrawsService(supabase);
  const isMountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  // Add effect to award live stream entry when viewing the live page
  useEffect(() => {
    const awardLiveStreamEntry = async () => {
      if (!profile?.id || !drawId || liveEntryAwarded) return;

      // Only award if draw is open
      if (draw?.status === "open") {
        try {
          const result = await drawsService.awardLiveStreamEntry(drawId);
          if (result.success) {
            setLiveEntryAwarded(true);
            setShowLiveEntryToast(true);
            // Refresh to show updated entries
            loadAllData();
            setTimeout(() => setShowLiveEntryToast(false), 5000);
          }
        } catch (error) {
          console.error("Error awarding live entry:", error);
        }
      }
    };

    if (draw) {
      awardLiveStreamEntry();
    }
  }, [draw, drawId, profile?.id, drawsService, liveEntryAwarded]);

  // Single function to load all data in one go
  const loadAllData = useCallback(async () => {
    if (!drawId || !isMountedRef.current) return;

    try {
      // Fetch draw data
      const { data: drawData } = await supabase
        .from("draws")
        .select("*")
        .eq("id", drawId)
        .single();

      if (!drawData) return;
      setDraw(drawData);

      // Get entry stats
      const stats = await drawsService.getEntryStats(drawId);
      setEntryStats(stats);
      const total = Object.values(stats).reduce((a, b) => a + b, 0);
      setTotalEntries(total);

      // Get unique participants
      const { data: participants } = await supabase
        .from("draw_entries")
        .select("user_id")
        .eq("draw_id", drawId);
      setTotalParticipants(
        participants ? new Set(participants.map((p) => p.user_id)).size : 0,
      );

      // Get ticker (recent entries)
      const tickerData = await drawsService.getLiveTicker(drawId, 30);
      setTicker(tickerData);

      // Get leaderboard
      const { data: leaderboardData } = await supabase
        .from("draw_entries")
        .select("user_id, users!user_id(full_name), entry_count")
        .eq("draw_id", drawId)
        .order("entry_count", { ascending: false })
        .limit(10);
      setLeaderboard(
        leaderboardData?.map((item: any) => ({
          user_id: item.user_id,
          full_name: item.users?.full_name || "Anonymous",
          entry_count: item.entry_count,
        })) || [],
      );

      // Determine phase
      if (drawData.status === "completed" && drawData.winner_id) {
        setPhase("winner_reveal");
        setShowCelebration(true);
        const { data: winnerData } = await supabase
          .from("draw_winners")
          .select("*, users!user_id(full_name, email)")
          .eq("draw_id", drawId)
          .eq("winner_rank", 1)
          .single();
        setFinalWinner(winnerData);
        setWinners([winnerData]);
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        setTimeout(() => setShowCelebration(false), 5000);
      } else if (
        drawData.status === "closed" ||
        drawData.status === "drawing"
      ) {
        setPhase("entries_locked");
      } else {
        setPhase("entry_collection");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [drawId, supabase, drawsService]);

  // Update countdowns
  const updateCountdowns = useCallback(() => {
    if (!draw) return;

    // Entry period countdown
    if (draw.entry_ends_at && new Date(draw.entry_ends_at) > new Date()) {
      const end = new Date(draw.entry_ends_at);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      const totalDuration =
        new Date(draw.entry_ends_at).getTime() -
        new Date(draw.entry_starts_at).getTime();
      const progress = (diff / totalDuration) * 100;
      setCountdownProgress(Math.max(0, Math.min(100, progress)));
      setEntryCountdown(formatDistanceToNowStrict(end, { addSuffix: true }));
    } else {
      setEntryCountdown("Entries Closed!");
    }

    // Draw countdown
    if (phase === "entries_locked" && draw.draw_time) {
      const drawTime = new Date(draw.draw_time);
      if (drawTime > new Date()) {
        setCountdown(
          `Draw in ${formatDistanceToNowStrict(drawTime, { addSuffix: true })}`,
        );
      } else {
        setCountdown("Draw Starting...");
      }
    }
  }, [draw, phase]);

  // Add the loadWinnerData function
  const loadWinnerData = useCallback(async () => {
    if (!drawId) return;

    const { data: winnerData } = await supabase
      .from("draw_winners")
      .select("*, users!user_id(full_name, email)")
      .eq("draw_id", drawId)
      .eq("winner_rank", 1)
      .single();

    if (winnerData) {
      setFinalWinner(winnerData);
      setWinners([winnerData]);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    }
  }, [drawId, supabase]);

  // Setup single real-time channel - OPTIMIZED (no full reloads)
  useEffect(() => {
    if (!drawId) return;

    isMountedRef.current = true;
    let intervalId: NodeJS.Timeout | null = null;

    // Initial load only once
    loadAllData();

    // Setup single real-time channel
    const channel = supabase
      .channel(`draw-live-${drawId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "draw_entries",
          filter: `draw_id=eq.${drawId}`,
        },
        async (payload) => {
          if (!isMountedRef.current) return;

          const newEntry = payload.new;

          // Get user name
          const { data: user } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", newEntry.user_id)
            .single();

          // 1. Update ticker (add to top of list, keep last 30)
          const newTickerEntry = {
            id: newEntry.id,
            user_name: user?.full_name || "Customer",
            entry_count: newEntry.entry_count,
            entry_method: newEntry.entry_method,
            created_at: newEntry.created_at,
          };
          setTicker((prev) => [newTickerEntry, ...prev.slice(0, 29)]);

          // 2. Update total entries count
          setTotalEntries((prev) => prev + newEntry.entry_count);

          // 3. Update total participants (check if new user)
          setParticipantSet((prev) => {
            const newSet = new Set(prev);
            newSet.add(newEntry.user_id);
            setTotalParticipants(newSet.size);
            return newSet;
          });

          // 4. Update entry stats
          setEntryStats((prev) => ({
            ...prev,
            [newEntry.entry_method]:
              (prev[newEntry.entry_method] || 0) + newEntry.entry_count,
          }));

          // 5. Update leaderboard (if this user appears)
          setLeaderboard((prev) => {
            const existingIndex = prev.findIndex(
              (l) => l.user_id === newEntry.user_id,
            );
            if (existingIndex >= 0) {
              // Update existing user's entry count
              const updated = [...prev];
              updated[existingIndex].entry_count += newEntry.entry_count;
              // Re-sort by entry count
              return updated.sort((a, b) => b.entry_count - a.entry_count);
            } else {
              // Add new user to leaderboard
              const newEntryData = {
                user_id: newEntry.user_id,
                full_name: user?.full_name || "Anonymous",
                entry_count: newEntry.entry_count,
              };
              const newLeaderboard = [...prev, newEntryData].sort(
                (a, b) => b.entry_count - a.entry_count,
              );
              return newLeaderboard.slice(0, 10);
            }
          });

          // 6. Show floating alert
          setLastEntry(newTickerEntry);
          setTimeout(() => setLastEntry(null), 3000);

          // Play sound
          if (isSoundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "draws",
          filter: `id=eq.${drawId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          // Update draw status
          setDraw((prev) =>
            prev ? { ...prev, ...payload.new } : (payload.new as Draw),
          );

          if (
            payload.new.status === "completed" &&
            payload.old.status !== "completed"
          ) {
            // Fetch winner details on completion
            loadWinnerData();
            if (winnerAudioRef.current) {
              winnerAudioRef.current.play().catch(() => {});
            }
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 8000);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Draw live channel connected");
        }
      });

    channelRef.current = channel;

    // Only refresh leaderboard and participants count periodically (every 10 seconds)
    // to correct any inaccuracies from incremental updates
    intervalId = setInterval(() => {
      if (isMountedRef.current && phase === "entry_collection") {
        // Refresh leaderboard and participant count periodically
        const refreshLeaderboard = async () => {
          const { data: leaderboardData } = await supabase
            .from("draw_entries")
            .select("user_id, users!user_id(full_name), entry_count")
            .eq("draw_id", drawId)
            .order("entry_count", { ascending: false })
            .limit(10);

          if (leaderboardData) {
            setLeaderboard(
              leaderboardData.map((item: any) => ({
                user_id: item.user_id,
                full_name: item.users?.full_name || "Anonymous",
                entry_count: item.entry_count,
              })),
            );
          }

          // Refresh participant count
          const { data: participants } = await supabase
            .from("draw_entries")
            .select("user_id")
            .eq("draw_id", drawId);
          setTotalParticipants(
            participants ? new Set(participants.map((p) => p.user_id)).size : 0,
          );
        };

        refreshLeaderboard();
      }
    }, 30000); // Every 30 seconds as a backup

    return () => {
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [drawId, supabase, isSoundEnabled, phase]);

  // Start the draw (for host to trigger)
  const startDraw = async () => {
    setDrawing(true);
    setPhase("entries_locked");

    await new Promise((resolve) => setTimeout(resolve, 2000));
    setShufflingNames(true);

    // Dramatic shuffle animation
    const shuffleInterval = setInterval(() => {
      const randomNames = leaderboard.map((l) => l.full_name);
      const randomName =
        randomNames[Math.floor(Math.random() * randomNames.length)] || "???";
      setFinalWinner({ users: { full_name: randomName } });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 3500));
    clearInterval(shuffleInterval);

    try {
      const result = await drawsService.performDraw(drawId);
      const { data: winnerData } = await supabase
        .from("draw_winners")
        .select("*, users!user_id(full_name, email)")
        .eq("draw_id", drawId)
        .eq("winner_rank", 1)
        .single();

      setFinalWinner(winnerData);
      setWinners([winnerData, ...result.winners.slice(1)]);
      setShufflingNames(false);
      setPhase("winner_reveal");
      setShowCelebration(true);

      if (isSoundEnabled) {
        const winnerSound = new Audio("/sounds/winner-fanfare.mp3");
        winnerSound.play().catch(() => {});
      }

      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => setShowCelebration(false), 8000);
    } catch (error) {
      console.error("Draw failed:", error);
    } finally {
      setDrawing(false);
    }
  };

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

  const getEntryMethodIcon = (method: string) => {
    switch (method) {
      case "purchase":
        return <ShoppingBag className="h-3 w-3" />;
      case "referral":
        return <Users className="h-3 w-3" />;
      case "social_share":
        return <Share2 className="h-3 w-3" />;
      case "live_stream_entry":
        return <Radio className="h-3 w-3" />;
      case "loyalty_bonus":
        return <Crown className="h-3 w-3" />;
      default:
        return <Ticket className="h-3 w-3" />;
    }
  };

  if (!draw) {
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground"> Loading live draw...</p>
        </div>
      </div>
    );
  }

  const isEntryPhase = phase === "entry_collection";
  const isLockedPhase = phase === "entries_locked";
  const isWinnerPhase = phase === "winner_reveal";

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative"
    >
      {/* Audio */}
      <audio ref={audioRef} src="/sounds/entry-chime.mp3" preload="auto" />
      <audio
        ref={winnerAudioRef}
        src="/sounds/winner-fanfare.mp3"
        preload="auto"
      />
      {showLiveEntryToast && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed bottom-24 right-4 z-50"
        >
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <div>
                <p className="text-sm font-semibold">🎉 Live Stream Bonus!</p>
                <p className="text-xs opacity-90">
                  You received +5 entries for watching!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      // Add a badge in the stats bar to show live entry status
      <div className="flex items-center gap-2 text-white/80 text-sm">
        {liveEntryAwarded ? (
          <Badge className="bg-green-500/20 text-green-400 border-0 gap-1">
            <CheckCircle className="h-3 w-3" />
            Live Entry Claimed
          </Badge>
        ) : (
          profile &&
          draw?.status === "open" && (
            <Badge className="bg-purple-500/20 text-purple-400 border-0 animate-pulse gap-1">
              <Eye className="h-3 w-3" />
              Watching = Bonus Entry!
            </Badge>
          )
        )}
      </div>
      {/* OBS Metadata */}
      <div className="hidden obs-metadata">
        <div data-title={draw.name} />
        <div data-prize={draw.prize_name} />
        <div data-entries={totalEntries} />
        <div data-participants={totalParticipants} />
        <div data-phase={phase} />
      </div>
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <PartyPopper className="h-24 w-24 text-yellow-500 mx-auto" />
                <p className="text-4xl font-bold text-white mt-4">WINNER!</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-4 px-6 text-white">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            {/* Left side - Title & Prize */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 animate-pulse" />
                <span className="text-xs font-mono tracking-wider">
                  LIVE BROADCAST
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{draw.name}</h1>
              <p className="text-white/80 text-sm mt-1">
                Prize: {draw.prize_name}
              </p>
            </div>

            {/* Right side - Countdown & Controls */}
            <div className="flex items-center gap-4">
              {/* Compact Countdown Timer */}
              {draw.draw_time && new Date(draw.draw_time) > new Date() && (
                <CompactCountdown
                  targetDate={draw.draw_time}
                  label="until draw"
                />
              )}

              {/* Control Buttons */}
              <div className="flex gap-2">
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
        </div>
      </div>
      {/* Phase Indicator */}
      <div className="bg-black/50 backdrop-blur border-b border-white/10 py-2 px-6">
        <div className="container mx-auto">
          <div className="flex justify-center gap-8">
            <div
              className={cn(
                "flex items-center gap-2",
                isEntryPhase ? "text-green-400" : "text-white/40",
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isEntryPhase ? "bg-green-400 animate-pulse" : "bg-white/40",
                )}
              />
              <span className="text-sm">Entry Collection</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2",
                isLockedPhase ? "text-yellow-400" : "text-white/40",
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isLockedPhase ? "bg-yellow-400 animate-pulse" : "bg-white/40",
                )}
              />
              <span className="text-sm">Entries Locked</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2",
                isWinnerPhase ? "text-purple-400" : "text-white/40",
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isWinnerPhase ? "bg-purple-400 animate-pulse" : "bg-white/40",
                )}
              />
              <span className="text-sm">Winner Reveal</span>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Bar */}
      <div className="bg-black/40 backdrop-blur border-b border-white/10 py-3 px-6">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Ticket className="h-4 w-4" />
                <span className="font-mono">
                  {totalEntries.toLocaleString()}
                </span>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Users className="h-4 w-4" />
                <span className="font-mono">
                  {totalParticipants.toLocaleString()}
                </span>
                <span>players</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Clock className="h-4 w-4" />
              <span>{isEntryPhase ? entryCountdown : countdown}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-6 py-8">
        {/* PHASE 1: Entry Collection */}
        {isEntryPhase && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Prize Display - Left */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
                <CardContent className="p-8 text-center">
                  {draw.prize_image_url ? (
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        repeatType: "reverse",
                      }}
                      src={draw.prize_image_url}
                      alt={draw.prize_name}
                      className="w-40 h-40 object-cover rounded-full mx-auto mb-4 border-4 border-yellow-500/50"
                    />
                  ) : (
                    <div className="w-40 h-40 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 flex items-center justify-center border-4 border-yellow-500/50">
                      <Gift className="h-20 w-20 text-yellow-400" />
                    </div>
                  )}
                  <h2 className="text-3xl font-bold text-white">
                    {draw.prize_name}
                  </h2>
                  <p className="text-purple-300 mt-2">
                    {draw.prize_description}
                  </p>
                  {draw.prize_value && draw.prize_value > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/50">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">
                        {formatPrice(draw.prize_value)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Entry Progress Bar */}
              {draw.max_entries_total && (
                <Card className="bg-black/30 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-300">
                        Entry Pool Progress
                      </span>
                      <span className="text-white">
                        {totalEntries.toLocaleString()} /{" "}
                        {draw.max_entries_total.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={(totalEntries / draw.max_entries_total) * 100}
                      className="h-3"
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Live Activity - Right */}
            <div className="space-y-6">
              {/* Entry Methods Stats */}
              <Card className="bg-black/50 backdrop-blur">
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Entry Methods
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(entryStats).map(([method, count]) => (
                      <div
                        key={method}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          {getEntryMethodIcon(method)}
                          <span className="text-sm text-purple-300 capitalize">
                            {method.replace("_", " ")}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {count.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Live Stream Bonus Card */}
              {draw.entry_calculation?.live_stream?.enabled &&
                !liveEntryAwarded &&
                profile && (
                  <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <CardContent className="p-4 text-center">
                      <Eye className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                      <h3 className="font-bold">🎁 Live Stream Bonus!</h3>
                      <p className="text-sm opacity-90 mt-1">
                        You're watching! You'll receive{" "}
                        {draw.entry_config?.live_stream?.entries_per_email || 5}{" "}
                        bonus entries!
                      </p>
                      {!liveEntryAwarded && (
                        <div className="mt-2">
                          <div className="flex items-center justify-center gap-1 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Processing your bonus...</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {liveEntryAwarded && (
                <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <h3 className="font-bold text-green-400">
                      ✓ Bonus Claimed!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You received your live stream bonus entries!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Leaderboard Preview */}
              {leaderboard.length > 0 && (
                <Card className="bg-black/50 backdrop-blur">
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      Top Entrants
                    </h3>
                    <div className="space-y-2">
                      {leaderboard.slice(0, 5).map((entry, idx) => (
                        <div
                          key={entry.user_id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <Trophy className="h-4 w-4 text-yellow-400" />
                            )}
                            {idx === 1 && (
                              <Medal className="h-4 w-4 text-gray-400" />
                            )}
                            {idx === 2 && (
                              <Medal className="h-4 w-4 text-amber-600" />
                            )}
                            {idx > 2 && (
                              <span className="text-xs text-purple-300 w-4">
                                #{idx + 1}
                              </span>
                            )}
                            <span className="text-sm text-white truncate max-w-[120px]">
                              {entry.full_name}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {entry.entry_count} entries
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: Entries Locked - Tension Building */}
        {isLockedPhase && !finalWinner && (
          <div className="flex items-center justify-center min-h-[500px]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-2xl"
            >
              <Card
                className={cn(
                  "bg-gradient-to-r from-purple-900/80 to-pink-900/80 border-purple-500/50",
                  drawing && "animate-pulse",
                )}
              >
                <CardContent className="py-12">
                  {drawing ? (
                    <>
                      <Loader2 className="h-20 w-20 text-purple-400 mx-auto mb-4 animate-spin" />
                      <p className="text-3xl font-bold text-purple-400">
                        Drawing in progress...
                      </p>
                      <p className="text-slate-400 mt-3">
                        Selecting from {totalEntries.toLocaleString()} entries
                      </p>
                      <div className="mt-6 flex justify-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                          style={{ animationDelay: "0s" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-7xl mb-4">⏰</div>
                      <p className="text-2xl font-bold text-white">
                        Entries are closed!
                      </p>
                      <p className="text-purple-300 mt-2">
                        {totalEntries.toLocaleString()} total entries
                      </p>
                      <p className="text-purple-300">
                        {totalParticipants.toLocaleString()} participants
                      </p>
                      <Button
                        className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
                        onClick={startDraw}
                      >
                        <Trophy className="h-5 w-5 mr-2" />
                        START DRAW
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* PHASE 3: Winner Reveal */}
        {isWinnerPhase && finalWinner && (
          <div className="space-y-8">
            {/* Grand Prize Winner */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
            >
              <Card
                className={cn(
                  "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-center overflow-hidden",
                  shufflingNames ? "animate-shake" : "",
                )}
              >
                <CardContent className="py-12">
                  {shufflingNames ? (
                    <>
                      <div className="text-5xl font-mono text-white mb-4 tracking-wider animate-pulse">
                        {finalWinner.users?.full_name || "???"}
                      </div>
                      <div className="flex justify-center gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                      <p className="text-yellow-400 mt-4">
                        Selecting winner...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <PartyPopper className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute -top-2 -right-2"
                        >
                          <Sparkles className="h-6 w-6 text-yellow-400" />
                        </motion.div>
                      </div>
                      <Badge className="bg-yellow-500 text-black mb-4 text-lg px-4 py-1">
                        🏆 GRAND PRIZE WINNER 🏆
                      </Badge>
                      <p className="text-5xl font-bold text-white mt-4">
                        {finalWinner.users?.full_name}
                      </p>
                      <p className="text-xl text-purple-300 mt-2">
                        Winner of {draw.prize_name}
                      </p>
                      <div className="flex justify-center gap-3 mt-6">
                        <Badge
                          variant="outline"
                          className="text-yellow-500 border-yellow-500"
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          Verified Winner
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-green-500 border-green-500"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Claim Pending
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Runner Ups */}
            {winners.slice(1).length > 0 && (
              <Card className="bg-black/50 backdrop-blur">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Runner Ups
                  </h3>
                  <div className="grid gap-3">
                    {winners.slice(1).map((winner, idx) => (
                      <div
                        key={winner.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="text-lg px-3 py-1"
                          >
                            #{idx + 2}
                          </Badge>
                          <span className="text-white font-medium">
                            {winner.users?.full_name}
                          </span>
                        </div>
                        <Badge variant="outline">{winner.prize_name}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consolation Prize Info */}
            {draw.consolation_points_amount &&
              draw.consolation_points_amount > 0 && (
                <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <Heart className="h-5 w-5 text-pink-400 mx-auto mb-1" />
                    <p className="text-sm text-purple-300">
                      🎁 All participants received{" "}
                      {draw.consolation_points_amount} loyalty points!
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        )}
      </div>
      {/* Scrolling Ticker - Only during entry collection */}
      {isEntryPhase && ticker.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-t border-purple-500/30 py-2 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
            {ticker.slice(0, 30).map((entry, idx) => (
              <span key={idx} className="inline-block mx-4 text-sm text-white">
                {entry.entry_method === "purchase" && (
                  <>
                    💰 {entry.user_name} purchased KES{" "}
                    {(entry.entry_count / 0.05).toLocaleString()} worth - +
                    {entry.entry_count} entries!
                  </>
                )}
                {entry.entry_method === "referral" && (
                  <>
                    🤝 {entry.user_name} referred a friend - +
                    {entry.entry_count} entries!
                  </>
                )}
                {entry.entry_method === "social_share" && (
                  <>
                    📱 {entry.user_name} shared on social media - +
                    {entry.entry_count} entries!
                  </>
                )}
                {entry.entry_method === "live_stream_entry" && (
                  <>
                    🎥 {entry.user_name} joined the live stream - +
                    {entry.entry_count} entries!
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Floating Entry Alert */}
      {lastEntry && isEntryPhase && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed bottom-20 right-4 z-50"
        >
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-white text-sm font-medium">
                  {lastEntry.user_name}
                </p>
                <p className="text-xs text-green-300">
                  +{lastEntry.entry_count} entries
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.1s infinite;
        }
      `}</style>
    </div>
  );
}
