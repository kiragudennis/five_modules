// app/account/loyalty/page.tsx (with fixes for TypeScript issues)
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Gift,
  TrendingUp,
  History,
  Sparkles,
  Award,
  Zap,
  Star,
  Ticket,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/context/StoreContext";
import { useRouter } from "next/navigation";

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-800 border-amber-300",
  silver: "bg-gray-100 text-gray-800 border-gray-300",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  platinum: "bg-purple-100 text-purple-800 border-purple-300",
};

const TIER_ICONS: Record<string, React.ComponentType<any>> = {
  bronze: Award,
  silver: Star,
  gold: Crown,
  platinum: Zap,
};

interface LoyaltyTransaction {
  date: string;
  type: string;
  points: number;
  description: string;
  order_number: string | null;
}

interface LoyaltyData {
  points: number;
  tier: string;
  tierDetails: {
    name: string;
    pointsPerShilling: number;
    discountPercentage: number;
    freeShippingThreshold: number | null;
    prioritySupport: boolean;
    birthdayBonusPoints: number;
  };
  nextTier: {
    name: string;
    minPoints: number;
    pointsNeeded: number;
    discountPercentage: number;
  } | null;
  recentTransactions: LoyaltyTransaction[];
  pointsValue: number;
  totalEarned: number;
  totalRedeemed: number;
}

export default function LoyaltyPage() {
  const { supabase, profile } = useAuth();
  const { cartItems } = useCart();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const user = profile;
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
  }, [user, supabase]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_user_loyalty_summary", {
        p_user_id: user?.id,
      });

      if (error) throw error;
      setLoyaltyData(data);
    } catch (error: any) {
      console.error("Error fetching loyalty data:", error);
      toast.error("Could not load loyalty information");
    } finally {
      setLoading(false);
    }
  };

  // Update in app/account/loyalty/page.tsx
  const handleRedeemPoints = async () => {
    if (!loyaltyData || loyaltyData.points < 100) {
      toast.error("You need at least 100 points to redeem");
      return;
    }

    const pointsToRedeem = Math.floor(loyaltyData.points / 100) * 100; // Redeem in multiples of 100
    const discountAmount = pointsToRedeem / 10; // 1 point = 0.10 KES

    try {
      setRedeeming(true);

      // Call new function that creates redemption record
      const { data, error } = await supabase.rpc(
        "redeem_loyalty_points_for_checkout",
        {
          p_user_id: user?.id,
          p_points_to_redeem: pointsToRedeem,
          p_description: "Points redeemed for discount",
        },
      );

      if (error) throw error;

      if (data.success) {
        // Store redemption code in localStorage for checkout
        localStorage.setItem(
          "loyalty_redemption",
          JSON.stringify({
            code: data.redemption_code,
            points: data.points_redeemed,
            discount: data.discount_amount,
            validUntil: new Date(
              Date.now() + 24 * 60 * 60 * 1000,
            ).toISOString(), // 24 hours
          }),
        );

        toast.success(
          `Successfully redeemed ${pointsToRedeem} points for KES ${discountAmount.toFixed(2)} discount!`,
          {
            description: `Use code: ${data.redemption_code} during checkout`,
            action: {
              label: "Go to Checkout",
              onClick: () => {
                if (cartItems.length > 0) {
                  router.push("/checkout");
                } else {
                  router.push("/products");
                }
              },
            },
          },
        );
        fetchLoyaltyData(); // Refresh data
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      console.error("Error redeeming points:", error);
      toast.error("Could not redeem points");
    } finally {
      setRedeeming(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                Sign in to view your loyalty points
              </h3>
              <p className="text-muted-foreground mb-6">
                Earn points with every purchase and unlock exclusive rewards
              </p>
              <Button onClick={() => (window.location.href = "/login")}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !loyaltyData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const TierIcon = TIER_ICONS[loyaltyData.tier] || Award;
  const progressPercentage = loyaltyData.nextTier
    ? (loyaltyData.points / loyaltyData.nextTier.minPoints) * 100
    : 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Loyalty Rewards</h1>
          <p className="text-muted-foreground">
            Earn points with every purchase and enjoy exclusive benefits
          </p>
        </div>

        {/* Current Tier Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left: Tier Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-full ${TIER_COLORS[loyaltyData.tier].split(" ")[0]}`}
                  >
                    <TierIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge className={TIER_COLORS[loyaltyData.tier]}>
                      {loyaltyData.tier.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Earn {loyaltyData.tierDetails.pointsPerShilling} points
                      per KES spent
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Your Points</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {loyaltyData.points.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">points</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Worth KES {loyaltyData.pointsValue.toFixed(2)} in
                      discounts
                    </p>
                  </div>

                  {loyaltyData.nextTier && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress to {loyaltyData.nextTier.name}</span>
                        <span>
                          {loyaltyData.points} /{" "}
                          {loyaltyData.nextTier.minPoints}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(progressPercentage, 100)}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {loyaltyData.nextTier.pointsNeeded} more points to reach{" "}
                        {loyaltyData.nextTier.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Tier Benefits */}
              <div className="flex-1 border-l md:border-l-0 md:border-t md:pt-6 md:pl-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tier Benefits
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>
                      {loyaltyData.tierDetails.discountPercentage}% discount on
                      all orders
                    </span>
                  </li>
                  {loyaltyData.tierDetails.freeShippingThreshold && (
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>
                        Free shipping on orders over KES{" "}
                        {loyaltyData.tierDetails.freeShippingThreshold}
                      </span>
                    </li>
                  )}
                  {loyaltyData.tierDetails.prioritySupport && (
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Priority customer support</span>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>
                      {loyaltyData.tierDetails.birthdayBonusPoints} bonus points
                      on your birthday
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold">
                    {loyaltyData.totalEarned.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Gift className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Redeemed
                  </p>
                  <p className="text-2xl font-bold">
                    {loyaltyData.totalRedeemed.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Ticket className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold">
                    KES {loyaltyData.pointsValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Redeem Points */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Redeem Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    Turn Points into Savings
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Redeem 100 points for KES 10 discount. Your points never
                    expire!
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-primary/20 px-2 py-1 rounded">
                      100 pts = KES 10
                    </div>
                    <div className="bg-primary/20 px-2 py-1 rounded">
                      500 pts = KES 50
                    </div>
                    <div className="bg-primary/20 px-2 py-1 rounded">
                      1000 pts = KES 100
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Available to redeem
                    </p>
                    <p className="text-3xl font-bold">
                      {Math.floor(loyaltyData.points / 100) * 100} pts
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleRedeemPoints}
                    disabled={loyaltyData.points < 100 || redeeming}
                  >
                    {redeeming ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Redeem Now"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loyaltyData.recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loyaltyData.recentTransactions.map(
                  (transaction: LoyaltyTransaction, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                        h-8 w-8 rounded-full flex items-center justify-center
                        ${
                          transaction.type === "earned"
                            ? "bg-green-100 text-green-600"
                            : transaction.type === "redeemed"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                        }
                      `}
                        >
                          {transaction.type === "earned" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : transaction.type === "redeemed" ? (
                            <Gift className="h-4 w-4" />
                          ) : (
                            <History className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                            {transaction.order_number &&
                              ` • Order ${transaction.order_number}`}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`
                      font-bold ${
                        transaction.type === "earned"
                          ? "text-green-600"
                          : "text-blue-600"
                      }
                    `}
                      >
                        {transaction.type === "earned" ? "+" : "-"}
                        {transaction.points} pts
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
