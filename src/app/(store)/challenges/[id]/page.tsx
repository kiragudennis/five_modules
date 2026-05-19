// app/(store)/challenges/[challengeId]/page.tsx

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ChallengesService } from "@/lib/services/challenges-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Award,
  Star,
  Gift,
  Copy,
  Check,
  Loader2,
  Heart,
  Eye,
  Facebook,
  Twitter,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const CHALLENGE_ICONS: Record<string, any> = {
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

export default function ChallengeDetailPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<{
    rank: number;
    score: number;
    pointsToNext: number;
  } | null>(null);
  const [trackedCompetitor, setTrackedCompetitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [teamCode, setTeamCode] = useState("");
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [sharePlatform, setSharePlatform] = useState<
    "facebook" | "twitter" | "whatsapp"
  >("facebook");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [dailyLogin, setDailyLogin] = useState(false);

  const challengesService = new ChallengesService(supabase);

  const loadData = useCallback(async () => {
    if (!challengeId) return;

    try {
      // Fetch challenge details
      const { data: challengeData } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
      setChallenge(challengeData);

      // Fetch leaderboard
      const board = await challengesService.getLeaderboard(challengeId, 20);
      setLeaderboard(board);

      // If user is logged in, fetch their participation and rank
      if (profile?.id) {
        const { data: participantData } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("challenge_id", challengeId)
          .eq("user_id", profile.id)
          .maybeSingle();
        setParticipant(participantData);

        const rank = await challengesService.getUserRank(
          challengeId,
          profile.id,
        );
        setUserRank(rank);

        // Check if tracking someone
        const tracked = await challengesService.getTrackedCompetitor(
          challengeId,
          profile.id,
        );
        setTrackedCompetitor(tracked);

        // Get referral link for share challenge
        if (challengeData?.challenge_type === "share") {
          const { data: user } = await supabase
            .from("users")
            .select("referral_code")
            .eq("id", profile.id)
            .single();
          setReferralLink(
            `${window.location.origin}/signup?ref=${user?.referral_code || profile.id}`,
          );
        }
      }
    } catch (error) {
      console.error("Error loading challenge:", error);
    } finally {
      setLoading(false);
    }
  }, [challengeId, supabase, profile?.id, challengesService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates for leaderboard and participant
  useEffect(() => {
    if (!challengeId) return;

    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_participants",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [challengeId, supabase, loadData]);

  const handleJoinChallenge = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }

    setJoining(true);
    try {
      await challengesService.joinChallenge(challengeId, profile.id);
      toast.success("Successfully joined the challenge!");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    if (!profile) {
      router.push("/login");
      return;
    }

    setJoining(true);
    try {
      const team = await challengesService.createTeam(
        challengeId,
        profile.id,
        newTeamName,
      );
      toast.success(`Team "${team.team_name}" created!`);
      setShowTeamDialog(false);
      setNewTeamName("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      toast.error("Please enter a team code");
      return;
    }

    if (!profile) {
      router.push("/login");
      return;
    }

    setJoining(true);
    try {
      await challengesService.joinTeamByCode(teamCode, profile?.id);
      toast.success("Successfully joined the team!");
      setTeamCode("");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  };

  const handleTrackCompetitor = async (userId: string) => {
    if (!profile) return;

    try {
      await challengesService.trackCompetitor(challengeId, profile.id, userId);
      toast.success("Now tracking this competitor!");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDailyLogin = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }

    setDailyLogin(true);
    try {
      const result = await challengesService.recordAction(
        challengeId,
        profile.id,
        "daily_login",
        undefined,
        { date: new Date().toISOString() },
      );
      toast.success(`+${result.pointsAwarded} points for daily login!`);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDailyLogin(false);
    }
  };

  const handleSocialShare = async () => {
    if (!profile) return;

    const shareUrl = `${window.location.origin}/challenges/${challengeId}`;
    const shareText = `I'm participating in ${challenge?.name}! Join me and win amazing prizes!`;

    let shareLink = "";
    switch (sharePlatform) {
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

    try {
      const result = await challengesService.recordAction(
        challengeId,
        profile.id,
        "share_posted",
        undefined,
        { platform: sharePlatform, share_url: shareUrl },
      );
      toast.success(`+${result.pointsAwarded} points for sharing!`);
      setShowShareDialog(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive =
    challenge?.status === "active" &&
    new Date(challenge.starts_at) <= new Date() &&
    new Date(challenge.ends_at) >= new Date();

  const hasJoined = !!participant;
  const isTeamChallenge = challenge?.allow_teams;
  const config = challenge
    ? CHALLENGE_ICONS[challenge.challenge_type]
    : CHALLENGE_ICONS.purchase;
  const Icon = config?.icon || Target;
  const timeRemaining = challenge?.ends_at
    ? formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: true })
    : null;
  const isUrgent =
    challenge?.ends_at &&
    new Date(challenge.ends_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Challenge Not Found</h2>
        <p className="text-muted-foreground mb-4">
          This challenge doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/challenges")}>
          Browse Challenges
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div
        className={cn(
          "bg-gradient-to-r text-white py-12",
          config?.color || "from-purple-600 to-pink-600",
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5" />
                <Badge className="bg-white/20 text-white border-0">
                  {config?.label}
                </Badge>
                {isUrgent && (
                  <Badge className="bg-red-500 text-white border-0 animate-pulse">
                    <Clock className="h-3 w-3 mr-1" />
                    Ends {timeRemaining}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {challenge.name}
              </h1>
              <p className="opacity-90 mt-2 max-w-2xl">
                {challenge.description}
              </p>
            </div>

            {!hasJoined && isActive && (
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100"
                onClick={handleJoinChallenge}
                disabled={joining}
              >
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Target className="h-4 w-4 mr-2" />
                )}
                Join Challenge
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Stats Card */}
            {hasJoined && (
              <Card>
                <CardContent>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Your Progress
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-purple-600">
                        {participant?.current_score || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Points
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">
                        #{userRank?.rank || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Your Rank</p>
                    </div>
                    {challenge.challenge_type === "streak" && (
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-orange-500">
                          {participant?.current_streak || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Day Streak
                        </p>
                      </div>
                    )}
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">
                        {userRank?.pointsToNext || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Points to Next Rank
                      </p>
                    </div>
                  </div>

                  {/* Tracked Competitor */}
                  {trackedCompetitor && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        Tracking: {trackedCompetitor.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Need {trackedCompetitor.points_needed_to_overtake}{" "}
                        points to overtake!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {hasJoined && isActive && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Take Action</h3>

                  {challenge.challenge_type === "referral" && (
                    <div className="space-y-3">
                      <Button className="w-full" asChild>
                        <Link href="/account/referrals">
                          <Users className="h-4 w-4 mr-2" />
                          Refer a Friend
                        </Link>
                      </Button>
                    </div>
                  )}

                  {challenge.challenge_type === "purchase" && (
                    <Button className="w-full" asChild>
                      <Link href="/shop">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Shop Now
                      </Link>
                    </Button>
                  )}

                  {challenge.challenge_type === "share" && (
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        onClick={() => setShowShareDialog(true)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Challenge
                      </Button>
                      <div className="flex gap-2">
                        <Input
                          value={referralLink}
                          readOnly
                          className="flex-1"
                        />
                        <Button variant="outline" onClick={copyReferralLink}>
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {challenge.challenge_type === "streak" && (
                    <Button
                      className="w-full"
                      onClick={handleDailyLogin}
                      disabled={dailyLogin}
                    >
                      <Flame className="h-4 w-4 mr-2" />
                      {dailyLogin ? "Processing..." : "Daily Login"}
                    </Button>
                  )}

                  {challenge.challenge_type === "social" && (
                    <div className="space-y-3">
                      <Input
                        placeholder="Post your hashtag link"
                        onChange={(e) => {
                          if (e.target.value) {
                            if (!profile) {
                              router.push("/login");
                              return;
                            }

                            challengesService
                              .recordAction(
                                challengeId,
                                profile.id,
                                "social_hashtag",
                                undefined,
                                {
                                  hashtag:
                                    challenge.scoring_config?.target_hashtag,
                                  post_url: e.target.value,
                                },
                              )
                              .then(() => {
                                toast.success("Points awarded!");
                                loadData();
                              });
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Use hashtag:{" "}
                        {challenge.scoring_config?.target_hashtag ||
                          "#Challenge"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Team Section */}
            {isTeamChallenge && !hasJoined && isActive && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <UsersRound className="h-5 w-5" />
                    Join or Create a Team
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter team code"
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value)}
                      />
                      <Button onClick={handleJoinTeam} disabled={joining}>
                        Join Team
                      </Button>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">or</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowTeamDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard Preview */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Leaderboard
                  </h3>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/challenges/${challengeId}/leaderboard`}>
                      View All
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg",
                        entry.user_id === profile?.id && "bg-primary/10",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-center font-bold">
                          {idx === 0 && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                          {idx === 1 && (
                            <Award className="h-4 w-4 text-gray-400" />
                          )}
                          {idx === 2 && (
                            <Award className="h-4 w-4 text-amber-600" />
                          )}
                          {idx > 2 && `#${idx + 1}`}
                        </span>
                        <span className="text-sm truncate max-w-[120px]">
                          {entry.users?.full_name || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{entry.current_score}</span>
                        {entry.user_id === profile?.id && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Prize Tiers */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Prize Tiers
                </h3>
                <div className="space-y-3">
                  {challenge.prize_tiers?.map((tier: any) => (
                    <div
                      key={tier.rank}
                      className={cn(
                        "flex justify-between items-center p-2 rounded-lg",
                        userRank?.rank === tier.rank && "bg-yellow-500/10",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {tier.rank === 1 && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="font-medium">Rank {tier.rank}</span>
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
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span>Participation Prize</span>
                      <Badge variant="outline">
                        {challenge.participation_points} points
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Challenge Info */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Starts</span>
                  <span>{format(new Date(challenge.starts_at), "PPP")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ends</span>
                  <span className={isUrgent ? "text-red-500 font-medium" : ""}>
                    {format(new Date(challenge.ends_at), "PPP")}
                  </span>
                </div>
                {challenge.allow_teams && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Teams</span>
                    <span>Up to {challenge.max_team_size} members</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Track Competitor */}
            {hasJoined && leaderboard.length > 1 && profile?.id && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Track a Competitor</h3>
                  <select
                    className="w-full rounded-lg border p-2 text-sm"
                    onChange={(e) => handleTrackCompetitor(e.target.value)}
                    value=""
                  >
                    <option value="">Select a player to track</option>
                    {leaderboard
                      .filter((p) => p.user_id !== profile.id)
                      .slice(0, 10)
                      .map((p) => (
                        <option key={p.user_id} value={p.user_id}>
                          {p.users?.full_name || "Anonymous"} -{" "}
                          {p.current_score} pts
                        </option>
                      ))}
                  </select>
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
            <DialogTitle>Share Challenge</DialogTitle>
            <DialogDescription>
              Share this challenge and earn points!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSharePlatform("facebook");
                  handleSocialShare();
                }}
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSharePlatform("twitter");
                  handleSocialShare();
                }}
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSharePlatform("whatsapp");
                  handleSocialShare();
                }}
              >
                <div className="h-4 w-4 mr-2">📱</div>
                WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Team</DialogTitle>
            <DialogDescription>
              Give your team a name to start competing together
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Team Name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <Button
              onClick={handleCreateTeam}
              className="w-full"
              disabled={joining}
            >
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UsersRound className="h-4 w-4 mr-2" />
              )}
              Create Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
