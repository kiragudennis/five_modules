// app/(store)/deals/live/[dealId]/page.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { DealsService } from "@/lib/services/deals-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Clock,
  Package,
  Gift,
  Eye,
  Coins,
  TrendingDown,
  AlertTriangle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Users,
  ShoppingBag,
  Flame,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Deal } from "@/types/deals";

interface DealStatus {
  is_active: boolean;
  time_remaining_ms: number;
  time_remaining_formatted: string;
  urgency_level: { color: string; message: string; threshold_minutes: number };
  stock_remaining: number | null;
  stock_percentage: number;
  can_claim: boolean;
}

interface TickerEntry {
  id: string;
  user_name: string;
  quantity: number;
  claimed_at: string;
}

type UrgencyState = "green" | "yellow" | "red";

export default function DealLivePage() {
  const { dealId } = useParams<{ dealId: string }>();
  const { supabase } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState<DealStatus | null>(null);
  const [ticker, setTicker] = useState<TickerEntry[]>([]);
  const [urgencyState, setUrgencyState] = useState<UrgencyState>("green");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastClaim, setLastClaim] = useState<TickerEntry | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dealsService = new DealsService(supabase);

  const loadData = useCallback(async () => {
    if (!dealId) return;

    // Fetch deal details
    const { data: dealData } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();
    setDeal(dealData);

    // Get deal status
    const dealStatus = await dealsService.getDealStatus(dealId);
    setStatus(dealStatus);

    // Update urgency state based on time remaining
    if (dealStatus) {
      const minutesLeft = dealStatus.time_remaining_ms / (1000 * 60);
      if (minutesLeft <= 1) {
        setUrgencyState("red");
      } else if (minutesLeft <= 5) {
        setUrgencyState("yellow");
      } else {
        setUrgencyState("green");
      }
    }

    // Get live ticker
    const tickerData = await dealsService.getLiveTicker(dealId, 30);
    setTicker(tickerData);
  }, [dealId, supabase, dealsService]);

  // Real-time subscriptions
  useEffect(() => {
    if (!dealId) return;

    // Subscribe to deal changes
    const dealChannel = supabase
      .channel(`deal-live-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deals",
          filter: `id=eq.${dealId}`,
        },
        () => {
          loadData();
        },
      )
      .subscribe();

    // Subscribe to new claims
    const claimsChannel = supabase
      .channel(`deal-claims-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_claims",
          filter: `deal_id=eq.${dealId}`,
        },
        async (payload) => {
          // Fetch user name
          const { data: user } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", payload.new.user_id)
            .single();

          const newClaim = {
            id: payload.new.id,
            user_name: user?.full_name || "Someone",
            quantity: payload.new.quantity,
            claimed_at: payload.new.claimed_at,
          };

          setTicker((prev) => [newClaim, ...prev.slice(0, 49)]);
          setLastClaim(newClaim);

          // Play sound for new claim
          if (isSoundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }

          // Auto-hide last claim after 3 seconds
          setTimeout(() => setLastClaim(null), 3000);

          // Refresh status for stock update
          loadData();
        },
      )
      .subscribe();

    loadData();

    // Refresh every second for countdown
    const interval = setInterval(loadData, 1000);

    // Refresh ticker every 5 seconds
    const tickerInterval = setInterval(() => {
      dealsService.getLiveTicker(dealId, 30).then(setTicker);
    }, 5000);

    return () => {
      dealChannel.unsubscribe();
      claimsChannel.unsubscribe();
      clearInterval(interval);
      clearInterval(tickerInterval);
    };
  }, [dealId, supabase, dealsService, loadData, isSoundEnabled]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const getUrgencyStyles = () => {
    switch (urgencyState) {
      case "red":
        return {
          timerColor: "text-red-500",
          timerBg: "bg-red-500/20",
          borderColor: "border-red-500",
          glow: "shadow-red-500/50",
          pulse: "animate-pulse",
        };
      case "yellow":
        return {
          timerColor: "text-yellow-500",
          timerBg: "bg-yellow-500/20",
          borderColor: "border-yellow-500",
          glow: "shadow-yellow-500/30",
          pulse: "",
        };
      default:
        return {
          timerColor: "text-green-500",
          timerBg: "bg-green-500/20",
          borderColor: "border-green-500/30",
          glow: "",
          pulse: "",
        };
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
    if (!deal) return 0;
    if (deal.deal_price) return deal.deal_price;
    return 0;
  };

  const urgencyStyles = getUrgencyStyles();
  const isLowStock =
    status?.stock_remaining &&
    status.stock_remaining <= 10 &&
    status.stock_remaining > 0;
  const isSoldOut = status?.stock_remaining === 0;

  if (!deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-white">Loading live display...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden"
    >
      {/* Audio for new claims */}
      <audio ref={audioRef} src="/sounds/claim-chime.mp3" preload="auto" />

      {/* OBS Metadata */}
      <div className="hidden obs-metadata">
        <div data-title={deal.name} />
        <div data-type={deal.deal_type} />
        <div data-status={deal.status} />
        <div data-stock={status?.stock_remaining} />
        <div data-claims={ticker.length} />
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-4 px-6 text-white">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="h-4 w-4 animate-pulse" />
                <span className="text-xs font-mono tracking-wider">
                  LIVE DEAL BROADCAST
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{deal.name}</h1>
              <p className="text-white/80 text-sm mt-1">{deal.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats Bar */}
      <div className="bg-black/50 backdrop-blur border-b border-white/10 py-3 px-6">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-mono">LIVE</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Users className="h-4 w-4" />
                <span className="font-mono">{ticker.length}</span>
                <span>claims</span>
              </div>
              {deal.bonus_points_per_purchase > 0 && (
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Coins className="h-4 w-4" />
                  <span>+{deal.bonus_points_per_purchase} pts per claim</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Tag className="h-4 w-4" />
              <span className="capitalize">
                {deal.deal_type.replace("_", " ")} Deal
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Center/Left - Deal Display (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Deal Card */}
            <Card
              className={cn(
                "bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-2 transition-all duration-300",
                urgencyStyles.borderColor,
                urgencyStyles.glow,
              )}
            >
              <CardContent className="p-8 text-center">
                {/* Deal Type Badge */}
                <Badge
                  className={cn(
                    "mb-4 bg-gradient-to-r text-white border-0",
                    urgencyState === "red"
                      ? "from-red-600 to-orange-600"
                      : "from-purple-600 to-pink-600",
                  )}
                >
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

                {/* Product Image */}
                {deal.featured_image_url && (
                  <div className="mb-6">
                    <img
                      src={deal.featured_image_url}
                      alt={deal.name}
                      className="max-h-48 mx-auto object-contain"
                    />
                  </div>
                )}

                {/* Deal Title */}
                <h2 className="text-3xl font-bold text-white mb-2">
                  {deal.name}
                </h2>
                <p className="text-purple-300 text-sm mb-6">
                  {deal.description}
                </p>

                {/* Price Display */}
                {deal.deal_type === "discount" && getDealPrice() > 0 && (
                  <div className="mb-6">
                    <div className="text-5xl font-bold text-white">
                      {formatPrice(getDealPrice())}
                    </div>
                    <div className="text-lg text-purple-300 line-through mt-1">
                      Regular price
                    </div>
                  </div>
                )}

                {deal.deal_type === "bogo" && deal.bogo_config && (
                  <div className="mb-6 p-4 rounded-lg bg-blue-500/20">
                    <Package className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-white text-lg font-bold">
                      Buy {deal.bogo_config.buy_quantity}, Get{" "}
                      {deal.bogo_config.get_quantity}{" "}
                      {deal.bogo_config.get_discount_percent === 100
                        ? "FREE"
                        : `at ${deal.bogo_config.get_discount_percent}% OFF`}
                    </p>
                  </div>
                )}

                {deal.deal_type === "free_gift" && deal.free_gift_config && (
                  <div className="mb-6 p-4 rounded-lg bg-purple-500/20">
                    <Gift className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-white text-lg font-bold">
                      Free Gift on orders over KES{" "}
                      {deal.free_gift_config.min_purchase_amount?.toLocaleString()}
                    </p>
                  </div>
                )}

                {deal.deal_type === "mystery" &&
                  !deal.mystery_config?.revealed_at && (
                    <div className="mb-6 p-4 rounded-lg bg-orange-500/20 animate-pulse">
                      <Eye className="h-10 w-10 text-orange-400 mx-auto mb-2" />
                      <p className="text-white text-xl font-bold">
                        ??? MYSTERY DEAL ???
                      </p>
                      <p className="text-orange-300 text-sm mt-1">
                        Product hidden until reveal
                      </p>
                    </div>
                  )}

                {/* Countdown Timer */}
                {deal.show_countdown && status && (
                  <div
                    className={cn("mt-6 p-4 rounded-lg", urgencyStyles.timerBg)}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock
                        className={cn("h-5 w-5", urgencyStyles.timerColor)}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          urgencyStyles.timerColor,
                        )}
                      >
                        {status.urgency_level?.message || "Limited time offer"}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-5xl font-mono font-bold",
                        urgencyStyles.timerColor,
                        urgencyState === "red" && urgencyStyles.pulse,
                      )}
                    >
                      {status.time_remaining_formatted}
                    </div>
                  </div>
                )}

                {/* Stock Meter */}
                {deal.show_stock_counter && status?.stock_remaining && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-purple-300 mb-2">
                      <span>Stock Remaining</span>
                      <span
                        className={isLowStock ? "text-red-400 font-bold" : ""}
                      >
                        {status.stock_remaining} / {deal.total_quantity}
                      </span>
                    </div>
                    <Progress
                      value={status.stock_percentage}
                      className={cn("h-3", urgencyStyles.timerBg)}
                    />
                    {isLowStock && (
                      <div className="flex items-center justify-center gap-2 mt-3 text-red-400 animate-pulse">
                        <Flame className="h-4 w-4" />
                        <span className="text-sm font-bold">
                          CRITICAL STOCK! ONLY {status.stock_remaining} LEFT!
                        </span>
                      </div>
                    )}
                    {isSoldOut && (
                      <div className="flex items-center justify-center gap-2 mt-3 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-bold">SOLD OUT!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bonus Points */}
                {deal.bonus_points_per_purchase > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400">
                    <Coins className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      Earn {deal.bonus_points_per_purchase} bonus points on each
                      claim!
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deal Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-black/30 backdrop-blur border-white/10">
                <CardContent className="pt-4 text-center">
                  <TrendingDown className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-500">
                    {deal.deal_type === "discount" && deal.discount_value
                      ? deal.discount_type === "percentage"
                        ? `${deal.discount_value}%`
                        : `KES ${deal.discount_value?.toLocaleString()}`
                      : "LIMITED"}
                  </p>
                  <p className="text-xs text-purple-300">Savings</p>
                </CardContent>
              </Card>

              <Card className="bg-black/30 backdrop-blur border-white/10">
                <CardContent className="pt-4 text-center">
                  <ShoppingBag className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-500">
                    {ticker.length}
                  </p>
                  <p className="text-xs text-purple-300">Total Claims</p>
                </CardContent>
              </Card>

              <Card className="bg-black/30 backdrop-blur border-white/10">
                <CardContent className="pt-4 text-center">
                  <Users className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-500">
                    {deal.per_user_limit}
                  </p>
                  <p className="text-xs text-purple-300">Per Customer Limit</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar - Live Claim Ticker */}
          <div className="space-y-6">
            <Card className="bg-black/50 backdrop-blur border-purple-500/30 h-[500px] flex flex-col">
              <div className="p-4 border-b border-purple-500/30">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-yellow-400" />
                  Live Claims Feed
                  <Badge variant="outline" className="ml-2 text-purple-300">
                    {ticker.length}
                  </Badge>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ticker.length === 0 ? (
                  <div className="text-center py-8 text-purple-300">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Waiting for first claim...</p>
                  </div>
                ) : (
                  ticker.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 animate-in fade-in slide-in-from-right duration-300"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-purple-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {item.user_name}
                        </p>
                        <p className="text-xs text-purple-300">
                          claimed {item.quantity}{" "}
                          {item.quantity === 1 ? "unit" : "units"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-purple-400">
                          {new Date(item.claimed_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Urgency Message Card */}
            {urgencyState === "red" && (
              <Card className="bg-gradient-to-r from-red-600 to-orange-600 border-0 animate-pulse">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-white mx-auto mb-2" />
                  <p className="text-white font-bold text-lg">FINAL MINUTE!</p>
                  <p className="text-white/80 text-sm">
                    Deal ending any moment!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
              <CardContent className="p-4 text-center">
                <ShoppingBag className="h-8 w-8 text-white mx-auto mb-2" />
                <h3 className="text-white font-bold">Want this deal?</h3>
                <p className="text-white/80 text-sm mt-1 mb-3">
                  Visit our store before it's gone!
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(`/deals/${deal.slug}`, "_blank")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Deal Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Claim Alert */}
      {lastClaim && (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50">
            <div className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {lastClaim.user_name}
                </p>
                <p className="text-xs text-green-300">
                  just claimed {lastClaim.quantity}{" "}
                  {lastClaim.quantity === 1 ? "unit" : "units"}!
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Scrolling Ticker Bar */}
      {ticker.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-t border-purple-500/30 py-2 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
            {ticker.slice(0, 30).map((item, idx) => (
              <span key={idx} className="inline-block mx-4 text-sm text-white">
                🎉 {item.user_name} claimed {item.quantity}{" "}
                {item.quantity === 1 ? "unit" : "units"}! 🎉
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {ticker.slice(0, 30).map((item, idx) => (
              <span
                key={`dup-${idx}`}
                className="inline-block mx-4 text-sm text-white"
              >
                🎉 {item.user_name} claimed {item.quantity}{" "}
                {item.quantity === 1 ? "unit" : "units"}! 🎉
              </span>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes fadeInSlideRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-in {
          animation-name: fadeInSlideRight;
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}
