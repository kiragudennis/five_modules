// app/(store)/deals/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { DealsService } from "@/lib/services/deals-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Gift,
  Package,
  Ticket,
  TrendingDown,
  Clock,
  Coins,
  Eye,
  ShoppingBag,
  Flame,
  Calendar,
  Tag,
  ArrowRight,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Deal } from "@/types/deals";

const DEAL_BADGES: Record<string, { icon: any; label: string; color: string }> =
  {
    discount: {
      icon: TrendingDown,
      label: "Discount",
      color: "from-green-500 to-emerald-500",
    },
    bogo: { icon: Package, label: "BOGO", color: "from-blue-500 to-cyan-500" },
    free_gift: {
      icon: Gift,
      label: "Free Gift",
      color: "from-purple-500 to-pink-500",
    },
    mystery: {
      icon: Ticket,
      label: "Mystery",
      color: "from-orange-500 to-red-500",
    },
    flash_sale: {
      icon: Zap,
      label: "Flash Sale",
      color: "from-yellow-500 to-orange-500",
    },
    daily_deal: {
      icon: Calendar,
      label: "Daily Deal",
      color: "from-indigo-500 to-purple-500",
    },
  };

export default function DealsPage() {
  const { supabase, profile } = useAuth();
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [upcomingDeals, setUpcomingDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userClaims, setUserClaims] = useState<Record<string, number>>({});

  const fetchDeals = useCallback(async () => {
    const now = new Date().toISOString();

    // Fetch active deals
    const { data: active } = await supabase
      .from("deals")
      .select("*")
      .eq("status", "active")
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("ends_at", { ascending: true });

    // Fetch upcoming deals
    const { data: upcoming } = await supabase
      .from("deals")
      .select("*")
      .eq("status", "active")
      .gt("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(6);

    setActiveDeals(active || []);
    setUpcomingDeals(upcoming || []);

    // Get user's claim counts if logged in
    if (profile?.id && active) {
      const claimCounts: Record<string, number> = {};
      for (const deal of active) {
        const { count } = await supabase
          .from("deal_claims")
          .select("id", { count: "exact", head: true })
          .eq("deal_id", deal.id)
          .eq("user_id", profile.id);
        claimCounts[deal.id] = count || 0;
      }
      setUserClaims(claimCounts);
    }

    setLoading(false);
  }, [supabase, profile?.id]);

  useEffect(() => {
    fetchDeals();

    // Refresh every minute
    const interval = setInterval(fetchDeals, 60000);
    return () => clearInterval(interval);
  }, [fetchDeals]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTimeRemaining = (endsAt: string) => {
    return formatDistanceToNow(new Date(endsAt), { addSuffix: true });
  };

  const getStockPercentage = (deal: Deal) => {
    if (!deal.total_quantity) return null;
    const claimed = deal.total_quantity - (deal.remaining_quantity || 0);
    return (claimed / deal.total_quantity) * 100;
  };

  const getDiscountDisplay = (deal: Deal) => {
    if (deal.deal_type === "discount" && deal.discount_value) {
      if (deal.discount_type === "percentage") {
        return `${deal.discount_value}% OFF`;
      }
      return `KES ${deal.discount_value.toLocaleString()} OFF`;
    }
    if (deal.deal_type === "flash_sale" && deal.deal_price) {
      return `Only ${formatPrice(deal.deal_price)}`;
    }
    return null;
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

  const hasActiveDeals = activeDeals.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Tag className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Today's Deals</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Limited-time offers, flash sales, and exclusive discounts. Shop now
            before they're gone!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="active">
              Active Deals
              {activeDeals.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeDeals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          {/* Active Deals Tab */}
          <TabsContent value="active" className="space-y-6">
            {!hasActiveDeals ? (
              <Card className="p-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Deals</h3>
                <p className="text-muted-foreground">
                  Check back soon for exciting deals and discounts!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDeals.map((deal) => {
                  const badge = DEAL_BADGES[deal.deal_type];
                  const Icon = badge?.icon || Tag;
                  const stockPercentage = getStockPercentage(deal);
                  const timeRemaining = getTimeRemaining(deal.ends_at);
                  const isLowStock =
                    stockPercentage !== null && stockPercentage > 80;
                  const discountDisplay = getDiscountDisplay(deal);
                  const userClaimed = userClaims[deal.id] || 0;
                  const hasReachedLimit = userClaimed >= deal.per_user_limit;

                  return (
                    <Card
                      key={deal.id}
                      className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Deal Banner */}
                      <div
                        className={cn(
                          "relative h-32 bg-gradient-to-r p-4 text-white",
                          badge?.color || "from-purple-500 to-pink-500",
                        )}
                      >
                        {deal.featured_image_url && (
                          <img
                            src={deal.featured_image_url}
                            alt={deal.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                          />
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/20 text-white border-0 gap-1">
                            <Icon className="h-3 w-3" />
                            {badge?.label}
                          </Badge>
                        </div>
                        {isLowStock && (
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex items-center gap-1 text-xs bg-red-500/80 rounded-full px-2 py-1 w-fit">
                              <Flame className="h-3 w-3" />
                              Only {deal.remaining_quantity} left!
                            </div>
                          </div>
                        )}
                        <h3 className="text-xl font-bold relative z-10 line-clamp-1 mt-4">
                          {deal.name}
                        </h3>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {deal.description}
                        </p>

                        {/* Discount Display */}
                        {discountDisplay && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Deal:
                            </span>
                            <Badge className="bg-green-500 text-white">
                              {discountDisplay}
                            </Badge>
                          </div>
                        )}

                        {/* Stock Progress */}
                        {stockPercentage !== null && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Claimed
                              </span>
                              <span
                                className={
                                  isLowStock ? "text-red-500 font-medium" : ""
                                }
                              >
                                {(deal.total_quantity || 0) -
                                  (deal.remaining_quantity || 0)}{" "}
                                / {deal.total_quantity}
                              </span>
                            </div>
                            <Progress
                              value={stockPercentage}
                              className="h-1.5"
                            />
                          </div>
                        )}

                        {/* Time Remaining */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Ends {timeRemaining}</span>
                        </div>

                        {/* User Limit Warning */}
                        {hasReachedLimit && (
                          <div className="p-2 rounded-lg bg-amber-500/10 text-center">
                            <p className="text-xs text-amber-600">
                              You've reached your limit for this deal
                            </p>
                          </div>
                        )}

                        {/* Bonus Points */}
                        {deal.bonus_points_per_purchase > 0 && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <Coins className="h-3 w-3" />
                            <span>
                              Earn {deal.bonus_points_per_purchase} bonus
                              points!
                            </span>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          asChild
                          className="w-full group"
                          disabled={hasReachedLimit}
                        >
                          <Link href={`/deals/${deal.slug}`}>
                            {hasReachedLimit ? "Limit Reached" : "View Deal"}
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

          {/* Upcoming Deals Tab */}
          <TabsContent value="upcoming" className="space-y-6">
            {upcomingDeals.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Upcoming Deals
                </h3>
                <p className="text-muted-foreground">
                  Check back soon for future deals!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingDeals.map((deal) => {
                  const badge = DEAL_BADGES[deal.deal_type];
                  const Icon = badge?.icon || Tag;
                  const startsIn = formatDistanceToNow(
                    new Date(deal.starts_at),
                    { addSuffix: true },
                  );

                  return (
                    <Card
                      key={deal.id}
                      className="overflow-hidden border-2 border-dashed border-primary/30"
                    >
                      <div
                        className={cn(
                          "h-24 bg-gradient-to-r p-4 text-white",
                          badge?.color || "from-purple-500 to-pink-500",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm opacity-90">
                            {badge?.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold line-clamp-1">
                          {deal.name}
                        </h3>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {deal.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Starts {startsIn}</span>
                        </div>
                        <Button variant="outline" className="w-full" disabled>
                          <Bell className="h-4 w-4 mr-2" />
                          Notify Me
                        </Button>
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
