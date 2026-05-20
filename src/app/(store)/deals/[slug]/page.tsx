// app/(store)/deals/[slug]/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { DealsService } from "@/lib/services/deals-service";
import { PointsService } from "@/lib/services/points-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  Clock,
  Gift,
  Coins,
  ShoppingBag,
  Eye,
  Users,
  TrendingDown,
  Package,
  Ticket,
  Flame,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Tag,
  ArrowLeft,
  Share2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Deal, DealStatus } from "@/types/deals";
import { Product } from "@/types/store";

export default function DealPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<DealStatus | null>(null);
  const [ticker, setTicker] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [reviving, setReviving] = useState(false);
  const [gettingEarlyAccess, setGettingEarlyAccess] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  const dealsService = new DealsService(supabase);

  const loadData = useCallback(async () => {
    if (!slug) return;

    // Fetch deal
    const { data: dealData } = await supabase
      .from("deals")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!dealData) {
      setLoading(false);
      return;
    }

    setDeal(dealData);

    // Fetch product if exists
    if (dealData.product_id) {
      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .eq("id", dealData.product_id)
        .single();
      if (productData) {
        setProduct({
          ...productData,
          originalPrice: productData.price,
        });
      }
    }

    // Get deal status
    const dealStatus = await dealsService.getDealStatus(
      dealData.id,
      profile?.id,
    );
    setStatus(dealStatus);

    // Get live ticker
    const tickerData = await dealsService.getLiveTicker(dealData.id, 15);
    setTicker(tickerData);

    // Get user points if logged in
    if (profile?.id) {
      const points = await PointsService.getBalance(supabase, profile.id);
      setUserPoints(points?.points || 0);
    }

    setLoading(false);
  }, [slug, supabase, profile?.id, dealsService]);

  useEffect(() => {
    loadData();

    // Refresh every second for countdown
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleClaimDeal = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }

    if (!status?.can_claim) {
      toast.error("Cannot claim this deal right now");
      return;
    }

    setClaiming(true);
    try {
      // Redirect to checkout with deal applied
      router.push(`/checkout?deal=${deal?.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setClaiming(false);
    }
  };

  const handleRevive = async () => {
    if (!profile) return;

    setReviving(true);
    try {
      await dealsService.reviveDeal(deal!.id, profile.id);
      toast.success(
        `Deal revived! You have ${deal?.revive_duration_minutes} minutes to claim it.`,
      );
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setReviving(false);
    }
  };

  const handleEarlyAccess = async () => {
    if (!profile) return;

    setGettingEarlyAccess(true);
    try {
      await dealsService.grantEarlyAccess(deal!.id, profile.id);
      toast.success(
        "Early access granted! You can now purchase this deal early.",
      );
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGettingEarlyAccess(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDealPrice = () => {
    if (deal?.deal_price) return deal.deal_price;
    if (
      deal?.discount_type === "percentage" &&
      deal?.discount_value &&
      product?.price
    ) {
      return product.price * (1 - deal.discount_value / 100);
    }
    if (
      deal?.discount_type === "fixed" &&
      deal?.discount_value &&
      product?.price
    ) {
      return product.price - deal.discount_value;
    }
    return product?.price || 0;
  };

  const getOriginalPrice = () => {
    return product?.price || 0;
  };

  const getSavings = () => {
    const original = getOriginalPrice();
    const dealPrice = getDealPrice();
    return original - dealPrice;
  };

  const getSavingsPercent = () => {
    const original = getOriginalPrice();
    const savings = getSavings();
    if (original === 0) return 0;
    return Math.round((savings / original) * 100);
  };

  const getUrgencyColor = () => {
    if (!status) return "text-gray-400";
    switch (status.urgency_level?.color) {
      case "green":
        return "text-green-500";
      case "yellow":
        return "text-yellow-500";
      case "red":
        return "text-red-500 animate-pulse";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
        <p className="text-muted-foreground mb-4">
          This deal doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/deals")}>Browse Deals</Button>
      </div>
    );
  }

  const isActive = status?.is_active === true;
  const isSoldOut = status?.stock_remaining === 0;
  const isLowStock =
    status?.stock_remaining &&
    status.stock_remaining <= 10 &&
    status.stock_remaining > 0;
  const hasReachedLimit =
    (status?.user_claims_count || 0) >= (deal.per_user_limit || 999);
  const canEarlyAccess =
    deal.points_required_for_early_access &&
    userPoints >= deal.points_required_for_early_access &&
    new Date(deal.starts_at) > new Date();
  const canRevive = status?.can_revive === true;
  const dealPrice = getDealPrice();
  const savings = getSavings();
  const savingsPercent = getSavingsPercent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/deals")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deals
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Product Image */}
            <div>
              <Card className="overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur">
                <div className="aspect-square flex items-center justify-center p-8">
                  {deal.featured_image_url || product?.images?.[0] ? (
                    <img
                      src={deal.featured_image_url || product?.images?.[0]}
                      alt={deal.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center">
                      <Package className="h-24 w-24 text-purple-400" />
                    </div>
                  )}
                </div>
              </Card>

              {/* Live Ticker */}
              {deal.show_claim_ticker && ticker.length > 0 && (
                <Card className="mt-4 bg-black/30 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">
                        Recent Claims
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {ticker.slice(0, 8).map((item, idx) => (
                        <div key={idx} className="text-sm text-purple-300">
                          🎉 {item.user_name} claimed {item.quantity}x
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Deal Details */}
            <div className="space-y-6">
              {/* Deal Type Badge */}
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                  {deal.deal_type === "discount" && (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {deal.deal_type === "bogo" && (
                    <Package className="h-3 w-3 mr-1" />
                  )}
                  {deal.deal_type === "free_gift" && (
                    <Gift className="h-3 w-3 mr-1" />
                  )}
                  {deal.deal_type === "mystery" && (
                    <Eye className="h-3 w-3 mr-1" />
                  )}
                  {deal.deal_type === "flash_sale" && (
                    <Zap className="h-3 w-3 mr-1" />
                  )}
                  {deal.deal_type.toUpperCase()} DEAL
                </Badge>
                {deal.bonus_points_per_purchase > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Coins className="h-3 w-3" />+
                    {deal.bonus_points_per_purchase} pts
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold">{deal.name}</h1>
              <p className="text-muted-foreground">{deal.description}</p>

              {/* Countdown Timer */}
              {isActive && deal.show_countdown && status && (
                <Card
                  className={cn(
                    "border-2",
                    status.urgency_level?.color === "red"
                      ? "border-red-500"
                      : "border-purple-500/30",
                  )}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className={cn("h-5 w-5", getUrgencyColor())} />
                      <span className={cn("font-medium", getUrgencyColor())}>
                        {status.urgency_level?.message}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-4xl font-mono font-bold",
                        getUrgencyColor(),
                      )}
                    >
                      {status.time_remaining_formatted}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stock Meter */}
              {isActive &&
                deal.show_stock_counter &&
                status?.stock_remaining !== null && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Stock Remaining</span>
                        <span
                          className={isLowStock ? "text-red-500 font-bold" : ""}
                        >
                          {status.stock_remaining} / {deal.total_quantity}
                        </span>
                      </div>
                      <Progress
                        value={status.stock_percentage}
                        className="h-2"
                      />
                      {isLowStock && (
                        <div className="flex items-center justify-center gap-1 mt-2 text-red-500 animate-pulse">
                          <Flame className="h-4 w-4" />
                          <span className="text-sm font-bold">
                            ALMOST GONE!
                          </span>
                        </div>
                      )}
                      {isSoldOut && (
                        <div className="flex items-center justify-center gap-1 mt-2 text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-bold">SOLD OUT</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Deal-specific Display */}
              {deal.deal_type === "discount" && product && (
                <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600">
                        {deal.discount_type === "percentage"
                          ? `${deal.discount_value}% OFF`
                          : `KES ${deal.discount_value?.toLocaleString()} OFF`}
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-2">
                        <span className="text-lg line-through text-muted-foreground">
                          {formatPrice(getOriginalPrice())}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(dealPrice)}
                        </span>
                      </div>
                      <Badge className="mt-2 bg-green-500 text-white">
                        Save {formatPrice(savings)} ({savingsPercent}% OFF)
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {deal.deal_type === "bogo" && deal.bogo_config && (
                <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                  <CardContent className="pt-6 text-center">
                    <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-lg font-bold">
                      Buy {deal.bogo_config.buy_quantity}, Get{" "}
                      {deal.bogo_config.get_quantity}{" "}
                      {deal.bogo_config.get_discount_percent === 100
                        ? "FREE"
                        : `at ${deal.bogo_config.get_discount_percent}% OFF`}
                    </p>
                  </CardContent>
                </Card>
              )}

              {deal.deal_type === "free_gift" && deal.free_gift_config && (
                <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                  <CardContent className="pt-6 text-center">
                    <Gift className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-lg font-bold">
                      Free Gift on orders over KES{" "}
                      {deal.free_gift_config.min_purchase_amount?.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}

              {deal.deal_type === "mystery" &&
                !deal.mystery_config?.revealed_at && (
                  <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 animate-pulse">
                    <CardContent className="pt-6 text-center">
                      <Eye className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                      <p className="text-xl font-bold text-orange-500">
                        ??? MYSTERY DEAL ???
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Product and price hidden until revealed live!
                      </p>
                      {deal.mystery_config?.hidden_price && (
                        <p className="text-xs text-orange-400 mt-2">
                          Minimum value: KES{" "}
                          {deal.mystery_config.hidden_price.toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Early Access */}
              {canEarlyAccess && (
                <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardContent className="pt-6 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">Get Early Access!</p>
                    <p className="text-sm opacity-90 mb-3">
                      Be the first to claim this deal before everyone else
                    </p>
                    <Button
                      variant="secondary"
                      onClick={handleEarlyAccess}
                      disabled={gettingEarlyAccess}
                      className="w-full"
                    >
                      {gettingEarlyAccess ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Coins className="h-4 w-4 mr-2" />
                      )}
                      Spend {deal.points_required_for_early_access} points for
                      early access
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Revival Section */}
              {canRevive && (
                <Card className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <CardContent className="pt-6 text-center">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">Missed the deal?</p>
                    <p className="text-sm opacity-90 mb-3">
                      Revive it for {deal.revive_duration_minutes} minutes using
                      points
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleRevive}
                      disabled={reviving}
                      className="w-full"
                    >
                      {reviving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Coins className="h-4 w-4 mr-2" />
                      )}
                      Revive for {deal.points_to_revive} points
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Claim Button */}
              {isActive && !isSoldOut && !hasReachedLimit && (
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
                  onClick={handleClaimDeal}
                  disabled={claiming}
                >
                  {claiming ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 mr-2" />
                  )}
                  Claim Deal Now
                </Button>
              )}

              {hasReachedLimit && (
                <Button size="lg" className="w-full" disabled>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  You've reached your limit for this deal
                </Button>
              )}

              {isSoldOut && (
                <Button size="lg" className="w-full" variant="outline" disabled>
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Sold Out
                </Button>
              )}

              {/* User Limit Info */}
              {status && status.user_claims_count > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  You've claimed {status.user_claims_count} /{" "}
                  {deal.per_user_limit} of this deal
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
