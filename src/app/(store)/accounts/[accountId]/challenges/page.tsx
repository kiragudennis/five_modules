// app/(store)/accounts/[accountId]/challenges/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ChallengesService } from "@/lib/services/challenges-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Target,
  Users,
  Flame,
  TrendingUp,
  Share2,
  Gift,
  Coins,
  Eye,
  Crown,
  Medal,
  Zap,
  Clock,
  Loader2,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Challenge, ChallengeParticipant } from "@/types/challenges";

const CHALLENGE_ICONS: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  referral: {
    icon: Share2,
    color: "from-blue-500 to-cyan-500",
    label: "Referral",
  },
  purchase: {
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    label: "Purchase",
  },
  share: {
    icon: Share2,
    color: "from-purple-500 to-pink-500",
    label: "Social Share",
  },
  streak: {
    icon: Flame,
    color: "from-orange-500 to-red-500",
    label: "Daily Streak",
  },
  team: { icon: Users, color: "from-indigo-500 to-purple-500", label: "Team" },
  combo: { icon: Zap, color: "from-yellow-500 to-orange-500", label: "Combo" },
  social: { icon: Share2, color: "from-pink-500 to-rose-500", label: "Social" },
};

export default function UserChallengesPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<
    { challenge: Challenge; participant: ChallengeParticipant }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const challengesService = new ChallengesService(supabase);

  // Verify ownership
  useEffect(() => {
    if (!profile) {
      router.push("/login");
      return;
    }
    if (profile.id !== accountId) {
      router.push(`/accounts/${profile.id}/challenges`);
    }
  }, [profile, accountId, router]);

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const [available, joined] = await Promise.all([
        challengesService.getActiveChallenges(profile.id),
        challengesService.getUserChallenges(profile.id),
      ]);

      setActiveChallenges(available);
      setMyChallenges(joined as any);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, [profile?.id, challengesService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoinChallenge = async (challengeId: string) => {
    if (!profile) return;

    setJoiningId(challengeId);
    try {
      await challengesService.joinChallenge(challengeId, profile.id);
      toast.success("Successfully joined challenge!");
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setJoiningId(null);
    }
  };

  const getChallengeIcon = (type: string) => {
    const config = CHALLENGE_ICONS[type] || CHALLENGE_ICONS.purchase;
    const Icon = config.icon;
    return <Icon className="h-5 w-5" />;
  };

  const getTimeRemaining = (endsAt: string) => {
    return formatDistanceToNow(new Date(endsAt), { addSuffix: true });
  };

  const getProgressPercentage = (
    participant: ChallengeParticipant,
    challenge: Challenge,
  ) => {
    // Get target from top prize tier or use default
    const topPrize = challenge.prize_tiers?.find((t) => t.rank === 1);
    const target =
      typeof topPrize?.prize_value === "number" ? topPrize.prize_value : 5000;
    return Math.min(100, (participant.current_score / target) * 100);
  };

  const formatPrizePreview = (prizeTiers: any[]) => {
    if (!prizeTiers || prizeTiers.length === 0) return null;

    const topThree = prizeTiers.slice(0, 3);
    return (
      <div className="flex gap-2">
        {topThree.map((tier, idx) => (
          <Badge key={idx} variant="outline" className="gap-1">
            {tier.rank === 1 && <Crown className="h-3 w-3 text-yellow-500" />}
            {tier.rank === 2 && <Medal className="h-3 w-3 text-gray-400" />}
            {tier.rank === 3 && <Medal className="h-3 w-3 text-amber-600" />}
            {tier.prize_type === "points" && `${tier.prize_value} pts`}
            {tier.prize_type === "discount" && `${tier.prize_value}% off`}
            {tier.prize_type === "badge" && tier.prize_value}
          </Badge>
        ))}
        {prizeTiers.length > 3 && (
          <Badge variant="outline">+{prizeTiers.length - 3} more</Badge>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Compete, earn points, and win amazing prizes
          </p>
        </div>

        <Tabs defaultValue="my" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my">My Challenges</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
          </TabsList>

          {/* My Challenges Tab */}
          <TabsContent value="my" className="space-y-4">
            {myChallenges.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Challenges Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't joined any challenges. Check out available ones!
                  </p>
                  <Button
                    onClick={() =>
                      document
                        .querySelector('[value="available"]')
                        ?.dispatchEvent(new Event("click"))
                    }
                  >
                    Browse Challenges
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myChallenges.map(({ challenge, participant }) => {
                const config = CHALLENGE_ICONS[challenge.challenge_type];
                const progress = getProgressPercentage(participant, challenge);
                const timeRemaining = getTimeRemaining(challenge.ends_at);
                const isUrgent =
                  new Date(challenge.ends_at).getTime() - Date.now() <
                  24 * 60 * 60 * 1000;

                return (
                  <Card
                    key={challenge.id}
                    className="group hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => router.push(`/challenges/${challenge.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={cn(
                                "p-1.5 rounded-lg bg-gradient-to-r",
                                config?.color,
                              )}
                            >
                              {getChallengeIcon(challenge.challenge_type)}
                            </div>
                            <h3 className="font-semibold text-lg">
                              {challenge.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className="capitalize text-xs"
                            >
                              {config?.label || challenge.challenge_type}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {challenge.description}
                          </p>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="font-semibold">
                                #{participant.current_rank || "—"}
                              </span>
                              <span className="text-muted-foreground">
                                rank
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-green-500" />
                              <span className="font-semibold">
                                {participant.current_score}
                              </span>
                              <span className="text-muted-foreground">
                                points
                              </span>
                            </div>
                            {challenge.challenge_type === "streak" &&
                              participant.current_streak > 0 && (
                                <div className="flex items-center gap-1">
                                  <Flame className="h-4 w-4 text-orange-500" />
                                  <span className="font-semibold">
                                    {participant.current_streak}
                                  </span>
                                  <span className="text-muted-foreground">
                                    day streak
                                  </span>
                                </div>
                              )}
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                isUrgent && "text-red-500",
                              )}
                            >
                              <Clock className="h-4 w-4" />
                              <span>{timeRemaining}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Progress to Top Prize
                              </span>
                              <span className="font-medium">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>

                        {/* Prize Preview */}
                        <div className="text-right">
                          {formatPrizePreview(challenge.prize_tiers)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 group-hover:bg-transparent"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Available Challenges Tab */}
          <TabsContent value="available" className="space-y-4">
            {activeChallenges.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Active Challenges
                  </h3>
                  <p className="text-muted-foreground">
                    Check back soon for new challenges!
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeChallenges.map((challenge) => {
                const config = CHALLENGE_ICONS[challenge.challenge_type];
                const timeRemaining = getTimeRemaining(challenge.ends_at);
                const isUrgent =
                  new Date(challenge.ends_at).getTime() - Date.now() <
                  24 * 60 * 60 * 1000;

                return (
                  <Card
                    key={challenge.id}
                    className="hover:shadow-lg transition-all border-2 border-dashed border-primary/30"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={cn(
                                "p-1.5 rounded-lg bg-gradient-to-r",
                                config?.color,
                              )}
                            >
                              {getChallengeIcon(challenge.challenge_type)}
                            </div>
                            <h3 className="font-semibold text-lg">
                              {challenge.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className="capitalize text-xs"
                            >
                              {config?.label || challenge.challenge_type}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {challenge.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Ends {timeRemaining}</span>
                            </div>
                            {challenge.participation_points > 0 && (
                              <div className="flex items-center gap-1">
                                <Gift className="h-4 w-4 text-purple-500" />
                                <span>
                                  {challenge.participation_points} participation
                                  points
                                </span>
                              </div>
                            )}
                          </div>

                          {formatPrizePreview(challenge.prize_tiers)}
                        </div>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinChallenge(challenge.id);
                          }}
                          disabled={joiningId === challenge.id}
                        >
                          {joiningId === challenge.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Target className="h-4 w-4 mr-2" />
                          )}
                          Join Challenge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
