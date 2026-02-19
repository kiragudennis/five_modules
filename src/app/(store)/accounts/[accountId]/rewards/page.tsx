// app/accounts/[accountId]/rewards/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  ChevronLeft,
  Crown,
  Coins,
  Calendar,
  Award,
  Ticket,
  CheckCircle,
  Clock,
  Loader2,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Reward {
  id: string;
  name: string;
  description: string;
  type: string;
  trigger_type: string;
  trigger_value: number;
  reward_points: number;
  reward_tier_upgrade: string | null;
  reward_details: any;
  is_recurring: boolean;
  recurring_interval: string | null;
}

interface UserReward {
  id: string;
  reward_id: string;
  milestone_date: string;
  loyalty_points_awarded: number;
  coupon_id: string | null;
  reward_claimed: boolean;
  claimed_at: string | null;
  expires_at: string | null;
  metadata: any;
  reward: Reward;
  coupon?: {
    code: string;
    discount_type: string;
    discount_value: number;
    valid_until: string;
  };
}

export default function RewardsPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [userTier, setUserTier] = useState("bronze");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (!profile || profile.id !== accountId) {
      router.push("/login");
      return;
    }
    fetchRewards();
  }, [accountId, profile]);

  const fetchRewards = async () => {
    try {
      setLoading(true);

      // Get user's loyalty info
      const { data: loyaltyData } = await supabase
        .from("loyalty_points")
        .select("tier, points")
        .eq("user_id", accountId)
        .single();

      if (loyaltyData) {
        setUserTier(loyaltyData.tier);
        setLoyaltyPoints(loyaltyData.points);
      }

      // Get user's claimed rewards with coupon details
      const { data: userRewardsData, error: userRewardsError } = await supabase
        .from("user_rewards")
        .select(
          `
          *,
          reward:reward_id (*),
          coupon:coupon_id (
            code,
            discount_type,
            discount_value,
            valid_until
          )
        `,
        )
        .eq("user_id", accountId)
        .order("created_at", { ascending: false });

      if (userRewardsError) throw userRewardsError;
      setRewards(userRewardsData || []);

      // Get available rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .order("created_at");

      if (rewardsError) throw rewardsError;

      // Filter rewards that user hasn't claimed yet
      const claimedRewardIds = new Set(
        userRewardsData?.map((r: any) => r.reward_id) || [],
      );
      const available = rewardsData.filter(
        (r: any) => !claimedRewardIds.has(r.id),
      );
      setAvailableRewards(available);
    } catch (error: any) {
      console.error("Error fetching rewards:", error);
      toast.error("Could not load rewards");
    } finally {
      setLoading(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "birthday":
        return <PartyPopper className="h-5 w-5 text-pink-500" />;
      case "anniversary":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "milestone":
        return <Award className="h-5 w-5 text-purple-500" />;
      case "vip":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Gift className="h-5 w-5 text-green-500" />;
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      // This would be an RPC function to claim a reward
      const { data, error } = await supabase.rpc("claim_reward", {
        p_user_id: accountId,
        p_reward_id: rewardId,
      });

      if (error) throw error;

      toast.success("Reward claimed successfully!");
      fetchRewards(); // Refresh
    } catch (error: any) {
      console.error("Error claiming reward:", error);
      toast.error("Could not claim reward");
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
            <h1 className="text-3xl font-bold">My Rewards</h1>
            <p className="text-muted-foreground mt-1">
              Special gifts and bonuses just for you
            </p>
          </div>
        </div>

        {/* User Status */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Tier</p>
                  <p className="text-2xl font-bold capitalize">{userTier}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Coins className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Loyalty Points
                  </p>
                  <p className="text-2xl font-bold">
                    {loyaltyPoints.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Available Rewards</h2>
            <div className="grid gap-4">
              {availableRewards.map((reward) => (
                <Card
                  key={reward.id}
                  className="border-2 border-dashed border-primary/50"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        {getRewardIcon(reward.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{reward.name}</h3>
                        <p className="text-muted-foreground">
                          {reward.description}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-4">
                          {reward.reward_points > 0 && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Coins className="h-3 w-3" />
                              {reward.reward_points} points
                            </Badge>
                          )}
                          {reward.reward_tier_upgrade && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Crown className="h-3 w-3" />
                              Upgrade to {reward.reward_tier_upgrade}
                            </Badge>
                          )}
                          {reward.reward_details?.coupon && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Ticket className="h-3 w-3" />
                              Discount Coupon
                            </Badge>
                          )}
                        </div>

                        <Button
                          className="mt-4"
                          onClick={() => handleClaimReward(reward.id)}
                        >
                          Claim Reward
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Claimed Rewards */}
        <h2 className="text-xl font-semibold mb-4">Reward History</h2>
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Rewards Yet</h3>
                <p className="text-muted-foreground">
                  Complete challenges and milestones to earn rewards!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rewards.map((userReward) => (
              <Card key={userReward.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      {getRewardIcon(userReward.reward.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">
                          {userReward.reward.name}
                        </h3>
                        <Badge
                          variant={
                            userReward.reward_claimed ? "default" : "outline"
                          }
                        >
                          {userReward.reward_claimed ? "Claimed" : "Pending"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {userReward.reward.description}
                      </p>

                      {userReward.loyalty_points_awarded > 0 && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <Coins className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">
                            +{userReward.loyalty_points_awarded} points awarded
                          </span>
                        </div>
                      )}

                      {userReward.coupon && (
                        <div className="bg-green-50 p-3 rounded-lg mb-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            Discount Code
                          </p>
                          <p className="font-mono text-lg font-bold text-green-700">
                            {userReward.coupon.code}
                          </p>
                          <div className="flex justify-between items-center mt-2 text-sm">
                            <span className="text-green-600">
                              {userReward.coupon.discount_type === "percentage"
                                ? `${userReward.coupon.discount_value}% off`
                                : `KES ${userReward.coupon.discount_value} off`}
                            </span>
                            {userReward.coupon.valid_until && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires{" "}
                                {format(
                                  new Date(userReward.coupon.valid_until),
                                  "MMM d, yyyy",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(userReward.milestone_date),
                            "MMMM d, yyyy",
                          )}
                        </span>
                        {userReward.claimed_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Claimed{" "}
                            {format(
                              new Date(userReward.claimed_at),
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
