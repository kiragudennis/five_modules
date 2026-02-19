// app/accounts/[accountId]/challenges/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  ChevronLeft,
  Crown,
  Coins,
  Gift,
  Users,
  ShoppingBag,
  Star,
  MessageCircle,
  Twitter,
  Facebook,
  Link2,
  CheckCircle,
  Loader2,
  Clock,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Challenge, UserChallenge } from "@/types/customer";

export default function ChallengesPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>(
    [],
  );
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    if (!profile || profile.id !== accountId) {
      router.push("/login");
      return;
    }
    fetchChallenges();
  }, [accountId, profile]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);

      // Get user's challenges
      const { data: userChallengesData, error: userChallengesError } =
        await supabase
          .from("user_challenges")
          .select(
            `
          *,
          challenge:challenge_id (*)
        `,
          )
          .eq("user_id", accountId)
          .order("created_at", { ascending: false });

      if (userChallengesError) throw userChallengesError;
      setUserChallenges(userChallengesData || []);

      // Get available challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("created_at");

      if (challengesError) throw challengesError;

      // Filter challenges user hasn't started/completed
      const startedChallengeIds = new Set(
        userChallengesData?.map((uc: any) => uc.challenge_id) || [],
      );
      const available = challengesData.filter(
        (c: any) => !startedChallengeIds.has(c.id),
      );
      setAvailableChallenges(available);

      // Get user's referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select(
          `
          *,
          referred_user:referred_user_id (email, full_name, created_at)
        `,
        )
        .eq("referrer_id", accountId)
        .order("created_at", { ascending: false });

      if (!referralsError && referralsData) {
        setReferrals(referralsData);
      }
    } catch (error: any) {
      console.error("Error fetching challenges:", error);
      toast.error("Could not load challenges");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_challenges")
        .insert({
          user_id: accountId,
          challenge_id: challengeId,
          status: "in_progress",
          progress: 0,
          target: 1, // This would be set based on challenge requirements
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Challenge joined!");
      fetchChallenges(); // Refresh
    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast.error("Could not join challenge");
    }
  };

  const handleShareReferral = async () => {
    try {
      // Generate referral code if user doesn't have one
      let referralCode = profile?.referral_code;

      if (!referralCode) {
        const code =
          "REF-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        const { error } = await supabase
          .from("users")
          .update({ referral_code: code })
          .eq("id", accountId);

        if (error) throw error;
        referralCode = code;
      }

      // Create shareable link
      const shareLink = `${window.location.origin}/login?ref=${referralCode}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);

      toast.success("Referral link copied to clipboard!");
    } catch (error: any) {
      console.error("Error sharing referral:", error);
      toast.error("Could not generate referral link");
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "referral":
        return <Users className="h-5 w-5" />;
      case "purchase":
        return <ShoppingBag className="h-5 w-5" />;
      case "review":
        return <Star className="h-5 w-5" />;
      case "social":
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50">
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50">
            Completed
          </Badge>
        );
      case "reward_claimed":
        return (
          <Badge variant="default" className="bg-green-600">
            Reward Claimed
          </Badge>
        );
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/accounts/${accountId}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Challenges</h1>
            <p className="text-muted-foreground mt-1">
              Complete challenges and earn amazing rewards
            </p>
          </div>
        </div>

        {/* Referral Section */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-100 rounded-full">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Refer a Friend</h3>
                  <p className="text-muted-foreground">
                    Share your referral link and earn points when they join
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleShareReferral}
                  className="whitespace-nowrap"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              </div>
            </div>

            {/* Referral Stats */}
            {referrals.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Your Referrals</h4>
                <div className="space-y-3">
                  {referrals.slice(0, 3).map((ref) => (
                    <div
                      key={ref.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{ref.referred_email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined{" "}
                          {ref.referred_user_id
                            ? format(
                                new Date(ref.referred_user?.created_at),
                                "MMM d, yyyy",
                              )
                            : "Pending"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          ref.status === "completed" ? "default" : "outline"
                        }
                      >
                        {ref.status}
                      </Badge>
                    </div>
                  ))}
                  {referrals.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{referrals.length - 3} more referrals
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Challenges */}
        {availableChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Available Challenges</h2>
            <div className="grid gap-4">
              {availableChallenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="border-2 border-dashed border-primary/50"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        {getChallengeIcon(challenge.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {challenge.name}
                        </h3>
                        <p className="text-muted-foreground">
                          {challenge.description}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-4">
                          {challenge.reward_points > 0 && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Coins className="h-3 w-3" />
                              {challenge.reward_points} points
                            </Badge>
                          )}
                          {challenge.reward_tier_upgrade && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Crown className="h-3 w-3" />
                              Upgrade to {challenge.reward_tier_upgrade}
                            </Badge>
                          )}
                        </div>

                        <Button
                          className="mt-4"
                          onClick={() => handleJoinChallenge(challenge.id)}
                        >
                          Join Challenge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active & Completed Challenges */}
        <h2 className="text-xl font-semibold mb-4">Your Challenges</h2>
        {userChallenges.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Challenges Yet</h3>
                <p className="text-muted-foreground">
                  Join a challenge to start earning rewards!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userChallenges.map((userChallenge) => (
              <Card key={userChallenge.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      {getChallengeIcon(userChallenge.challenge.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">
                          {userChallenge.challenge.name}
                        </h3>
                        {getStatusBadge(userChallenge.status)}
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">
                        {userChallenge.challenge.description}
                      </p>

                      {/* Progress Bar */}
                      {userChallenge.status === "in_progress" && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>
                              {userChallenge.progress} / {userChallenge.target}
                            </span>
                          </div>
                          <Progress
                            value={
                              (userChallenge.progress / userChallenge.target) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                      )}

                      {/* Reward Details */}
                      {userChallenge.status === "completed" &&
                        userChallenge.loyalty_points_awarded > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg mb-3">
                            <div className="flex items-center gap-2">
                              <Coins className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">
                                +{userChallenge.loyalty_points_awarded} points
                                earned
                              </span>
                            </div>
                          </div>
                        )}

                      {/* Reward Claim Button */}
                      {userChallenge.status === "completed" &&
                        !userChallenge.reward_claimed_at && (
                          <Button size="sm" className="mt-2">
                            Claim Reward
                          </Button>
                        )}

                      {/* Dates */}
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        {userChallenge.completed_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed{" "}
                            {format(
                              new Date(userChallenge.completed_at),
                              "MMM d, yyyy",
                            )}
                          </span>
                        )}
                        {userChallenge.reward_claimed_at && (
                          <span className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            Claimed{" "}
                            {format(
                              new Date(userChallenge.reward_claimed_at),
                              "MMM d, yyyy",
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
