// app/(store)/draws/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { DrawsService } from "@/lib/services/draws-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Ticket,
  Calendar,
  Clock,
  Trophy,
  Users,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  Zap,
  Crown,
  Star,
  Radio,
  Share2,
  ShoppingBag,
  CheckCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ActiveDraw {
  id: string;
  name: string;
  description: string;
  prize_name: string;
  prize_value: number;
  prize_image_url: string;
  entry_config: any;
  max_entries_total: number | null;
  max_entries_per_user: number | null;
  entry_starts_at: string;
  entry_ends_at: string;
  draw_time: string;
  theme_color: string;
  user_entry_count?: number;
}

export default function DrawsLandingPage() {
  const { supabase, profile } = useAuth();
  const [draws, setDraws] = useState<ActiveDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [entryCounts, setEntryCounts] = useState<
    Record<string, { total: number; participants: number }>
  >({});

  const drawsService = new DrawsService(supabase);

  const fetchDraws = useCallback(async () => {
    try {
      // Fetch active draws
      const { data: drawsData, error } = await supabase
        .from("draws")
        .select("*")
        .eq("status", "open")
        .lte("entry_starts_at", new Date().toISOString())
        .gte("entry_ends_at", new Date().toISOString())
        .order("draw_time", { ascending: true });

      if (error) throw error;

      // Get entry counts for each draw
      const counts: Record<string, { total: number; participants: number }> =
        {};

      for (const draw of drawsData || []) {
        // Get total entries
        const { count: totalEntries } = await supabase
          .from("draw_entries")
          .select("id", { count: "exact", head: true })
          .eq("draw_id", draw.id);

        // Get unique participants
        const { data: participants } = await supabase
          .from("draw_entries")
          .select("user_id")
          .eq("draw_id", draw.id);

        const uniqueParticipants = participants
          ? new Set(participants.map((p) => p.user_id)).size
          : 0;

        counts[draw.id] = {
          total: totalEntries || 0,
          participants: uniqueParticipants,
        };

        // If user is logged in, get their entry count
        if (profile?.id) {
          const { count: userEntries } = await supabase
            .from("draw_entries")
            .select("id", { count: "exact", head: true })
            .eq("draw_id", draw.id)
            .eq("user_id", profile.id);

          (draw as any).user_entry_count = userEntries || 0;
        }
      }

      setEntryCounts(counts);
      setDraws(drawsData || []);
    } catch (error) {
      console.error("Error fetching draws:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, profile?.id]);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  // Real-time subscription for entry updates - FIXED
  useEffect(() => {
    if (!profile?.id) return;

    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let channel: any = null;

    const setupSubscription = () => {
      try {
        channel = supabase
          .channel("draws-updates")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "draw_entries",
            },
            () => {
              if (isMounted) {
                fetchDraws(); // Refresh counts when new entries come in
              }
            },
          )
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              console.log("✅ Draws landing page subscription active");
            } else if (status === "CHANNEL_ERROR" && retryCount < MAX_RETRIES) {
              retryCount++;
              console.warn(
                `Subscription error, retrying (${retryCount}/${MAX_RETRIES})...`,
              );
              setTimeout(setupSubscription, 2000);
            }
          });
      } catch (error) {
        console.warn("Failed to setup subscription:", error);
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (e) {
          console.warn("Error unsubscribing:", e);
        }
      }
    };
  }, [supabase, profile?.id, fetchDraws]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    if (end < new Date()) return "Ended";
    return formatDistanceToNow(end, { addSuffix: true });
  };

  const getEntryProgress = (draw: ActiveDraw) => {
    const stats = entryCounts[draw.id];
    if (!draw.max_entries_total || !stats) return null;
    return (stats.total / draw.max_entries_total) * 100;
  };

  const getEntryMethodsList = (config: any) => {
    const methods = [];
    if (config?.purchase)
      methods.push({ icon: ShoppingBag, label: "Purchase" });
    if (config?.referral) methods.push({ icon: Users, label: "Referral" });
    if (config?.social_share)
      methods.push({ icon: Share2, label: "Social Share" });
    if (config?.live_stream)
      methods.push({ icon: Radio, label: "Live Stream" });
    if (config?.loyalty_tier)
      methods.push({ icon: Crown, label: "Loyalty Bonus" });
    return methods;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">Active Giveaways</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Enter to Win Amazing Prizes
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Participate in our lucky draws for a chance to win exciting prizes.
            Multiple ways to enter - purchases, referrals, social shares, and
            more!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Active Draws Grid */}
        {draws.length === 0 ? (
          <Card className="p-12 text-center max-w-2xl mx-auto">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Draws</h3>
            <p className="text-muted-foreground mb-4">
              There are no active draws at the moment. Check back soon for
              exciting giveaways!
            </p>
            <Button asChild variant="outline">
              <Link href="/draws/history">View Past Draws</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draws.map((draw) => {
              const progress = getEntryProgress(draw);
              const timeRemaining = getTimeRemaining(draw.entry_ends_at);
              const entryMethods = getEntryMethodsList(draw.entry_config);
              const stats = entryCounts[draw.id];
              const isUrgent =
                new Date(draw.entry_ends_at).getTime() - Date.now() <
                24 * 60 * 60 * 1000;

              return (
                <Card
                  key={draw.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Prize Image Banner */}
                  <div className="relative h-40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    {draw.prize_image_url ? (
                      <img
                        src={draw.prize_image_url}
                        alt={draw.prize_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Gift className="h-12 w-12 text-purple-400" />
                    )}

                    {/* Urgent Badge */}
                    {isUrgent && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-red-500 text-white animate-pulse gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Ending Soon
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Draw Title & Prize */}
                    <div>
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {draw.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Gift className="h-4 w-4 text-purple-500" />
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {draw.prize_name}
                        </span>
                        {draw.prize_value > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {formatPrice(draw.prize_value)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {draw.description}
                    </p>

                    {/* Entry Methods */}
                    <div className="flex flex-wrap gap-1.5">
                      {entryMethods.map((method, idx) => {
                        const Icon = method.icon;
                        return (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs gap-1"
                          >
                            <Icon className="h-3 w-3" />
                            {method.label}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Stats */}
                    {stats && (
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Ticket className="h-3 w-3 text-blue-500" />
                          <span>{stats.total.toLocaleString()} entries</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-green-500" />
                          <span>
                            {stats.participants.toLocaleString()} players
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {progress !== null && progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Entry Pool Progress
                          </span>
                          <span className="font-medium">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}

                    {/* Timing */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(draw.draw_time), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          isUrgent
                            ? "text-red-500 font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{timeRemaining}</span>
                      </div>
                    </div>

                    {/* User Entry Count (if logged in) */}
                    {profile && (draw as any).user_entry_count > 0 && (
                      <div className="p-2 rounded-lg bg-primary/5 text-center">
                        <p className="text-xs">
                          You have{" "}
                          <span className="font-bold text-primary">
                            {(draw as any).user_entry_count}
                          </span>{" "}
                          entries in this draw
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button asChild className="w-full group">
                      <Link href={`/draws/${draw.id}`}>
                        Enter Draw
                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* View History Link */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-3">
            Want to see past winners?
          </p>
          <Button asChild variant="outline">
            <Link href="/draws/history">
              View Draw History
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* How It Works Section */}
        {draws.length > 0 && (
          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold text-center mb-8">
              How Our Draws Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                  <Ticket className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-1">1. Earn Entries</h3>
                <p className="text-sm text-muted-foreground">
                  Make purchases, refer friends, share on social media, or join
                  live streams
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="font-semibold mb-1">2. Wait for Draw</h3>
                <p className="text-sm text-muted-foreground">
                  Entries close at the specified time. The more entries, the
                  higher your chances!
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="font-semibold mb-1">3. Winner Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Winners are randomly selected and announced on our live
                  display
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-1">4. Claim Prize</h3>
                <p className="text-sm text-muted-foreground">
                  Winners receive notifications to claim their prizes within 7
                  days
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
