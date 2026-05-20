// app/(store)/challenges/page.tsx (Customer-facing)
// Customer-facing Challenges Page - Browse active challenges, view details, and join competitions to earn rewards.
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { ChallengesService } from "@/lib/services/challenges-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Users,
  ShoppingBag,
  Share2,
  Flame,
  UsersRound,
  Sparkles,
  Crown,
  Coins,
  Calendar,
  Clock,
  Target,
  Zap,
  ArrowRight,
  TrendingUp,
  Award,
  Star,
  Gift,
  Heart,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Challenge } from "@/types/challenges";

interface ChallengeWithParticipant extends Challenge {
  user_participant?: {
    current_score: number;
    current_rank: number;
    current_streak?: number;
  };
}

const CHALLENGE_ICONS: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  referral: {
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    label: "Referral Challenge",
  },
  purchase: {
    icon: ShoppingBag,
    color: "from-green-500 to-emerald-500",
    label: "Purchase Challenge",
  },
  share: {
    icon: Share2,
    color: "from-purple-500 to-pink-500",
    label: "Social Share Challenge",
  },
  streak: {
    icon: Flame,
    color: "from-orange-500 to-red-500",
    label: "Daily Streak Challenge",
  },
  team: {
    icon: UsersRound,
    color: "from-indigo-500 to-purple-500",
    label: "Team Challenge",
  },
  combo: {
    icon: Sparkles,
    color: "from-yellow-500 to-orange-500",
    label: "Combo Challenge",
  },
  social: {
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    label: "Social Challenge",
  },
};

export default function ChallengesPage() {
  const { supabase, profile } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<ChallengeWithParticipant[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const challengesService = new ChallengesService(supabase);

  const fetchChallenges = useCallback(async () => {
    if (!profile?.id) {
      // Just fetch active challenges without user data
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .eq("status", "active")
        .lte("starts_at", new Date().toISOString())
        .gte("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true });

      setActiveChallenges(data || []);
      setLoading(false);
      return;
    }

    // Fetch both active and user's joined challenges
    const [active, userChallenges] = await Promise.all([
      challengesService.getActiveChallenges(profile.id),
      challengesService.getUserChallenges(profile.id),
    ]);

    setActiveChallenges(active);
    setMyChallenges(userChallenges);
    setLoading(false);
  }, [supabase, profile?.id, challengesService]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Real-time updates for challenges
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("challenges-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_participants",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          fetchChallenges();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, profile?.id, fetchChallenges]);

  const formatPrize = (tier: any) => {
    switch (tier.prize_type) {
      case "points":
        return `${tier.prize_value.toLocaleString()} points`;
      case "discount":
        return `${tier.prize_value}% off`;
      case "free_shipping":
        return "Free Shipping";
      case "badge":
        return tier.prize_value;
      default:
        return tier.prize_value;
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt);
    if (end < new Date()) return "Ended";
    return formatDistanceToNow(end, { addSuffix: true });
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
          <Trophy className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Challenges & Competitions
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto" />
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Complete challenges, earn points, and win amazing prizes. Compete
            against others and climb the leaderboard!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="active">Active Challenges</TabsTrigger>
            {profile && <TabsTrigger value="my">My Challenges</TabsTrigger>}
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeChallenges.length === 0 ? (
              <Card className="p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Active Challenges
                </h3>
                <p className="text-muted-foreground">
                  There are no active challenges at the moment. Check back soon!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeChallenges.map((challenge) => {
                  const config = CHALLENGE_ICONS[challenge.challenge_type];
                  const Icon = config?.icon || Target;
                  const timeRemaining = getTimeRemaining(challenge.ends_at);
                  const isUrgent =
                    new Date(challenge.ends_at).getTime() - Date.now() <
                    24 * 60 * 60 * 1000;

                  return (
                    <Card
                      key={challenge.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
                    >
                      {/* Header */}
                      <div
                        className={cn(
                          "h-32 bg-gradient-to-r p-4 text-white relative",
                          config?.color || "from-purple-500 to-pink-500",
                        )}
                      >
                        <div className="absolute top-4 right-4">
                          {isUrgent && (
                            <Badge className="bg-red-500 text-white animate-pulse">
                              <Clock className="h-3 w-3 mr-1" />
                              {timeRemaining}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5" />
                          <span className="text-sm opacity-90 capitalize">
                            {challenge.challenge_type}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold line-clamp-1">
                          {challenge.name}
                        </h3>
                      </div>

                      <CardContent className="p-4 space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {challenge.description}
                        </p>

                        {/* Prize Preview */}
                        <div className="flex flex-wrap gap-1">
                          {challenge.prize_tiers
                            ?.slice(0, 2)
                            .map((tier, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {tier.rank === 1 && (
                                  <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                                )}
                                {formatPrize(tier)}
                              </Badge>
                            ))}
                          {(challenge.prize_tiers?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{challenge.prize_tiers.length - 2} more
                            </Badge>
                          )}
                        </div>

                        {/* Time Remaining */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Ends {timeRemaining}</span>
                        </div>

                        {/* Action Button */}
                        <Button asChild className="w-full group">
                          <Link href={`/challenges/${challenge.id}`}>
                            Join Challenge
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="space-y-6">
            {myChallenges.length === 0 ? (
              <Card className="p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Active Challenges
                </h3>
                <p className="text-muted-foreground mb-4">
                  You haven't joined any challenges yet.
                </p>
                <Button onClick={() => setActiveTab("active")}>
                  Browse Challenges
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myChallenges.map((challenge) => {
                  const config = CHALLENGE_ICONS[challenge.challenge_type];
                  const Icon = config?.icon || Target;
                  const participant = challenge.user_participant;
                  const progress = participant?.current_score || 0;
                  const nextTier = challenge.prize_tiers?.find(
                    (t: any) => t.rank === (participant?.current_rank || 0) - 1,
                  );
                  const pointsToNext = nextTier
                    ? Number(nextTier?.prize_value) - progress
                    : 0;

                  return (
                    <Card
                      key={challenge.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <div
                        className={cn(
                          "h-24 bg-gradient-to-r p-4 text-white",
                          config?.color || "from-purple-500 to-pink-500",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <h3 className="font-semibold">{challenge.name}</h3>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-4">
                        {/* Your Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold text-purple-600">
                              {participant?.current_score || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Your Score
                            </p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold">
                              #{participant?.current_rank || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Your Rank
                            </p>
                          </div>
                        </div>

                        {/* Streak (if applicable) */}
                        {challenge.challenge_type === "streak" &&
                          participant?.current_streak! > 0 && (
                            <div className="flex items-center justify-center gap-1 text-orange-500">
                              <Flame className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {participant?.current_streak} day streak!
                              </span>
                            </div>
                          )}

                        {/* Points to Next Prize */}
                        {pointsToNext > 0 && (
                          <div className="p-2 rounded-lg bg-amber-500/10 text-center">
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Need {pointsToNext} more points to reach the next
                              prize tier!
                            </p>
                          </div>
                        )}

                        {/* Time Remaining */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Ends</span>
                          <span className="font-medium">
                            {getTimeRemaining(challenge.ends_at)}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button asChild variant="default" className="flex-1">
                            <Link href={`/challenges/${challenge.id}`}>
                              View Challenge
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="flex-1">
                            <Link
                              href={`/challenges/${challenge.id}/leaderboard`}
                            >
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Leaderboard
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
