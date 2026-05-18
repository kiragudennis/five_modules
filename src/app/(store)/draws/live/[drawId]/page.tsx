// app/(store)/draws/live/[drawId]/page.tsx
// Live broadcast display for hosts - OBS-ready with 3-phase show

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { DrawsService } from "@/lib/services/draws-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Ticket,
  Users,
  Timer,
  Trophy,
  PartyPopper,
  Loader2,
  Radio,
  Clock,
  Eye,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  TrendingUp,
  Sparkles,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";

interface Draw {
  id: string;
  name: string;
  prize_name: string;
  prize_description: string;
  prize_value: number;
  prize_image_url: string;
  status: string;
  entry_starts_at: string;
  entry_ends_at: string;
  draw_time: string;
  entry_config: any;
  max_entries_total: number | null;
  consolation_points_amount: number;
}

interface TickerEntry {
  id: string;
  user_name: string;
  entry_count: number;
  entry_method: string;
  created_at: string;
}

type DrawPhase = "entry_collection" | "entries_locked" | "winner_reveal";

export default function DrawLivePage() {
  const { drawId } = useParams<{ drawId: string }>();
  const { supabase } = useAuth();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [phase, setPhase] = useState<DrawPhase>("entry_collection");
  const [ticker, setTicker] = useState<TickerEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [countdown, setCountdown] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [shufflingNames, setShufflingNames] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [finalWinner, setFinalWinner] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastEntry, setLastEntry] = useState<TickerEntry | null>(null);
  const [entryStats, setEntryStats] = useState<Record<string, number>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawsService = new DrawsService(supabase);

  // Load draw data
  const loadDraw = useCallback(async () => {
    if (!drawId) return;

    const { data: drawData } = await supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .single();
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

    // Determine phase
    if (drawData?.status === "completed" && drawData?.winner_id) {
      setPhase("winner_reveal");
      const { data: winnerData } = await supabase
        .from("draw_winners")
        .select("*, users!draw_winners_user_id_fkey(full_name, email)")
        .eq("draw_id", drawId)
        .eq("winner_rank", 1)
        .single();
      setFinalWinner(winnerData);
      setWinners([winnerData]);
    } else if (
      drawData?.status === "closed" ||
      drawData?.status === "drawing"
    ) {
      setPhase("entries_locked");
    } else {
      setPhase("entry_collection");
    }
  }, [drawId, supabase, drawsService]);

  // Load ticker
  const loadTicker = useCallback(async () => {
    if (!drawId) return;
    const data = await drawsService.getLiveTicker(drawId, 30);
    setTicker(data);
  }, [drawId, drawsService]);

  // Update countdown
  const updateCountdown = useCallback(() => {
    if (!draw) return;

    if (phase === "entry_collection" && draw.entry_ends_at) {
      const end = new Date(draw.entry_ends_at);
      if (end > new Date()) {
        setCountdown(formatDistanceToNowStrict(end, { addSuffix: true }));
      } else {
        setCountdown("Entries Closed!");
      }
    } else if (phase === "entries_locked" && draw.draw_time) {
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

  // Real-time subscriptions
  useEffect(() => {
    if (!drawId) return;

    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const setupSubscription = () => {
      try {
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
              if (!isMounted) return;

              // Get user name
              const { data: user } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", payload.new.user_id)
                .single();

              const newTickerEntry = {
                id: payload.new.id,
                user_name: user?.full_name || "Customer",
                entry_count: payload.new.entry_count,
                entry_method: payload.new.entry_method,
                created_at: payload.new.created_at,
              };

              setTicker((prev) => [newTickerEntry, ...prev.slice(0, 49)]);
              setLastEntry(newTickerEntry);

              // Update totals
              setTotalEntries((prev) => prev + payload.new.entry_count);
              setTotalParticipants((prev) => prev + 1);

              // Play sound
              if (isSoundEnabled && audioRef.current) {
                audioRef.current.play().catch(() => {});
              }

              setTimeout(() => setLastEntry(null), 3000);
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
              if (!isMounted) return;
              if (payload.new.status === "completed" && payload.new.winner_id) {
                loadDraw();
              }
            },
          )
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              console.log("✅ Draw live subscription active");
            } else if (status === "CHANNEL_ERROR" && retryCount < MAX_RETRIES) {
              retryCount++;
              setTimeout(setupSubscription, 2000);
            }
          });

        return channel;
      } catch (error) {
        console.warn("Failed to setup subscription:", error);
        return null;
      }
    };

    const channel = setupSubscription();
    loadDraw();
    loadTicker();

    const tickerInterval = setInterval(loadTicker, 5000);
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
      clearInterval(tickerInterval);
      clearInterval(countdownInterval);
    };
  }, [drawId, supabase, loadDraw, loadTicker, updateCountdown, isSoundEnabled]);

  // Start the draw (for host to trigger)
  const startDraw = async () => {
    setDrawing(true);
    setPhase("entries_locked");

    await new Promise((resolve) => setTimeout(resolve, 2000));
    setShufflingNames(true);

    // Shuffle animation
    const shuffleInterval = setInterval(() => {
      const randomNames = [
        "Sarah M.",
        "John K.",
        "Aisha W.",
        "Peter O.",
        "Mary N.",
        "James G.",
        "Grace A.",
        "David K.",
        "Mercy W.",
        "Kevin O.",
      ];
      const randomName =
        randomNames[Math.floor(Math.random() * randomNames.length)];
      setFinalWinner({ users: { full_name: randomName } });
    }, 150);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    clearInterval(shuffleInterval);

    // Perform actual draw
    try {
      const result = await drawsService.performDraw(drawId);
      const { data: winnerData } = await supabase
        .from("draw_winners")
        .select("*, users!draw_winners_user_id_fkey(full_name, email)")
        .eq("draw_id", drawId)
        .eq("winner_rank", 1)
        .single();

      setFinalWinner(winnerData);
      setWinners([winnerData, ...result.winners.slice(1)]);

      if (isSoundEnabled) {
        const winnerSound = new Audio("/sounds/winner-fanfare.mp3");
        winnerSound.play().catch(() => {});
      }

      setShufflingNames(false);
      setPhase("winner_reveal");
    } catch (error) {
      console.error("Draw failed:", error);
    } finally {
      setDrawing(false);
    }
  };

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!draw) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden"
    >
      {/* Audio */}
      <audio ref={audioRef} src="/sounds/entry-chime.mp3" preload="auto" />

      {/* OBS Metadata */}
      <div className="hidden obs-metadata">
        <div data-title={draw.name} />
        <div data-prize={draw.prize_name} />
        <div data-entries={totalEntries} />
        <div data-participants={totalParticipants} />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-4 px-6 text-white">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 animate-pulse" />
                <span className="text-xs font-mono">LIVE DRAW</span>
              </div>
              <h1 className="text-2xl font-bold">{draw.name}</h1>
              <p className="text-white/80 text-sm">{draw.prize_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/30"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-2 rounded-full bg-black/30"
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

      {/* Stats Bar */}
      <div className="bg-black/50 backdrop-blur border-b border-white/10 py-3 px-6">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm">LIVE</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Ticket className="h-4 w-4" />
                <span>{totalEntries.toLocaleString()} entries</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Users className="h-4 w-4" />
                <span>{totalParticipants.toLocaleString()} players</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Clock className="h-4 w-4" />
              <span>{countdown}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* PHASE 1: Entry Collection */}
        {phase === "entry_collection" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Prize Display */}
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
              <CardContent className="p-8 text-center">
                {draw.prize_image_url ? (
                  <img
                    src={draw.prize_image_url}
                    alt={draw.prize_name}
                    className="w-32 h-32 object-cover rounded-full mx-auto mb-4"
                  />
                ) : (
                  <Gift className="h-20 w-20 text-purple-400 mx-auto mb-4" />
                )}
                <h2 className="text-2xl font-bold text-white">
                  {draw.prize_name}
                </h2>
                {draw.prize_value > 0 && (
                  <div className="mt-2 text-xl text-purple-300">
                    {formatPrice(draw.prize_value)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entry Progress */}
            <Card className="bg-black/50 backdrop-blur border-white/10">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4">
                  Entry Progress
                </h3>
                <div className="space-y-4">
                  {Object.entries(entryStats).map(([method, count]) => (
                    <div
                      key={method}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-purple-300 capitalize">
                        {method.replace("_", " ")}
                      </span>
                      <Badge variant="outline">
                        {count.toLocaleString()} entries
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PHASE 2: Entries Locked */}
        {phase === "entries_locked" && !finalWinner && (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 border-purple-500/50 text-center max-w-2xl">
              <CardContent className="py-12">
                {drawing ? (
                  <>
                    <Loader2 className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-spin" />
                    <p className="text-2xl font-bold text-purple-400">
                      Drawing in progress...
                    </p>
                    <p className="text-slate-400 mt-2">
                      Selecting from {totalEntries.toLocaleString()} entries
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">⏰</div>
                    <p className="text-2xl font-bold text-white">
                      Entries are closed!
                    </p>
                    <p className="text-purple-300 mt-2">
                      {totalEntries.toLocaleString()} total entries
                    </p>
                    <Button
                      className="mt-6 bg-purple-600 hover:bg-purple-700"
                      onClick={startDraw}
                    >
                      Start Draw
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* PHASE 3: Winner Reveal */}
        {phase === "winner_reveal" && finalWinner && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-center">
              <CardContent className="py-12">
                {shufflingNames ? (
                  <div className="text-4xl font-mono text-white animate-pulse">
                    {finalWinner.users?.full_name || "???"}
                  </div>
                ) : (
                  <>
                    <PartyPopper className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <Badge className="bg-yellow-500 text-black mb-4">
                      GRAND PRIZE WINNER
                    </Badge>
                    <p className="text-4xl font-bold text-white">
                      {finalWinner.users?.full_name}
                    </p>
                    <p className="text-xl text-purple-300 mt-2">
                      Winner of {draw.prize_name}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {winners.slice(1).length > 0 && (
              <Card className="bg-black/50 backdrop-blur">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-3">Runner Ups</h3>
                  <div className="space-y-2">
                    {winners.slice(1).map((winner, idx) => (
                      <div
                        key={winner.id}
                        className="flex justify-between items-center p-3 rounded-lg bg-white/5"
                      >
                        <span className="text-white">
                          #{idx + 2} - {winner.users?.full_name}
                        </span>
                        <Badge variant="outline">{winner.prize_name}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Scrolling Ticker */}
      {phase === "entry_collection" && ticker.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-t border-purple-500/30 py-2 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
            {ticker.slice(0, 30).map((entry, idx) => (
              <span key={idx} className="inline-block mx-4 text-sm text-white">
                🎉 {entry.user_name} earned {entry.entry_count} entry (
                {entry.entry_method}) 🎉
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Floating Entry Alert */}
      {lastEntry && phase === "entry_collection" && (
        <div className="fixed bottom-20 right-4 animate-in slide-in-from-right fade-in">
          <Card className="bg-green-500/20 border-green-500/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-white text-sm">{lastEntry.user_name}</p>
                <p className="text-xs text-green-300">
                  +{lastEntry.entry_count} entries
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
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
      `}</style>
    </div>
  );
}
