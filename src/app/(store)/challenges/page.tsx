// app/(store)/challenges/page.tsx (REFACTORED)
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { ChallengesService } from "@/lib/services/challenges-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  ShoppingBag,
  Share2,
  Flame,
  UsersRound,
  Sparkles,
  Crown,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
  Heart,
  Brain,
  Gift,
  Zap,
  Star,
  Timer,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Challenge } from "@/types/challenges";
import lottieAnimation from "@/assets/lottie/challenges.json";
import { LottieIcon } from "@/components/ui/lottie-icon";

// ─── Constants ──────────────────────────────────────────
const CHALLENGE_ICONS: Record<
  string,
  { icon: any; color: string; bgLight: string; label: string }
> = {
  referral: {
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50 dark:bg-blue-950",
    label: "Referral",
  },
  purchase: {
    icon: ShoppingBag,
    color: "from-green-500 to-emerald-500",
    bgLight: "bg-green-50 dark:bg-green-950",
    label: "Purchase",
  },
  streak: {
    icon: Flame,
    color: "from-orange-500 to-red-500",
    bgLight: "bg-orange-50 dark:bg-orange-950",
    label: "Streak",
  },
  team: {
    icon: UsersRound,
    color: "from-indigo-500 to-purple-500",
    bgLight: "bg-indigo-50 dark:bg-indigo-950",
    label: "Team",
  },
  social: {
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-50 dark:bg-pink-950",
    label: "Social",
  },
  trivia: {
    icon: Brain,
    color: "from-yellow-500 to-orange-500",
    bgLight: "bg-yellow-50 dark:bg-yellow-950",
    label: "Trivia",
  },
  combo: {
    icon: Sparkles,
    color: "from-purple-500 to-violet-500",
    bgLight: "bg-purple-50 dark:bg-purple-950",
    label: "Combo",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

// ─── Helpers ────────────────────────────────────────────
const formatPrize = (tier: any) => {
  const map: Record<string, string> = {
    points: `${Number(tier.prize_value).toLocaleString()} pts`,
    discount: `${tier.prize_value}% off`,
    free_shipping: "Free Shipping",
    product: "Product",
    bundle: "Bundle",
    badge: tier.prize_value,
  };
  return map[tier.prize_type] || tier.prize_value;
};

const getTimeRemaining = (endsAt: string) => {
  const end = new Date(endsAt);
  if (end < new Date()) return "Ended";
  return formatDistanceToNow(end, { addSuffix: true });
};

// ─── Skeleton ───────────────────────────────────────────
function ChallengeSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 p-4">
        <Skeleton className="h-4 w-20 mb-2 bg-white/20" />
        <Skeleton className="h-6 w-48 bg-white/20" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function ChallengesPage() {
  const { supabase, profile } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [myParticipantMap, setMyParticipantMap] = useState<Record<string, any>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const challengesService = useMemo(
    () => new ChallengesService(supabase),
    [supabase],
  );

  // ─── Single optimized fetch ───────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      // Fetch active challenges
      const { data: active } = await supabase
        .from("challenges")
        .select(
          "id, name, slug, description, challenge_type, prize_tiers, starts_at, ends_at, status, cover_image_url, theme_color, allow_teams, max_team_size, participation_points",
        )
        .eq("status", "active")
        .lte("starts_at", now)
        .gte("ends_at", now)
        .order("ends_at", { ascending: true })
        .limit(50);

      setActiveChallenges(active || []);

      // If logged in, fetch participant data in one query
      if (profile?.id) {
        const { data: participations } = await supabase
          .from("challenge_participants")
          .select(
            "challenge_id, current_score, current_rank, current_streak, best_streak, metadata",
          )
          .eq("user_id", profile.id);

        if (participations?.length) {
          const map: Record<string, any> = {};
          const myChallengeIds = participations.map((p) => p.challenge_id);
          participations.forEach((p) => {
            map[p.challenge_id] = p;
          });
          setMyParticipantMap(map);

          // Fetch full challenge data for joined challenges
          const { data: joined } = await supabase
            .from("challenges")
            .select(
              "id, name, slug, description, challenge_type, prize_tiers, starts_at, ends_at, status, allow_teams",
            )
            .in("id", myChallengeIds)
            .order("ends_at", { ascending: true })
            .limit(50);

          setMyChallenges(joined || []);
        }
      }
    } catch (err) {
      console.error("Error fetching challenges:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, profile?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Single real-time subscription ────────────────────
  useEffect(() => {
    if (!profile?.id) return;

    const ch = supabase
      .channel("challenges-browse")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges" },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_participants",
          filter: `user_id=eq.${profile.id}`,
        },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      ch.unsubscribe();
    };
  }, [supabase, profile?.id, fetchData]);

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-[url('/images/challenge-banner.jpg')] opacity-40" />
        <div className="container mx-auto px-2 py-4 sm:py-16 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center sm:mb-6 w-full">
              <LottieIcon
                animation={lottieAnimation}
                isCategory={false}
                className="mx-auto mb-4 w-32 h-32"
              />
            </div>

            <h1 className="text-xl md:text-5xl font-bold mb-3 tracking-tight">
              Challenges & Competitions
            </h1>
            <p className="text-lg text-white/80 max-w-xl mx-auto">
              Compete, earn points, and win amazing prizes. Join a challenge and
              climb the leaderboard!
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 rounded-full p-1 bg-muted">
            <TabsTrigger
              value="active"
              className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              Active
            </TabsTrigger>
            {profile && (
              <TabsTrigger
                value="my"
                className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Star className="h-4 w-4 mr-2" />
                My Challenges
              </TabsTrigger>
            )}
          </TabsList>

          {/* Active Tab */}
          <TabsContent value="active">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <ChallengeSkeleton key={i} />
                ))}
              </div>
            ) : activeChallenges.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No Active Challenges"
                description="Check back soon for new challenges!"
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {activeChallenges.map((challenge) => (
                  <motion.div key={challenge.id} variants={cardVariants} layout>
                    <ChallengeCard
                      challenge={challenge}
                      isJoined={!!myParticipantMap[challenge.id]}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* My Challenges Tab */}
          {profile && (
            <TabsContent value="my">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <ChallengeSkeleton key={i} />
                  ))}
                </div>
              ) : myChallenges.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="No Joined Challenges"
                  description="Browse active challenges and join one!"
                >
                  <Button
                    onClick={() => setActiveTab("active")}
                    className="mt-4"
                  >
                    Browse Challenges
                  </Button>
                </EmptyState>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {myChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      variants={cardVariants}
                      layout
                    >
                      <MyChallengeCard
                        challenge={challenge}
                        participant={myParticipantMap[challenge.id]}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        {description}
      </p>
      {children}
    </motion.div>
  );
}

