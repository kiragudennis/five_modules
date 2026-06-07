// app/(store)/draws/[drawId]/page.tsx
// Customer-facing draw page - Enter draws, track entries, watch the show!

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { DrawsService } from "@/lib/services/draws-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Gift,
  Ticket,
  Users,
  Clock,
  Coins,
  Crown,
  Share2,
  ShoppingBag,
  Radio,
  Loader2,
  Calendar,
  TrendingUp,
  Zap,
  Heart,
  Twitter,
  Facebook,
  Copy,
  Check,
  Sparkles,
  PartyPopper,
  Medal,
  Timer,
  Star,
  AlertCircle,
  Trophy,
  Eye,
} from "lucide-react";
import { GiOpenTreasureChest } from "react-icons/gi";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Draw } from "@/types/draws";

interface UserDrawStatus {
  total_entries: number;
  remaining_entries_allowed: number | null;
  entry_methods_used: Record<string, number>;
  can_enter_purchase: boolean;
  can_enter_referral: boolean;
  can_enter_social: boolean;
  can_enter_live: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  entry_count: number;
  rank?: number;
}

export default function DrawDetailPage() {
  const { drawId } = useParams<{ drawId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [userStatus, setUserStatus] = useState<UserDrawStatus | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [socialPlatform, setSocialPlatform] = useState<
    "facebook" | "twitter" | "whatsapp"
  >("facebook");
  const [liveEmail, setLiveEmail] = useState("");
  const [liveName, setLiveName] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDrawStarting, setIsDrawStarting] = useState(false);
  const [shufflingNames, setShufflingNames] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [finalWinner, setFinalWinner] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const drawsService = new DrawsService(supabase);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [liveEntryAwarded, setLiveEntryAwarded] = useState(false);

  // Add this state near the top of the component
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const isEntryOpen =
    draw?.status === "open" &&
    new Date(draw.entry_starts_at) <= new Date() &&
    new Date(draw.entry_ends_at) >= new Date();

  // Add this useEffect to handle the countdown
  useEffect(() => {
    if (!draw?.draw_time) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const drawTime = new Date(draw.draw_time).getTime();
      const difference = drawTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [draw?.draw_time]);

  // Auto-award live stream entry when page loads (once per draw, using RPC)
  useEffect(() => {
    const awardLiveStreamEntry = async () => {
      if (!profile?.id || !drawId || liveEntryAwarded) return;

      // Only award if draw is open and live stream entries are enabled
      if (isEntryOpen && draw?.entry_calculation?.live_stream?.enabled) {
        try {
          const result = await drawsService.awardLiveStreamEntry(drawId);
          if (result.success) {
            setLiveEntryAwarded(true);
            toast.success(
              `🎥 Live stream entry awarded! +${result.entries_awarded} entries`,
              {
                description: "Thanks for watching the live broadcast!",
              },
            );
            loadData(); // Refresh to show updated entry count
          } else if (result.message !== "Live stream entry already awarded") {
            console.log("Live stream entry not awarded:", result.message);
          }
        } catch (error) {
          console.error("Error awarding live entry:", error);
        }
      }
    };

    if (draw) {
      awardLiveStreamEntry();
    }
  }, [draw, drawId, profile?.id, drawsService, liveEntryAwarded, isEntryOpen]);

  const loadData = useCallback(async () => {
    if (!drawId) return;

    try {
      const [drawData, statusData] = await Promise.all([
        drawsService.getDraw(drawId, profile?.id),
        profile?.id ? drawsService.getUserDrawStatus(drawId, profile.id) : null,
      ]);

      setDraw(drawData);
      setUserStatus(statusData);

      // Get total entries and participants
      const total = await drawsService.getTotalEntries(drawId);
      setTotalEntries(total);

      const { data: participants } = await supabase
        .from("draw_entries")
        .select("user_id")
        .eq("draw_id", drawId);
      setTotalParticipants(
        participants ? new Set(participants.map((p) => p.user_id)).size : 0,
      );

      // Get leaderboard
      const board = await drawsService.getEntryLeaderboard(drawId, 20);
      setLeaderboard(
        board.map((b: any, idx: number) => ({ ...b, rank: idx + 1 })),
      );

      // Check if user is a winner
      if (profile?.id && drawData?.status === "completed") {
        const { data: winner } = await supabase
          .from("draw_winners")
          .select("*, users!user_id(full_name)")
          .eq("draw_id", drawId)
          .eq("user_id", profile.id)
          .single();
        if (winner && winner.claim_status === "pending") {
          setFinalWinner(winner);
        }
      }
    } catch (error) {
      console.error("Error loading draw:", error);
      toast.error("Could not load draw details");
    } finally {
      setLoading(false);
    }
  }, [drawId, profile?.id, supabase, drawsService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates for entries
  useEffect(() => {
    if (!drawId || !profile?.id) return;

    const channel = supabase
      .channel(`draw-user-${drawId}-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "draw_entries",
          filter: `draw_id=eq.${drawId}`,
        },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [drawId, profile?.id, supabase, loadData]);

  // Watch for draw completion to show celebration
  useEffect(() => {
    if (!drawId) return;

    const channel = supabase
      .channel(`draw-complete-${drawId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "draws",
          filter: `id=eq.${drawId}`,
        },
        (payload) => {
          if (
            payload.new.status === "completed" &&
            payload.old.status !== "completed"
          ) {
            // Trigger celebration
            setShowConfetti(true);
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
            // Refresh to show winners
            loadData();
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [drawId, supabase, loadData]);

  const handlePurchaseEntry = async () => {
    if (!profile) {
      toast.error("Please login to enter");
      router.push("/login");
      return;
    }
    setEntering(true);
    try {
      router.push(`/?draw=${drawId}&entry=purchase`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEntering(false);
    }
  };

  const handleReferralEntry = async () => {
    if (!profile) {
      toast.error("Please login to enter");
      router.push("/login");
      return;
    }
    if (!referralCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }
    setEntering(true);
    try {
      const { data: referredUser } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referralCode)
        .single();
      if (!referredUser) {
        toast.error("Invalid referral code");
        return;
      }
      await drawsService.addReferralEntries(
        drawId,
        profile.id,
        referredUser.id,
      );
      toast.success("Referral entries added!");
      setReferralCode("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEntering(false);
    }
  };

  const handleSocialShare = async () => {
    if (!profile) return;
    setEntering(true);
    try {
      const shareUrl = `${window.location.origin}/draws/${drawId}`;
      const shareText = `🎁 Check out this amazing draw: ${draw?.name}! Prize: ${draw?.prize_name}`;
      let shareLink = "";
      switch (socialPlatform) {
        case "facebook":
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          break;
        case "twitter":
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case "whatsapp":
          shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
          break;
      }
      window.open(shareLink, "_blank");
      await drawsService.addSocialShareEntry(
        drawId,
        profile.id,
        socialPlatform,
        "draw",
      );
      toast.success("Social share entries added!");
      setShowShareDialog(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEntering(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isDrawCompleted = draw?.status === "completed";
  const timeRemaining = draw?.entry_ends_at
    ? formatDistanceToNow(new Date(draw.entry_ends_at), { addSuffix: true })
    : null;
  const drawTimeRemaining = draw?.draw_time
    ? formatDistanceToNow(new Date(draw.draw_time), { addSuffix: true })
    : null;
  const progressPercent = draw?.max_entries_total
    ? (totalEntries / draw.max_entries_total) * 100
    : 0;
  const canJoin =
    isEntryOpen &&
    (!draw?.max_entries_per_user ||
      (userStatus?.remaining_entries_allowed ?? 0) > 0);

  if (loading) {
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground"> Loading draw details...</p>
        </div>
      </div>
    );
  }

  if (!draw) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Draw Not Found</h2>
        <p className="text-muted-foreground">
          This draw doesn't exist or has been removed.
        </p>
        <Button className="mt-4" onClick={() => router.push("/draws")}>
          Browse Draws
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section - GiOpenTreasureChest Box Theme */}
      {/* Hero Section - Treasure Box Theme */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <GiOpenTreasureChest className="w-full h-full" />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Top Row: Countdown + Join Badge */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            {/* Countdown Timer - Left Side */}
            {!isDrawCompleted &&
              draw.draw_time &&
              new Date(draw.draw_time) > new Date() && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-3 bg-black/30 backdrop-blur rounded-full px-4 py-2"
                >
                  <Timer className="h-5 w-5 animate-pulse" />
                  <div className="flex gap-2 font-mono font-bold text-sm md:text-base">
                    <div className="text-center">
                      <span className="text-lg md:text-xl">
                        {String(timeLeft.days).padStart(2, "0")}
                      </span>
                      <span className="text-xs ml-0.5">d</span>
                    </div>
                    <span className="text-lg md:text-xl">:</span>
                    <div className="text-center">
                      <span className="text-lg md:text-xl">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </span>
                      <span className="text-xs ml-0.5">h</span>
                    </div>
                    <span className="text-lg md:text-xl">:</span>
                    <div className="text-center">
                      <span className="text-lg md:text-xl">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </span>
                      <span className="text-xs ml-0.5">m</span>
                    </div>
                    <span className="text-lg md:text-xl">:</span>
                    <div className="text-center">
                      <span className="text-lg md:text-xl text-yellow-300">
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </span>
                      <span className="text-xs ml-0.5">s</span>
                    </div>
                  </div>
                  <span className="text-xs opacity-80 hidden sm:inline">
                    until draw
                  </span>
                </motion.div>
              )}

            {/* Right Side - Can Join Badge */}
            <div className="flex items-center gap-2">
              {canJoin && !isDrawCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="flex items-center gap-2 bg-green-500 rounded-full px-4 py-2 shadow-lg"
                >
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-semibold">
                    You can join this draw!
                  </span>
                  <span className="text-xs opacity-90">
                    You have a chance to win!
                  </span>
                </motion.div>
              )}

              {!profile && !isDrawCompleted && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  Login to Enter
                </Button>
              )}

              {draw.status === "completed" && (
                <Badge className="bg-green-500 text-white px-4 py-2">
                  <Trophy className="h-4 w-4 mr-2" />
                  Draw Completed
                </Badge>
              )}
            </div>
          </div>

          {/* Center Content */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                <GiOpenTreasureChest className="h-10 w-10" />
              </div>
            </motion.div>

            <Badge className="bg-white/20 text-white mb-4 border-0">
              {draw.status === "open"
                ? "🔴 OPEN FOR ENTRIES"
                : draw.status === "completed"
                  ? "🏆 DRAW COMPLETED"
                  : "⏰ CLOSED"}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold mb-3">{draw.name}</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {draw.description}
            </p>

            {/* Quick Stats Row */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {totalEntries.toLocaleString()}
                </p>
                <p className="text-xs opacity-80">Total Entries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {totalParticipants.toLocaleString()}
                </p>
                <p className="text-xs opacity-80">Participants</p>
              </div>
              {draw.draw_time && new Date(draw.draw_time) > new Date() && (
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {format(new Date(draw.draw_time), "MMM d")}
                  </p>
                  <p className="text-xs opacity-80">Draw Date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prize GiOpenTreasureChest Chest Card */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto -mt-12 relative z-20"
        >
          <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-300 dark:border-amber-800 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6 p-6">
              {/* Prize Image */}
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-200 to-yellow-200 dark:from-amber-800/50 dark:to-yellow-800/50 flex items-center justify-center shadow-xl">
                  {draw.prize_image_url ? (
                    <img
                      src={draw.prize_image_url}
                      alt={draw.prize_name}
                      className="w-32 h-32 object-contain rounded-full"
                    />
                  ) : (
                    <Gift className="h-16 w-16 text-amber-600" />
                  )}
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Prize Info */}
              <div className="flex-1 text-center md:text-left">
                <Badge className="bg-amber-500 text-white mb-2">
                  🏆 GRAND PRIZE
                </Badge>
                <h2 className="text-3xl font-bold text-amber-800 dark:text-amber-400">
                  {draw.prize_name}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {draw.prize_description}
                </p>
                {draw.prize_value && draw.prize_value > 0 && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Coins className="h-4 w-4 text-amber-600" />
                    <span className="font-bold text-amber-700">
                      {formatPrice(draw.prize_value)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Mini Cards */}
              <div className="flex gap-3">
                <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
                  <p className="text-2xl font-bold text-amber-700">
                    {totalEntries.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Entries</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
                  <p className="text-2xl font-bold text-amber-700">
                    {totalParticipants.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Participants</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Entry Methods & User Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Entry Pool Progress with Explanation */}
            {isEntryOpen && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Entry Pool Progress
                    </h3>
                    <div className="group relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-full"
                      >
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <div className="absolute right-0 top-6 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p>
                          The entry pool is the total number of entries
                          collected. Once it reaches the limit, no more entries
                          can be added!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {totalEntries.toLocaleString()} entries collected
                      </span>
                      {draw.max_entries_total && (
                        <span className="text-muted-foreground">
                          Limit: {draw.max_entries_total.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    {draw.max_entries_total && progressPercent > 80 && (
                      <p className="text-xs text-orange-500 animate-pulse flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Almost full! Enter soon to secure your spot!
                      </p>
                    )}
                    {!draw.max_entries_total && (
                      <p className="text-xs text-muted-foreground mt-1">
                        🎯 No limit on entries - every purchase gives you more
                        chances to win!
                      </p>
                    )}
                  </div>

                  {/* How it works note */}
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                      More entries = higher chance of winning
                    </p>
                    <p className="flex items-center gap-1 mt-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Each qualifying purchase automatically adds entries
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Your Entry Status with Explanation */}
            {profile && userStatus && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-purple-500" />
                      Your Entry Status
                    </h3>
                    <div className="group relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-full"
                      >
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <div className="absolute right-0 top-6 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p>
                          Every time you make a purchase or refer a friend, you
                          earn entries. More entries = better chance to win!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-primary/5">
                      <p className="text-3xl font-bold text-primary">
                        {userStatus.total_entries}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Entries
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        your current ticket count
                      </p>
                    </div>
                    {draw.max_entries_per_user && (
                      <div className="text-center p-3 rounded-lg bg-primary/5">
                        <p className="text-3xl font-bold">
                          {userStatus.remaining_entries_allowed ?? 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Remaining
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          spots left for you
                        </p>
                      </div>
                    )}
                  </div>

                  {Object.keys(userStatus.entry_methods_used).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        How you earned your entries:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(userStatus.entry_methods_used).map(
                          ([method, count]) => (
                            <Badge
                              key={method}
                              variant="secondary"
                              className="gap-1 text-xs"
                            >
                              {method === "purchase" && (
                                <ShoppingBag className="h-3 w-3" />
                              )}
                              {method === "referral" && (
                                <Users className="h-3 w-3" />
                              )}
                              {method === "social_share" && (
                                <Share2 className="h-3 w-3" />
                              )}
                              {method === "live_stream_entry" && (
                                <Radio className="h-3 w-3" />
                              )}
                              {method === "loyalty_bonus" && (
                                <Crown className="h-3 w-3" />
                              )}
                              {method.replace("_", " ")}: {count}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tips to earn more entries */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium mb-2">
                      💡 Want more entries?
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {draw.entry_config?.purchase && (
                        <p className="flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3 text-green-500" />
                          Make a purchase - automatically adds entries
                        </p>
                      )}
                      {draw.entry_config?.referral && (
                        <p className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-blue-500" />
                          Refer a friend - they join, you get entries!
                        </p>
                      )}
                      {draw.entry_config?.social_share && (
                        <p className="flex items-center gap-1">
                          <Share2 className="h-3 w-3 text-purple-500" />
                          Share on social media - quick and easy entries
                        </p>
                      )}
                      {draw.entry_config?.live_stream && (
                        <p className="flex items-center gap-1">
                          <Radio className="h-3 w-3 text-red-500" />
                          Join live stream - bonus entries for watching
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Simple explanation for non-tech users */}
                  <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-center">
                      🎯 <span className="font-medium">How it works:</span> The
                      more entries you have, the higher your chance of winning.
                      Each entry is like a lottery ticket. Every purchase or
                      referral adds more tickets to your name!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Entry Methods Tabs */}
            {isEntryOpen && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    How to Enter
                  </h3>
                  <Tabs defaultValue="purchase" className="w-full">
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="purchase">Purchase</TabsTrigger>
                      <TabsTrigger value="referral">Referral</TabsTrigger>
                      <TabsTrigger value="social">Social</TabsTrigger>
                      <TabsTrigger value="live">Live Stream</TabsTrigger>
                    </TabsList>

                    <TabsContent value="purchase" className="space-y-4">
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-sm">
                          Make a qualifying purchase to earn entries.
                        </p>
                        {draw.entry_config?.purchase?.entries_per_ksh && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Earn {draw.entry_config.purchase.entries_per_ksh}{" "}
                            entry per KSH spent.
                          </p>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handlePurchaseEntry}
                        disabled={entering}
                      >
                        {entering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-4 w-4 mr-2" />
                        )}
                        Shop & Earn Entries
                      </Button>
                    </TabsContent>

                    <TabsContent value="referral" className="space-y-4">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-sm">
                          Refer a friend to earn entries.
                        </p>
                      </div>
                      {/* Referral Link Card */}
                      {profile && isEntryOpen && (
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Share2 className="h-4 w-4" />
                            Your Referral Link
                          </h3>
                          <div className="flex gap-2">
                            <Input
                              value={`${window.location.origin}/signup?ref=${profile.id}`}
                              readOnly
                              className="flex-1 text-xs"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/signup?ref=${profile.id}`,
                                );
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                                toast.success("Referral link copied!");
                              }}
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                      />
                      <Button
                        className="w-full"
                        onClick={handleReferralEntry}
                        disabled={entering || !referralCode}
                      >
                        {entering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Users className="h-4 w-4 mr-2" />
                        )}
                        Submit Referral
                      </Button>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-4">
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <p className="text-sm">
                          Share on social media to earn entries.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSocialPlatform("facebook");
                            setShowShareDialog(true);
                          }}
                        >
                          <Facebook className="h-4 w-4 text-blue-600" />{" "}
                          Facebook
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSocialPlatform("twitter");
                            setShowShareDialog(true);
                          }}
                        >
                          <Twitter className="h-4 w-4 text-sky-500" /> Twitter
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSocialPlatform("whatsapp");
                            setShowShareDialog(true);
                          }}
                        >
                          <div className="h-4 w-4 text-green-500">📱</div>{" "}
                          WhatsApp
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="live" className="space-y-4">
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <Radio className="h-4 w-4 text-red-500 inline mr-2" />
                        <span className="text-sm font-medium">
                          Live Stream Bonus Entry
                        </span>
                        <p className="text-xs text-muted-foreground mt-2">
                          {liveEntryAwarded
                            ? "✓ You've already received your live stream bonus entry!"
                            : "Watch the live broadcast and get free entries automatically!"}
                        </p>
                        {draw.entry_config?.live_stream?.entries_per_email && (
                          <p className="text-xs text-green-600 mt-1">
                            🎁 +
                            {draw.entry_config.live_stream.entries_per_email}{" "}
                            entries for watching!
                          </p>
                        )}
                      </div>

                      {/* Live Broadcast Buttons */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                          onClick={() =>
                            window.open(`/draws/live/${drawId}`, "_blank")
                          }
                        >
                          <Eye className="h-4 w-4 mr-2 animate-pulse" />
                          Watch Live Broadcast
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            const liveUrl = `${window.location.origin}/draws/live/${drawId}`;
                            navigator.clipboard.writeText(liveUrl);
                            toast.success("Live stream link copied!");
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Stream
                        </Button>
                      </div>

                      {!liveEntryAwarded && (
                        <p className="text-xs text-center text-muted-foreground">
                          💡 Simply visit this page during a live broadcast to
                          automatically receive bonus entries!
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Winner Reveal Animation */}
            {isDrawCompleted && finalWinner && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-4"
              >
                <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center overflow-hidden">
                  <CardContent className="py-8">
                    <PartyPopper className="h-16 w-16 mx-auto mb-4" />
                    <Badge className="bg-white/20 text-white mb-3">
                      🏆 GRAND PRIZE WINNER 🏆
                    </Badge>
                    <p className="text-3xl font-bold">
                      {finalWinner.users?.full_name || "Winner"}
                    </p>
                    <p className="text-lg mt-2">Won {draw.prize_name}</p>
                    {finalWinner.claim_status === "pending" &&
                      finalWinner.user_id === profile?.id && (
                        <Button className="mt-4 bg-white text-orange-600 hover:bg-gray-100">
                          Claim Your Prize →
                        </Button>
                      )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            {/* Live Entry Ticker */}
            {draw.show_entry_ticker && <LiveEntryTicker drawId={drawId} />}

            {/* Leaderboard */}
            {draw.show_leaderboard && leaderboard.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Top Entrants
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {leaderboard.slice(0, 10).map((entry) => (
                      <div
                        key={entry.user_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          {entry.rank === 1 && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                          {entry.rank === 2 && (
                            <Medal className="h-4 w-4 text-gray-400" />
                          )}
                          {entry.rank === 3 && (
                            <Medal className="h-4 w-4 text-amber-600" />
                          )}
                          {entry.rank && entry.rank > 3 && (
                            <span className="text-xs text-muted-foreground w-4">
                              #{entry.rank}
                            </span>
                          )}
                          <span className="text-sm truncate max-w-[120px]">
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

            {/* Draw Details Card */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Draw Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entries Open</span>
                    <span>
                      {format(
                        new Date(draw.entry_starts_at),
                        "PPP 'at' h:mm a",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entries Close</span>
                    <span>
                      {format(new Date(draw.entry_ends_at), "PPP 'at' h:mm a")}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Draw Date</span>
                    <span>
                      {format(new Date(draw.draw_time), "PPP 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Entry Methods List */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Entry Methods Available</h3>
                <div className="flex flex-wrap gap-2">
                  {draw.entry_config?.purchase && (
                    <Badge className="gap-1">
                      <ShoppingBag className="h-3 w-3" /> Purchase
                    </Badge>
                  )}
                  {draw.entry_config?.referral && (
                    <Badge className="gap-1">
                      <Users className="h-3 w-3" /> Referral
                    </Badge>
                  )}
                  {draw.entry_config?.social_share && (
                    <Badge className="gap-1">
                      <Share2 className="h-3 w-3" /> Social Share
                    </Badge>
                  )}
                  {draw.entry_config?.live_stream && (
                    <Badge className="gap-1">
                      <Radio className="h-3 w-3" /> Live Stream
                    </Badge>
                  )}
                  {draw.entry_config?.loyalty_tier && (
                    <Badge className="gap-1">
                      <Crown className="h-3 w-3" /> Loyalty Bonus
                    </Badge>
                  )}
                </div>
                {draw.consolation_points_amount &&
                  draw.consolation_points_amount > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Heart className="h-4 w-4" />
                        <span>
                          Everyone gets {draw.consolation_points_amount}{" "}
                          consolation points!
                        </span>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* NEW: Join Live Stream Tab */}
            {draw.entry_config?.live_stream && !isDrawCompleted && (
              <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 overflow-hidden">
                <div className="relative">
                  {/* Live indicator */}
                  <div className="absolute top-0 right-0">
                    <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-bl-lg text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Live Stream Event</h3>
                        <p className="text-xs text-muted-foreground">
                          Join the live broadcast
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      Tune in to our live stream for a chance to earn bonus
                      entries and watch the draw live!
                    </p>

                    <div className="space-y-3">
                      {/* Live stream schedule if available */}
                      {draw.draw_time &&
                        new Date(draw.draw_time) > new Date() && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Next live draw:{" "}
                              {formatDistanceToNow(new Date(draw.draw_time), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        )}

                      {/* Entry bonus info */}
                      {draw.entry_config?.live_stream?.entries_per_email && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Star className="h-3 w-3" />
                          <span>
                            Get{" "}
                            {draw.entry_config.live_stream.entries_per_email}{" "}
                            entries for joining!
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                          onClick={() =>
                            window.open(`/draws/live/${drawId}`, "_blank")
                          }
                        >
                          <Radio className="h-4 w-4 mr-2 animate-pulse" />
                          Watch Live Stream
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            const liveUrl = `${window.location.origin}/draws/live/${drawId}`;
                            navigator.clipboard.writeText(liveUrl);
                            toast.success("Live stream link copied!");
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Stream
                        </Button>
                      </div>

                      {/* Call to action for email signup */}
                      <div className="mt-3 pt-3 border-t border-red-500/20">
                        <p className="text-xs text-center text-muted-foreground">
                          🎁 Bonus: Enter your email during the stream for extra
                          entries!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )}

            {/* Share Event Card - Social Proof */}
            {isEntryOpen && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Spread the Word
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Share this draw with friends and family!
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/draws/${drawId}`;
                        navigator.clipboard.writeText(shareUrl);
                        toast.success("Draw link copied!");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(`Check out this amazing draw: ${draw.name}! Prize: ${draw.prize_name} ${window.location.origin}/draws/${drawId}`)}`,
                          "_blank",
                        );
                      }}
                    >
                      <div className="h-3 w-3 mr-1">📱</div>
                      WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share on {socialPlatform}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">Share this draw to earn entries!</p>
            <Button className="w-full" onClick={handleSocialShare}>
              <Share2 className="h-4 w-4 mr-2" /> Share Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Live Entry Ticker Component
function LiveEntryTicker({ drawId }: { drawId: string }) {
  const { supabase } = useAuth();
  const [ticker, setTicker] = useState<any[]>([]);

  useEffect(() => {
    const loadTicker = async () => {
      const { data } = await supabase
        .from("draw_live_ticker")
        .select("*")
        .eq("draw_id", drawId)
        .order("created_at", { ascending: false })
        .limit(20);
      setTicker(data || []);
    };
    loadTicker();

    const channel = supabase
      .channel(`draw-ticker-${drawId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "draw_live_ticker",
          filter: `draw_id=eq.${drawId}`,
        },
        (payload) => {
          setTicker((prev) => [payload.new, ...prev.slice(0, 19)]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [drawId, supabase]);

  if (ticker.length === 0) return null;

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Live Activity
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {ticker.slice(0, 10).map((item, idx) => (
            <div key={idx} className="text-sm text-muted-foreground">
              🎉 {item.user_name} earned {item.entry_count} entries!
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
