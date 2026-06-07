// app/(store)/challenges/[challengeId]/page.tsx (REFACTORED)
// Challenge Detail Page - View challenge details, join, track progress, and interact with the challenge.
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { ChallengesService } from "@/lib/services/challenges-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Instagram,
  Music,
  Globe,
  Youtube,
  Send,
  ArrowRight,
  Search,
  MessageCircle,
  UserCheck,
  Brain,
  Zap,
  Ticket,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { TriviaScore } from "@/types/challenges";

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
  trivia: {
    icon: Brain,
    color: "from-yellow-500 to-orange-500",
    label: "Trivia Challenge",
  },
};

const getSocialIcon = (platform: string) => {
  const icons: Record<string, any> = {
    twitter: Twitter,
    x: Twitter,
    facebook: Facebook,
    linkedin: Globe,
    whatsapp: MessageCircle,
    reddit: Globe,
    instagram: Instagram,
    youtube: Youtube,
    tiktok: Music,
  };
  return icons[platform] || Globe;
};

// ─── Component ──────────────────────────────────────────
export default function ChallengeDetailPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();

  // ─── Core State ───────────────────────────────────────
  const [challenge, setChallenge] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<{
    rank: number;
    score: number;
    pointsToNext: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  // Score and queue
  const [myScore, setMyScore] = useState<TriviaScore | null>(null);

  // ─── Type-Specific Data (single object) ───────────────
  const [typeData, setTypeData] = useState<Record<string, any>>({});

  // ─── UI State ─────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // ─── Social submission form state ─────────────────────
  const [socialForm, setSocialForm] = useState({
    postUrl: "",
    caption: "",
    screenshot: "",
    platform: "facebook",
  });
  const [submittingSocial, setSubmittingSocial] = useState(false);

  const challengesService = new ChallengesService(supabase);

  // ─── Data Loaders ─────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!challengeId) return;
    setLoading(true);

    try {
      const { data: ch, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

      if (error) {
        console.error("Error fetching challenge:", error);
        return;
      }

      setChallenge(ch);

      if (ch.challenge_type === "trivia") {
        const { data } = await supabase.rpc("get_trivia_leaderboard", {
          p_challenge_id: challengeId,
          p_limit: 20,
        });
        console.log("Trivia leaderboard data:", data);
        setLeaderboard(data || []);
      } else {
        const board = await challengesService.getLeaderboard(challengeId, 20);
        // Normalize the data structure
        const normalizedBoard = (board || []).map((entry: any) => ({
          ...entry,
          user_id: entry.user_id,
          full_name: entry.users?.full_name || entry.full_name || "Anonymous",
          total_score: entry.current_score || 0,
        }));
        console.log("Regular leaderboard data:", normalizedBoard);
        setLeaderboard(normalizedBoard);
      }

      if (profile?.id) {
        const { data: part } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("challenge_id", challengeId)
          .eq("user_id", profile.id)
          .maybeSingle();
        setParticipant(part);

        const rank = await challengesService.getUserRank(
          challengeId,
          profile.id,
        );
        setUserRank(rank);

        // Since user can only see thier own participant record, we need to fetch their score separately for trivia challenges
        if (ch.challenge_type === "trivia" && part) {
          const { data } = await supabase
            .from("challenge_trivia_scores")
            .select("*")
            .eq("challenge_id", challengeId)
            .eq("user_id", profile.id)
            .maybeSingle();
          if (data) setMyScore(data);
        }

        if (ch?.challenge_type === "share") {
          const { data: user } = await supabase
            .from("users")
            .select("referral_code")
            .eq("id", profile.id)
            .single();
          setTypeData((prev) => ({
            ...prev,
            referralLink: `${window.location.origin}/signup?ref=${user?.referral_code || profile.id}`,
          }));
        }
      }
    } catch (err) {
      console.error("Error loading challenge:", err);
    } finally {
      setLoading(false);
    }
  }, [challengeId, supabase, profile?.id]);

  // ─── Type-Specific Loaders ────────────────────────────
  const loadTypeData = useCallback(
    async (type: string) => {
      if (!challengeId || !profile?.id) return;
      const d: Record<string, any> = {};

      if (type === "referral") {
        const [{ data: stats }, { data: lb }, { data: user }] =
          await Promise.all([
            supabase.rpc("get_user_referral_challenge_stats", {
              p_challenge_id: challengeId,
              p_user_id: profile.id,
            }),
            supabase.rpc("get_referral_challenge_leaderboard", {
              p_challenge_id: challengeId,
              p_limit: 20,
            }),
            supabase
              .from("users")
              .select("referral_code")
              .eq("id", profile.id)
              .single(),
          ]);
        d.referralStats = stats?.[0] || null;
        d.referralLeaderboard = lb || [];
        d.referralLink = `${window.location.origin}/signup?ref=${user?.referral_code || profile.id}`;
      }

      if (type === "purchase") {
        const productId = challenge?.scoring_config?.product_id;
        const [{ data: prod }, { data: lb }] = await Promise.all([
          productId
            ? supabase
                .from("products")
                .select("id, name, price, image_url, category")
                .eq("id", productId)
                .single()
            : Promise.resolve({ data: null }),
          supabase.rpc("get_purchase_challenge_leaderboard", {
            p_challenge_id: challengeId,
            p_limit: 10,
          }),
        ]);
        d.targetProduct = prod;
        d.purchaseLeaderboard = lb || [];
      }

      if (type === "team" && participant?.team_id) {
        const [{ data: spending }, { data: allTeams }, { count: memberCount }] =
          await Promise.all([
            supabase
              .from("challenge_team_spending")
              .select("amount_spent")
              .eq("team_id", participant.team_id),
            supabase
              .from("challenge_teams")
              .select("id, total_team_spending")
              .eq("challenge_id", challengeId)
              .order("total_team_spending", { ascending: false }),
            supabase
              .from("challenge_participants")
              .select("*", { count: "exact" })
              .eq("team_id", participant.team_id),
          ]);
        d.teamStats = {
          total_spending:
            spending?.reduce((s, r) => s + r.amount_spent, 0) || 0,
          member_count: memberCount || 0,
          rank:
            (allTeams?.findIndex((t) => t.id === participant.team_id) ?? -1) +
            1,
        };
      }

      if (type === "social") {
        const { data: subs } = await supabase
          .from("challenge_social_submissions")
          .select("*")
          .eq("challenge_id", challengeId)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });
        d.socialSubmissions = subs || [];
      }

      setTypeData((prev) => ({ ...prev, ...d }));
    },
    [challengeId, supabase, profile?.id, challenge, participant],
  );

  // ─── Initial Load & Real-time ─────────────────────────
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (challenge?.challenge_type && profile?.id)
      loadTypeData(challenge.challenge_type);
  }, [
    challenge?.challenge_type,
    participant?.team_id,
    profile?.id,
    loadTypeData,
  ]);

  // Single real-time channel
  useEffect(() => {
    if (!challengeId) return;
    const ch = supabase
      .channel(`challenge-detail-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_participants",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => loadData(),
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [challengeId, supabase, loadData]);

  // ─── Actions ──────────────────────────────────────────
  const handleJoinChallenge = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }
    setJoining(true);
    try {
      await challengesService.joinChallenge(challengeId, profile.id);
      toast.success("Joined!");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };

  const handleSocialSubmission = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }
    if (!socialForm.postUrl.trim()) {
      toast.error("Post URL required");
      return;
    }
    setSubmittingSocial(true);
    try {
      await supabase.from("challenge_social_submissions").insert({
        challenge_id: challengeId,
        user_id: profile.id,
        post_url: socialForm.postUrl,
        platform: socialForm.platform,
        hashtag: challenge?.scoring_config?.target_hashtag || "Challenge",
        caption: socialForm.caption,
        screenshot_url: socialForm.screenshot,
        status: "pending",
      });
      toast.success("Submitted for review!");
      setSocialForm({
        postUrl: "",
        caption: "",
        screenshot: "",
        platform: "facebook",
      });
      loadTypeData("social");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingSocial(false);
    }
  };

  const shareReferral = (platform: string) => {
    const link = typeData.referralLink || "";
    const text = `Join me on ${window.location.hostname}! Use my referral link: `;
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`,
    };
    window.open(urls[platform] || link, "_blank");
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(typeData.referralLink || "");
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Derived Values ───────────────────────────────────
  const isActive =
    challenge?.status === "active" &&
    new Date(challenge.starts_at) <= new Date() &&
    new Date(challenge.ends_at) >= new Date();
  const hasJoined = !!participant;
  const config = challenge
    ? CHALLENGE_ICONS[challenge.challenge_type] || CHALLENGE_ICONS.purchase
    : CHALLENGE_ICONS.purchase;
  const Icon = config.icon;
  const timeRemaining = challenge?.ends_at
    ? formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: true })
    : null;
  const isUrgent =
    challenge?.ends_at &&
    new Date(challenge.ends_at).getTime() - Date.now() < 864e5;
  const td = typeData; // shorthand

  // ─── Loading / Not Found ──────────────────────────────
  if (loading) {
    console.log("Loading challenge details for ID:", challengeId);
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    console.error("Challenge not found for ID:", challengeId);

    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Challenge Not Found</h2>
        <Button onClick={() => router.push("/challenges")}>
          Browse Challenges
        </Button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero */}
      <div className={cn("bg-gradient-to-r text-white py-12", config.color)}>
        <div className="container mx-auto px-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-5 w-5" />
              <Badge className="bg-white/20 text-white border-0">
                {config.label}
              </Badge>
              {isUrgent && (
                <Badge className="bg-red-500 text-white border-0 animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Ends {timeRemaining}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{challenge.name}</h1>
            <p className="opacity-90 mt-2 max-w-2xl">{challenge.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live broadcast button */}
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100"
              asChild
            >
              <Link href={`/challenges/live/${challengeId}`}>
                <Video className="h-4 w-4 mr-2" />
                Watch Live
              </Link>
            </Button>
            {/* Join/Spin Button - Different for trivia */}
            {!hasJoined && isActive && (
              <div className="flex items-center gap-3">
                {challenge.challenge_type === "trivia" &&
                challenge.scoring_config?.spin_game_id ? (
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    asChild
                  >
                    <Link
                      href={`/spin/${challenge.scoring_config.spin_game_id}`}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Spin to Join
                    </Link>
                  </Button>
                ) : (
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
            )}
            {/* Show ticket info if already joined */}
            {hasJoined &&
              challenge.challenge_type === "trivia" &&
              participant?.ticket_number && (
                <div className="flex items-center gap-3">
                  <Badge className="bg-white/20 text-white border-0 text-lg py-2 px-4">
                    <Ticket className="h-4 w-4 mr-2" />
                    Ticket #{participant.ticket_number}
                  </Badge>
                  <Button
                    size="lg"
                    className="bg-white/10 text-white hover:bg-white/20 border border-white/30"
                    asChild
                  >
                    <Link href={`/challenges/${challengeId}/trivia`}>
                      <Brain className="h-4 w-4 mr-2" />
                      Go to Trivia
                    </Link>
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            {hasJoined && (
              <Card>
                <CardContent>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Your Progress
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    <StatBox
                      label="Total Points"
                      value={participant?.current_score || 0}
                      color="text-purple-600"
                    />
                    <StatBox
                      label="Your Rank"
                      value={`#${userRank?.rank || 0}`}
                    />
                    {challenge.challenge_type === "streak" && (
                      <StatBox
                        label="Day Streak"
                        value={participant?.current_streak || 0}
                        color="text-orange-500"
                      />
                    )}
                    <StatBox
                      label="To Next Rank"
                      value={userRank?.pointsToNext || 0}
                    />

                    {/* Type-specific stats */}
                    {challenge.challenge_type === "purchase" && (
                      <StatBox
                        label="Units Purchased"
                        value={
                          participant?.metadata?.total_units_purchased || 0
                        }
                        color="text-green-600"
                      />
                    )}
                    {challenge.challenge_type === "referral" && (
                      <StatBox
                        label="Total Referrals"
                        value={td.referralStats?.total_referrals || 0}
                        color="text-blue-600"
                      />
                    )}
                    {challenge.challenge_type === "referral" && (
                      <StatBox
                        label="Signups"
                        value={td.referralStats?.signup_referrals || 0}
                        color="text-green-600"
                      />
                    )}
                    {challenge.challenge_type === "referral" && (
                      <StatBox
                        label="Purchases"
                        value={td.referralStats?.purchase_referrals || 0}
                        color="text-purple-600"
                      />
                    )}
                    {challenge.challenge_type === "streak" && (
                      <StatBox
                        label="Best Streak"
                        value={participant?.best_streak || 0}
                        color="text-purple-500"
                      />
                    )}
                  </div>

                  {/* Referral Progress */}
                  {challenge.challenge_type === "referral" &&
                    td.referralStats && (
                      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            Referral Progress
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {td.referralStats.pending_referrals || 0} pending
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <ProgressRow
                            label="Signup Conversions"
                            done={td.referralStats.signup_referrals || 0}
                            total={td.referralStats.total_referrals || 1}
                          />
                          <ProgressRow
                            label="Purchase Conversions"
                            done={td.referralStats.purchase_referrals || 0}
                            total={td.referralStats.total_referrals || 1}
                            className="bg-purple-200"
                          />
                        </div>
                        {td.referralStats.conversion_rate > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Conversion rate: {td.referralStats.conversion_rate}%
                          </p>
                        )}
                      </div>
                    )}

                  {/* Streak Calendar */}
                  {challenge.challenge_type === "streak" && (
                    <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          <Flame className="h-4 w-4 text-orange-500 inline mr-1" />
                          Streak Progress
                        </p>
                        {challenge.require_active_status && (
                          <Badge variant="outline" className="text-xs">
                            Active Only
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {Array.from({
                          length: challenge.scoring_config?.days_required || 7,
                        }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex-1 h-8 rounded",
                              i < (participant?.current_streak || 0)
                                ? "bg-gradient-to-b from-orange-500 to-red-500"
                                : "bg-gray-200 dark:bg-gray-700",
                            )}
                            title={`Day ${i + 1}`}
                          />
                        ))}
                      </div>
                      {challenge.scoring_config?.bonus_milestones &&
                        Object.keys(challenge.scoring_config.bonus_milestones)
                          .length > 0 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(
                              challenge.scoring_config.bonus_milestones,
                            ).map(([day, bonus]) => (
                              <div
                                key={day}
                                className="flex items-center gap-2 text-xs"
                              >
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-muted-foreground">
                                  Day {day}: +{bonus as number} bonus
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Team Stats */}
                  {challenge.allow_teams &&
                    participant?.team_id &&
                    td.teamStats && (
                      <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            <UsersRound className="h-4 w-4 text-purple-500 inline mr-1" />
                            Team Stats
                          </p>
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/challenges/${challengeId}/teams/manage`}
                            >
                              View Team
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <MiniStat
                            label="Team KSH"
                            value={
                              td.teamStats.total_spending?.toLocaleString() || 0
                            }
                            color="text-purple-600"
                          />
                          <MiniStat
                            label="Members"
                            value={`${td.teamStats.member_count}/${challenge.max_team_size}`}
                          />
                          <MiniStat
                            label="Rank"
                            value={`#${td.teamStats.rank || "?"}`}
                            color="text-yellow-600"
                          />
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Actions Card */}
            {isActive && (
              <Card className="overflow-hidden border-2 border-transparent hover:border-purple-500/20 transition-all duration-300">
                <CardContent>
                  <h3 className="font-semibold mb-6 flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-purple-500" />
                    Take Action
                  </h3>

                  {/* TRIVIA - Always show if active */}
                  {challenge.challenge_type === "trivia" && (
                    <div className="space-y-5">
                      {/* How It Works - Collapsible/Always visible */}
                      <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                          <Brain className="h-5 w-5" />
                          How Trivia Works
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              icon: Ticket,
                              text: "Spin & Win a Ticket",
                              color: "text-blue-500",
                            },
                            {
                              icon: Users,
                              text: "Join the Queue",
                              color: "text-green-500",
                            },
                            {
                              icon: Brain,
                              text: "Answer Questions",
                              color: "text-purple-500",
                            },
                            {
                              icon: Trophy,
                              text: "Win Prizes!",
                              color: "text-yellow-500",
                            },
                          ].map((step, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                            >
                              <step.icon
                                className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  step.color,
                                )}
                              />
                              <span className="text-sm text-muted-foreground">
                                {step.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* State: Not joined - Show Spin button */}
                      {!hasJoined && (
                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Zap className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-purple-700 dark:text-purple-400">
                                  Ready to test your knowledge?
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Spin the wheel for a chance to win a trivia
                                  ticket and compete for amazing prizes!
                                </p>
                              </div>
                            </div>
                          </div>

                          {challenge.scoring_config?.spin_game_id ? (
                            <Button
                              size="lg"
                              className="w-full h-14 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02]"
                              asChild
                            >
                              <Link
                                href={`/spin/${challenge.scoring_config.spin_game_id}`}
                              >
                                <Zap className="h-5 w-5 mr-2 animate-pulse" />
                                Spin to Win a Ticket
                                <ArrowRight className="h-5 w-5 ml-2" />
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              size="lg"
                              className="w-full h-14 text-lg"
                              onClick={handleJoinChallenge}
                              disabled={joining}
                            >
                              {joining ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              ) : (
                                <Ticket className="h-5 w-5 mr-2" />
                              )}
                              Join Trivia Queue
                            </Button>
                          )}
                        </div>
                      )}

                      {/* State: Joined with ticket */}
                      {hasJoined && (
                        <div className="space-y-4">
                          {/* Ticket Card */}
                          <div className="relative overflow-hidden rounded-xl p-[2px]">
                            <div className="relative rounded-[10px] p-5">
                              {/* Decorative elements */}
                              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                              <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Your Trivia Ticket
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Ticket className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                      <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                        #{participant.ticket_number}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">
                                      Queue Position
                                    </p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                      #
                                      {participant.queue_position ||
                                        participant.ticket_number}
                                    </p>
                                  </div>
                                </div>

                                {/* Score display if they have points */}
                                {participant.current_score > 0 && (
                                  <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10">
                                    <Trophy className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm text-muted-foreground">
                                      Current Score:
                                    </span>
                                    <span className="font-bold text-yellow-600">
                                      {participant.current_score} pts
                                    </span>
                                  </div>
                                )}

                                {/* Status indicator */}
                                <div className="flex items-center gap-2 mt-3">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    Active & Ready
                                  </span>
                                </div>
                              </div>

                              {/* Perforated edge effect */}
                              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-1">
                                <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-900 -translate-x-1/2" />
                                <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-900 translate-x-1/2" />
                              </div>
                            </div>
                          </div>

                          {/* Quick Stats */}
                          {myScore && (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                                <p className="text-lg font-bold text-green-600">
                                  {myScore.correct_answers}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Correct
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                                <p className="text-lg font-bold text-blue-600">
                                  {myScore.accuracy}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Accuracy
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                                <p className="text-lg font-bold text-purple-600">
                                  {myScore.current_streak}🔥
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Streak
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Go to Trivia Button */}
                          <Button
                            size="lg"
                            className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02]"
                            asChild
                          >
                            <Link href={`/challenges/${challengeId}/trivia`}>
                              <Brain className="h-5 w-5 mr-2" />
                              Enter Trivia Arena
                              <ArrowRight className="h-5 w-5 ml-2" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Only show these sections if user has joined */}
                  {hasJoined && challenge.challenge_type !== "trivia" && (
                    <>
                      {challenge.challenge_type === "referral" && (
                        <div className="space-y-4">
                          <InfoBox
                            icon={Users}
                            color="text-blue-500"
                            title="How to Earn"
                          >
                            <li>Share your referral link with friends</li>
                            <li>
                              {challenge.scoring_config?.referral_type ===
                              "signup"
                                ? "Points when they become active"
                                : challenge.scoring_config?.referral_type ===
                                    "first_purchase"
                                  ? "Points on first purchase"
                                  : "Points for signups & purchases"}
                            </li>
                            <li>
                              {challenge.scoring_config?.points_per_referral ||
                                100}{" "}
                              pts per referral
                            </li>
                          </InfoBox>
                          <div className="flex gap-2">
                            <Input
                              value={td.referralLink || ""}
                              readOnly
                              className="font-mono text-sm flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={copyReferralLink}
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareReferral("facebook")}
                            >
                              <Facebook className="h-4 w-4 mr-1" />
                              Facebook
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareReferral("twitter")}
                            >
                              <Twitter className="h-4 w-4 mr-1" />
                              Twitter
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareReferral("whatsapp")}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                          </div>
                          {td.referralLeaderboard?.length > 0 && (
                            <MiniLeaderboard
                              title="Top Referrers"
                              entries={td.referralLeaderboard.slice(0, 5)}
                              valueKey="total_referrals"
                              valueSuffix=" refs"
                              currentUserId={profile?.id}
                            />
                          )}
                        </div>
                      )}

                      {/* PURCHASE */}
                      {challenge.challenge_type === "purchase" && (
                        <div className="space-y-4">
                          {td.targetProduct && (
                            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                              <h4 className="font-semibold mb-2">
                                <ShoppingBag className="h-4 w-4 text-green-500 inline mr-1" />
                                Target Product
                              </h4>
                              <div className="flex items-center gap-3">
                                {td.targetProduct.image_url && (
                                  <img
                                    src={td.targetProduct.image_url}
                                    alt=""
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">
                                    {td.targetProduct.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    KSH{" "}
                                    {td.targetProduct.price?.toLocaleString()}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="mt-1 text-xs"
                                  >
                                    {challenge.scoring_config
                                      ?.points_per_unit || 10}{" "}
                                    pts/unit
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                          <Button className="w-full" size="lg" asChild>
                            <Link
                              href={`/?product=${challenge.scoring_config?.product_id}`}
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Buy Now & Earn Points
                            </Link>
                          </Button>
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 3, 5].map((qty) => (
                              <Button
                                key={qty}
                                variant="outline"
                                size="sm"
                                className="relative"
                                asChild
                              >
                                <Link
                                  href={`/?product=${challenge.scoring_config?.product_id}&qty=${qty}`}
                                >
                                  <div className="text-center">
                                    <p className="font-bold">{qty}x</p>
                                    <p className="text-xs">
                                      +
                                      {(challenge.scoring_config
                                        ?.points_per_unit || 10) * qty}{" "}
                                      pts
                                    </p>
                                  </div>
                                </Link>
                              </Button>
                            ))}
                          </div>
                          {td.purchaseLeaderboard?.length > 0 && (
                            <MiniLeaderboard
                              title="Top Buyers"
                              entries={td.purchaseLeaderboard.slice(0, 3)}
                              valueKey="total_units"
                              valueSuffix=" units"
                              currentUserId={profile?.id}
                            />
                          )}
                        </div>
                      )}

                      {/* STREAK */}
                      {challenge.challenge_type === "streak" && (
                        <Button
                          className="w-full"
                          onClick={async () => {
                            if (!profile) {
                              router.push("/login");
                              return;
                            }
                            try {
                              const r = await challengesService.recordAction(
                                challengeId,
                                profile.id,
                                "daily_login",
                                undefined,
                                { date: new Date().toISOString() },
                              );
                              toast.success(`+${r.pointsAwarded} pts!`);
                              loadData();
                            } catch (e: any) {
                              toast.error(e.message);
                            }
                          }}
                        >
                          <Flame className="h-4 w-4 mr-2" />
                          Daily Login
                        </Button>
                      )}

                      {/* SOCIAL */}
                      {challenge.challenge_type === "social" && (
                        <div className="space-y-4">
                          <InfoBox
                            icon={Heart}
                            color="text-pink-500"
                            title="How to Participate"
                          >
                            <li>
                              1. Create a post on social media with the hashtag
                            </li>
                            <li>
                              2. Submit the post URL below for verification
                            </li>
                            <li>3. Wait for admin approval to earn points</li>
                          </InfoBox>
                          <div>
                            <Label>Target Hashtag</Label>
                            <p className="text-lg font-bold text-purple-600 mt-1">
                              #
                              {challenge.scoring_config?.target_hashtag ||
                                "Challenge"}
                            </p>
                          </div>
                          <div>
                            <Label>Platform</Label>
                            <Select
                              value={socialForm.platform}
                              onValueChange={(v) =>
                                setSocialForm((p) => ({ ...p, platform: v }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "facebook",
                                  "twitter",
                                  "instagram",
                                  "tiktok",
                                  "linkedin",
                                  "youtube",
                                ].map((p) => (
                                  <SelectItem key={p} value={p}>
                                    <div className="flex items-center gap-2">
                                      {React.createElement(getSocialIcon(p), {
                                        className: "h-4 w-4",
                                      })}
                                      {p}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Post URL *</Label>
                            <Input
                              placeholder="https://..."
                              value={socialForm.postUrl}
                              onChange={(e) =>
                                setSocialForm((p) => ({
                                  ...p,
                                  postUrl: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Caption</Label>
                            <Textarea
                              placeholder="What did you write?"
                              value={socialForm.caption}
                              onChange={(e) =>
                                setSocialForm((p) => ({
                                  ...p,
                                  caption: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Screenshot URL</Label>
                            <Input
                              placeholder="https://..."
                              value={socialForm.screenshot}
                              onChange={(e) =>
                                setSocialForm((p) => ({
                                  ...p,
                                  screenshot: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleSocialSubmission}
                            disabled={!socialForm.postUrl || submittingSocial}
                          >
                            {submittingSocial ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Submit for Review
                          </Button>
                          {td.socialSubmissions?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold">
                                Your Submissions
                              </h4>
                              {td.socialSubmissions.map((sub: any) => (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                  <div className="flex items-center gap-2">
                                    {React.createElement(
                                      getSocialIcon(sub.platform),
                                      { className: "h-4 w-4" },
                                    )}
                                    <div>
                                      <p className="text-sm font-medium truncate max-w-[200px]">
                                        {sub.post_url}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(
                                          new Date(sub.created_at),
                                          { addSuffix: true },
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {sub.status === "approved" && (
                                      <Badge className="bg-green-100 text-green-700">
                                        +
                                        {(sub.points_awarded || 0) +
                                          (sub.bonus_points || 0)}{" "}
                                        pts
                                      </Badge>
                                    )}
                                    <Badge
                                      variant={
                                        sub.status === "approved"
                                          ? "default"
                                          : sub.status === "rejected"
                                            ? "destructive"
                                            : "secondary"
                                      }
                                    >
                                      {sub.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TEAM */}
                      {challenge.challenge_type === "team" && (
                        <div className="space-y-3">
                          {!participant?.team_id ? (
                            <>
                              <Button className="w-full" asChild>
                                <Link
                                  href={`/challenges/${challengeId}/teams/discover`}
                                >
                                  <UsersRound className="h-4 w-4 mr-2" />
                                  Find or Create a Team
                                </Link>
                              </Button>
                              <p className="text-sm text-muted-foreground text-center">
                                Team up with {challenge.min_team_size || 2}-
                                {challenge.max_team_size || 5} others!
                              </p>
                            </>
                          ) : (
                            <>
                              <Button className="w-full" asChild>
                                <Link
                                  href={`/challenges/${challengeId}/teams/manage`}
                                >
                                  <UsersRound className="h-4 w-4 mr-2" />
                                  Manage Your Team
                                </Link>
                              </Button>
                              <Button
                                className="w-full"
                                variant="outline"
                                asChild
                              >
                                <Link href="/">
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  Shop to Help Your Team
                                </Link>
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trivia Leaderboard - Special UX */}
            {challenge.challenge_type === "trivia" && leaderboard.length > 0 ? (
              <Card className="overflow-hidden border-2 border-yellow-500/20">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-6 py-4 border-b border-yellow-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                      <Trophy className="h-5 w-5" />
                      Trivia Rankings
                    </h3>
                    <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-0">
                      {leaderboard.length} players
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-0">
                  {/* Top 3 Podium */}
                  {leaderboard.length >= 3 && (
                    <div className="px-6 pt-6 pb-4">
                      <div className="flex items-end justify-center gap-3 h-32">
                        {/* 2nd Place */}
                        {leaderboard[1] && (
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative mb-2">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center ring-4 ring-gray-200 dark:ring-gray-700">
                                <span className="text-xl font-bold text-white">
                                  {leaderboard[1].full_name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <Award className="h-6 w-6 text-gray-400 absolute -bottom-1 -right-1" />
                            </div>
                            <div className="w-full bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-t-lg h-20 flex flex-col items-center justify-center relative">
                              <p className="text-2xl font-bold text-white">2</p>
                              <p className="text-xs text-white/80 truncate max-w-[80px] text-center">
                                {leaderboard[1].full_name?.split(" ")[0]}
                              </p>
                              <p className="text-xs font-bold text-white mt-1">
                                {leaderboard[1].total_score} pts
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 1st Place */}
                        {leaderboard[0] && (
                          <div className="flex flex-col items-center flex-1 -mt-4">
                            <div className="relative mb-2">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center ring-4 ring-yellow-300 dark:ring-yellow-700 animate-pulse">
                                <span className="text-2xl font-bold text-white">
                                  {leaderboard[0].full_name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <Crown className="h-7 w-7 text-yellow-500 absolute -top-3 -right-3" />
                            </div>
                            <div className="w-full bg-gradient-to-t from-yellow-400 to-yellow-300 dark:from-yellow-600 dark:to-yellow-500 rounded-t-lg h-28 flex flex-col items-center justify-center relative shadow-lg shadow-yellow-500/30">
                              <p className="text-3xl font-bold text-white">1</p>
                              <p className="text-sm font-semibold text-white truncate max-w-[80px] text-center">
                                {leaderboard[0].full_name?.split(" ")[0]}
                              </p>
                              <p className="text-sm font-bold text-white mt-1">
                                {leaderboard[0].total_score} pts
                              </p>
                              {leaderboard[0].current_streak > 0 && (
                                <Badge className="absolute -bottom-2 bg-orange-500 text-white border-0 text-xs">
                                  🔥 {leaderboard[0].current_streak}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3rd Place */}
                        {leaderboard[2] && (
                          <div className="flex flex-col items-center flex-1">
                            <div className="relative mb-2">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center ring-4 ring-amber-200 dark:ring-amber-800">
                                <span className="text-xl font-bold text-white">
                                  {leaderboard[2].full_name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <Award className="h-6 w-6 text-amber-600 absolute -bottom-1 -right-1" />
                            </div>
                            <div className="w-full bg-gradient-to-t from-amber-500 to-amber-400 dark:from-amber-700 dark:to-amber-600 rounded-t-lg h-16 flex flex-col items-center justify-center relative">
                              <p className="text-2xl font-bold text-white">3</p>
                              <p className="text-xs text-white/80 truncate max-w-[80px] text-center">
                                {leaderboard[2].full_name?.split(" ")[0]}
                              </p>
                              <p className="text-xs font-bold text-white mt-1">
                                {leaderboard[2].total_score} pts
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rankings List (4th place onwards) */}
                  <div className="px-6 pb-6 space-y-1">
                    {leaderboard.slice(3).map((entry, idx) => {
                      const isMe = entry.user_id === profile?.id;
                      const rank = idx + 4;

                      return (
                        <div
                          key={entry.user_id}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 hover:bg-muted/50",
                            isMe &&
                              "bg-purple-500/10 border border-purple-500/20",
                          )}
                        >
                          {/* Rank */}
                          <span
                            className={cn(
                              "w-8 text-center text-sm font-bold",
                              rank <= 10
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-muted-foreground",
                            )}
                          >
                            #{rank}
                          </span>

                          {/* Avatar + Name */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                isMe
                                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {entry.full_name?.charAt(0) || "?"}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-sm font-medium truncate",
                                  isMe &&
                                    "text-purple-600 dark:text-purple-400 font-bold",
                                )}
                              >
                                {entry.full_name || "Anonymous"}
                                {isMe && (
                                  <span className="text-xs ml-1">(You)</span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  {entry.correct_answers}/
                                  {entry.questions_answered} correct
                                </span>
                                {entry.current_streak > 0 && (
                                  <span className="text-orange-500">
                                    🔥 {entry.current_streak}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Score & Stats */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm">
                              {entry.total_score} pts
                            </p>
                            {entry.accuracy > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {entry.accuracy}%
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Show top 3 again in list format if preferred, or just the list */}
                    {leaderboard.length <= 3 && leaderboard.length > 0 && (
                      <div className="space-y-1 pt-4">
                        {leaderboard.map((entry, idx) => {
                          const isMe = entry.user_id === profile?.id;

                          return (
                            <div
                              key={entry.user_id}
                              className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200",
                                idx === 0 &&
                                  "bg-yellow-500/10 border border-yellow-500/20",
                                isMe &&
                                  "bg-purple-500/10 border border-purple-500/20",
                              )}
                            >
                              <span className="w-8 text-center">
                                {idx === 0
                                  ? "🥇"
                                  : idx === 1
                                    ? "🥈"
                                    : idx === 2
                                      ? "🥉"
                                      : `#${idx + 1}`}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "text-sm font-medium truncate",
                                    isMe &&
                                      "text-purple-600 dark:text-purple-400",
                                  )}
                                >
                                  {entry.full_name} {isMe && "(You)"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>
                                    {entry.correct_answers}/
                                    {entry.questions_answered}
                                  </span>
                                  {entry.fastest_response_ms && (
                                    <span>
                                      ⚡{" "}
                                      {(
                                        entry.fastest_response_ms / 1000
                                      ).toFixed(1)}
                                      s
                                    </span>
                                  )}
                                  {entry.current_streak > 0 && (
                                    <span>🔥 {entry.current_streak}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{entry.total_score}</p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.accuracy}%
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Stats Footer */}
                  {leaderboard.length > 0 && (
                    <div className="px-6 py-3 bg-muted/30 border-t">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Avg Accuracy
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            {Math.round(
                              leaderboard.reduce(
                                (sum, e) => sum + (e.accuracy || 0),
                                0,
                              ) / leaderboard.length,
                            )}
                            %
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Fastest
                          </p>
                          <p className="text-sm font-bold text-blue-600">
                            {leaderboard.some((e) => e.fastest_response_ms)
                              ? (
                                  Math.min(
                                    ...leaderboard
                                      .filter((e) => e.fastest_response_ms)
                                      .map((e) => e.fastest_response_ms),
                                  ) / 1000
                                ).toFixed(1) + "s"
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Best Streak
                          </p>
                          <p className="text-sm font-bold text-orange-600">
                            🔥{" "}
                            {Math.max(
                              ...leaderboard.map((e) => e.best_streak || 0),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Regular Leaderboard for non-trivia challenges
              <Card>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Leaderboard
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry, idx) => (
                      <div
                        key={entry.id || entry.user_id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg",
                          entry.user_id === profile?.id && "bg-primary/10",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-bold">
                            {idx === 0 ? (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            ) : idx === 1 ? (
                              <Award className="h-4 w-4 text-gray-400" />
                            ) : idx === 2 ? (
                              <Award className="h-4 w-4 text-amber-600" />
                            ) : (
                              `#${idx + 1}`
                            )}
                          </span>
                          <span className="text-sm truncate max-w-[120px]">
                            {entry.users?.full_name ||
                              entry.full_name ||
                              "Anonymous"}
                          </span>
                        </div>
                        <span className="font-bold">
                          {entry.current_score || entry.total_score}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
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
                        {tier.prize_type === "points"
                          ? `${tier.prize_value} pts`
                          : tier.prize_type === "discount"
                            ? `${tier.prize_value}% off`
                            : tier.prize_value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <InfoRow
                  label="Starts"
                  value={format(new Date(challenge.starts_at), "PPP")}
                />
                <InfoRow
                  label="Ends"
                  value={format(new Date(challenge.ends_at), "PPP")}
                  urgent={isUrgent}
                />
                {challenge.allow_teams && (
                  <InfoRow
                    label="Teams"
                    value={`Up to ${challenge.max_team_size} members`}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Challenge</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 justify-center py-4">
            {["facebook", "twitter", "whatsapp"].map((p) => (
              <Button
                key={p}
                variant="outline"
                onClick={() => {
                  shareReferral(p);
                  setShowShareDialog(false);
                }}
              >
                {p === "facebook" ? (
                  <Facebook className="h-4 w-4 mr-2" />
                ) : p === "twitter" ? (
                  <Twitter className="h-4 w-4 mr-2" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                {p}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Team Name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={async () => {
                if (!newTeamName.trim()) {
                  toast.error("Enter a name");
                  return;
                }
                setJoining(true);
                try {
                  await challengesService.createTeam(
                    challengeId,
                    profile!.id,
                    newTeamName,
                  );
                  toast.success("Team created!");
                  setShowTeamDialog(false);
                  loadData();
                } catch (e: any) {
                  toast.error(e.message);
                } finally {
                  setJoining(false);
                }
              }}
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

// ─── Helper Sub-Components ──────────────────────────────
function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className={cn("text-2xl font-bold", color || "")}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div>
      <p className={cn("text-lg font-bold", color || "")}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
function InfoRow({
  label,
  value,
  urgent,
}: {
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={urgent ? "text-red-500 font-medium" : ""}>{value}</span>
    </div>
  );
}
function ProgressRow({
  label,
  done,
  total,
  className,
}: {
  label: string;
  done: number;
  total: number;
  className?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{done} completed</span>
      </div>
      <Progress
        value={total > 0 ? (done / total) * 100 : 0}
        className={cn("h-2", className)}
      />
    </div>
  );
}
function InfoBox({
  icon: Icon,
  color,
  title,
  children,
}: {
  icon: any;
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
      <h4 className="font-semibold mb-2 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        {title}
      </h4>
      <ul className="text-sm space-y-1 text-muted-foreground">{children}</ul>
    </div>
  );
}
function MiniLeaderboard({
  title,
  entries,
  valueKey,
  valueSuffix,
  currentUserId,
}: {
  title: string;
  entries: any[];
  valueKey: string;
  valueSuffix: string;
  currentUserId?: string;
}) {
  return (
    <div className="mt-4 p-4 rounded-lg bg-muted/50">
      <h4 className="font-semibold mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-500" />
        {title}
      </h4>
      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <div
            key={entry.user_id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {["🥇", "🥈", "🥉"][idx] || `#${idx + 1}`}
              </span>
              <span
                className={cn(
                  entry.user_id === currentUserId && "font-bold text-blue-600",
                )}
              >
                {entry.full_name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {entry[valueKey]}
                {valueSuffix}
              </span>
              <span className="font-bold">{entry.current_score} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