function ChallengeCard({
  challenge,
  isJoined,
}: {
  challenge: any;
  isJoined: boolean;
}) {
  const config =
    CHALLENGE_ICONS[challenge.challenge_type] || CHALLENGE_ICONS.combo;
  const Icon = config.icon;
  const timeRemaining = getTimeRemaining(challenge.ends_at);
  const isUrgent = new Date(challenge.ends_at).getTime() - Date.now() < 864e5;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-shadow duration-300 border-0 shadow-md">
      {/* Gradient Header */}
      <div
        className={cn(
          "relative h-36 bg-gradient-to-br p-5 text-white",
          config.color,
        )}
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">
              <Icon className="h-4 w-4" />
              <span className="capitalize font-medium">{config.label}</span>
            </div>
            <div className="flex gap-1.5">
              {isUrgent && (
                <Badge className="bg-red-500/90 text-white border-0 animate-pulse backdrop-blur-sm">
                  <Timer className="h-3 w-3 mr-1" />
                  {timeRemaining}
                </Badge>
              )}
              {isJoined && (
                <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Joined
                </Badge>
              )}
            </div>
          </div>
          <h3 className="text-xl font-bold leading-tight line-clamp-2">
            {challenge.name}
          </h3>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {challenge.description}
        </p>

        {/* Prize Pills */}
        <div className="flex flex-wrap gap-1.5">
          {challenge.prize_tiers?.slice(0, 3).map((tier: any, idx: number) => (
            <Badge
              key={idx}
              variant="secondary"
              className="text-xs font-normal gap-1"
            >
              {tier.rank === 1 && <Crown className="h-3 w-3 text-yellow-500" />}
              {tier.rank === 2 && (
                <MedalIcon className="h-3 w-3 text-gray-400" />
              )}
              {tier.rank === 3 && (
                <MedalIcon className="h-3 w-3 text-amber-600" />
              )}
              {formatPrize(tier)}
            </Badge>
          ))}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Ends {timeRemaining}</span>
          {challenge.allow_teams && (
            <>
              <span className="mx-1">•</span>
              <UsersRound className="h-3.5 w-3.5" />
              <span>Teams up to {challenge.max_team_size}</span>
            </>
          )}
        </div>

        <Button
          asChild
          className="w-full gap-2 group/btn"
          variant={isJoined ? "outline" : "default"}
        >
          <Link href={`/challenges/${challenge.id}`}>
            {isJoined ? "View Progress" : "Join Challenge"}
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MyChallengeCard({
  challenge,
  participant,
}: {
  challenge: any;
  participant?: any;
}) {
  const config =
    CHALLENGE_ICONS[challenge.challenge_type] || CHALLENGE_ICONS.combo;
  const Icon = config.icon;
  const score = participant?.current_score || 0;
  const rank = participant?.current_rank || 0;
  const streak = participant?.current_streak || 0;

  // Find next prize tier
  const sortedTiers = [...(challenge.prize_tiers || [])].sort(
    (a: any, b: any) => b.rank - a.rank,
  );
  const nextTier = sortedTiers.find((t: any) => t.rank < rank);
  const pointsToNext = nextTier
    ? Math.max(0, Number(nextTier.prize_value) - score)
    : 0;
  const progressPercent = nextTier
    ? Math.min(100, (score / Number(nextTier.prize_value)) * 100)
    : 100;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
      <div
        className={cn(
          "h-20 bg-gradient-to-r p-4 text-white flex items-center gap-3",
          config.color,
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg leading-tight">{challenge.name}</h3>
          <p className="text-xs text-white/70">{config.label}</p>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Score & Rank */}
        <div className="grid grid-cols-3 gap-3">
          <div className={cn("text-center p-3 rounded-xl", config.bgLight)}>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {score.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold">#{rank || "?"}</p>
            <p className="text-xs text-muted-foreground">Rank</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold">
              {getTimeRemaining(challenge.ends_at).includes("day")
                ? getTimeRemaining(challenge.ends_at).split(" ")[0]
                : "<1"}
            </p>
            <p className="text-xs text-muted-foreground">Days Left</p>
          </div>
        </div>

        {/* Progress to next prize */}
        {pointsToNext > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">To next prize</span>
              <span className="font-medium text-amber-600">
                {pointsToNext.toLocaleString()} pts needed
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Streak */}
        {challenge.challenge_type === "streak" && streak > 0 && (
          <div className="flex items-center justify-center gap-2 text-orange-500 bg-orange-50 dark:bg-orange-950 rounded-lg py-2">
            <Flame className="h-5 w-5" />
            <span className="font-bold">{streak} day streak!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild className="flex-1 gap-1">
            <Link href={`/challenges/${challenge.id}`}>View</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 gap-1">
            <Link href={`/challenges/${challenge.id}/leaderboard`}>
              <TrendingUp className="h-4 w-4" />
              Leaderboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Tiny medal icon component
function MedalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="6" opacity="0.3" />
      <path d="M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
      <path d="M9 16l-2 6h10l-2-6H9z" opacity="0.5" />
    </svg>
  );
}

// Missing import
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
