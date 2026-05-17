// app/bundles/live/[bundleId]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Star,
  Crown,
  Package,
  RefreshCw,
  TrendingUp,
  Sparkles,
  Clock,
  Users,
  Coins,
  Zap,
  ShoppingBag,
  Eye,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Bundle, LivePurchase, LiveStats } from "@/types/bundles";

const BUNDLE_COLORS = {
  mystery: "from-purple-600 to-pink-600",
  curated: "from-amber-500 to-yellow-500",
  build_own: "from-blue-500 to-cyan-500",
  tiered: "from-green-500 to-emerald-500",
  subscription: "from-indigo-500 to-purple-500",
  bonus_points: "from-yellow-500 to-orange-500",
};

export default function LiveBundlePage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const { supabase } = useAuth();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<LivePurchase[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    viewers: 0,
    purchases: 0,
    total_sold: 0,
    remaining_stock: 0,
    stock_percentage: 100,
  });
  const [isMysteryRevealed, setIsMysteryRevealed] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastPurchase, setLastPurchase] = useState<LivePurchase | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bundleService = new BundleService(supabase);

  // Load bundle data
  const loadBundle = useCallback(async () => {
    try {
      const data = await bundleService.getBundleById(bundleId);
      if (data) {
        setBundle(data);
        setIsMysteryRevealed(data.is_mystery_revealed || false);

        // Update stats
        setLiveStats((prev) => ({
          ...prev,
          remaining_stock: data.remaining_count ?? 0,
          total_sold: data.current_purchases ?? 0,
          stock_percentage: data.total_available
            ? ((data.remaining_count ?? 0) / data.total_available) * 100
            : 100,
        }));
      }
    } catch (error) {
      console.error("Error loading bundle:", error);
    } finally {
      setLoading(false);
    }
  }, [bundleId, bundleService]);

  // Load recent purchases
  const loadPurchases = useCallback(async () => {
    const { data } = await supabase
      .from("bundle_purchases")
      .select(
        `
        id,
        quantity,
        final_price,
        created_at,
        users:user_id (full_name)
      `,
      )
      .eq("bundle_id", bundleId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      const formattedPurchases = data.map((p) => ({
        id: p.id,
        user_name: p.users?.full_name || "Someone",
        quantity: p.quantity || 1,
        final_price: p.final_price,
        created_at: p.created_at,
      }));
      setPurchases(formattedPurchases);
      setLiveStats((prev) => ({
        ...prev,
        purchases: formattedPurchases.length,
        total_sold: formattedPurchases.reduce((sum, p) => sum + p.quantity, 0),
      }));
    }
  }, [bundleId, supabase]);

  // Setup real-time subscriptions with error handling and cleanup
  useEffect(() => {
    if (!bundleId) return;

    let isMounted = true;
    let purchaseChannel: any = null;
    let bundleChannel: any = null;
    let presenceChannel: any = null;
    let subscriptionAttempts = 0;
    const MAX_SUBSCRIPTION_ATTEMPTS = 3;

    // First load data
    loadBundle();
    loadPurchases();

    // Refresh purchases every 10 seconds (polling fallback)
    const interval = setInterval(() => {
      if (isMounted) {
        loadPurchases();
      }
    }, 10000);

    // Setup real-time subscription with retry logic
    const setupSubscriptions = async (attempt = 0) => {
      if (!isMounted) return;

      try {
        // 1. Channel for purchases
        purchaseChannel = supabase.channel(`bundle-purchases-${bundleId}`).on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bundle_purchases",
            filter: `bundle_id=eq.${bundleId}`,
          },
          async (payload) => {
            if (!isMounted) return;

            // Fetch user name separately
            let userName = "Someone";
            try {
              const { data: user } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", payload.new.user_id)
                .maybeSingle();
              userName = user?.full_name || "Someone";
            } catch (userError) {
              // Silently fail - use default name
            }

            const newPurchase = {
              id: payload.new.id,
              user_name: userName,
              quantity: payload.new.quantity || 1,
              final_price: payload.new.final_price,
              created_at: payload.new.created_at,
            };

            setPurchases((prev) => [newPurchase, ...prev.slice(0, 19)]);
            setLastPurchase(newPurchase);

            // Play purchase sound
            if (isSoundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }

            setTimeout(() => {
              if (isMounted) setLastPurchase(null);
            }, 3000);
          },
        );

        // 2. Channel for bundle updates
        bundleChannel = supabase.channel(`bundle-updates-${bundleId}`).on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bundles",
            filter: `id=eq.${bundleId}`,
          },
          (payload) => {
            if (!isMounted) return;

            if (
              payload.new.is_mystery_revealed !==
              payload.old.is_mystery_revealed
            ) {
              setIsMysteryRevealed(true);
              loadBundle();
            }
            if (payload.new.remaining_count !== payload.old.remaining_count) {
              setLiveStats((prev) => ({
                ...prev,
                remaining_stock: payload.new.remaining_count ?? 0,
                stock_percentage: bundle?.total_available
                  ? ((payload.new.remaining_count ?? 0) /
                      (bundle?.total_available || 1)) *
                    100
                  : 100,
              }));
            }
          },
        );

        // 3. Presence channel for viewer count (only if not already connected)
        if (!presenceChannel) {
          presenceChannel = supabase.channel(
            `bundle-live-viewers-${bundleId}`,
            {
              config: {
                presence: {
                  key: `viewer-${Math.random().toString(36).substring(2, 9)}`,
                },
              },
            },
          );

          presenceChannel
            .on("presence", { event: "sync" }, () => {
              if (!isMounted) return;
              const state = presenceChannel.presenceState();
              const viewerCount = Object.keys(state).length;
              setLiveStats((prev) => ({
                ...prev,
                viewers: viewerCount,
              }));
            })
            .on("presence", { event: "join" }, () => {
              if (!isMounted) return;
              const state = presenceChannel.presenceState();
              setLiveStats((prev) => ({
                ...prev,
                viewers: Object.keys(state).length,
              }));
            })
            .on("presence", { event: "leave" }, () => {
              if (!isMounted) return;
              const state = presenceChannel.presenceState();
              setLiveStats((prev) => ({
                ...prev,
                viewers: Object.keys(state).length,
              }));
            });
        }

        // Subscribe with timeout
        const subscribeWithTimeout = (channel: any, timeout = 10000) => {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              reject(new Error("Subscription timeout"));
            }, timeout);

            channel.subscribe((status: string) => {
              clearTimeout(timer);
              if (status === "SUBSCRIBED") {
                resolve(true);
              } else if (status === "CHANNEL_ERROR") {
                reject(new Error("Channel error"));
              }
            });
          });
        };

        // Attempt to subscribe
        try {
          await Promise.all([
            subscribeWithTimeout(purchaseChannel),
            subscribeWithTimeout(bundleChannel),
          ]);
          console.log("✅ Real-time subscriptions active");
        } catch (subError) {
          console.warn("Subscription failed:", subError);
          // Don't retry if we've exceeded attempts
          if (attempt < MAX_SUBSCRIPTION_ATTEMPTS) {
            setTimeout(() => setupSubscriptions(attempt + 1), 5000);
          }
        }

        // Track presence separately
        if (presenceChannel && presenceChannel.state !== "joined") {
          try {
            await subscribeWithTimeout(presenceChannel);
            await presenceChannel.track({
              user_id: `viewer_${Math.random().toString(36).substring(2, 9)}`,
              online_at: new Date().toISOString(),
            });
            console.log("✅ Presence tracking active");
          } catch (presenceError) {
            console.warn("Presence tracking failed:", presenceError);
          }
        }
      } catch (error) {
        console.warn("Failed to setup subscriptions:", error);
        if (attempt < MAX_SUBSCRIPTION_ATTEMPTS && isMounted) {
          setTimeout(() => setupSubscriptions(attempt + 1), 5000);
        }
      }
    };

    // Start subscriptions
    setupSubscriptions();

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(interval);

      const cleanupChannel = (channel: any, name: string) => {
        if (channel) {
          try {
            channel.unsubscribe();
          } catch (e) {
            console.warn(`Error unsubscribing ${name}:`, e);
          }
        }
      };

      cleanupChannel(purchaseChannel, "purchase");
      cleanupChannel(bundleChannel, "bundle");
      cleanupChannel(presenceChannel, "presence");
    };
  }, [
    bundleId,
    supabase,
    loadBundle,
    loadPurchases,
    isSoundEnabled,
    bundle?.total_available,
  ]);

  // Countdown timer for bundle end
  useEffect(() => {
    if (!bundle?.ends_at) return;

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(bundle.ends_at!);
      if (end > now) {
        setCountdown(formatDistanceToNowStrict(end, { addSuffix: true }));
      } else {
        setCountdown("Ended");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [bundle?.ends_at]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTimeRemaining = () => {
    if (!bundle?.ends_at) return null;
    const end = new Date(bundle.ends_at);
    if (end < new Date()) return "Ended";
    return formatDistanceToNowStrict(end);
  };

  const bundleConfig =
    BUNDLE_COLORS[bundle?.bundle_type as keyof typeof BUNDLE_COLORS] ||
    "from-purple-600 to-pink-600";
  const timeRemaining = getTimeRemaining();
  const isLowStock =
    liveStats.stock_percentage < 20 && liveStats.stock_percentage > 0;
  const isSoldOut = liveStats.remaining_stock === 0;

  // Helper to safely extract products array from bundle, handling both old and new formats
  const getProductsArray = useCallback((bundle: Bundle | null): any[] => {
    // Safety check - if bundle is null or undefined
    if (!bundle || !bundle.products) return [];

    // If it's already an array (for backward compatibility)
    if (Array.isArray(bundle.products)) {
      return bundle.products;
    }

    // Handle the object structure from your admin save
    const productsObj = bundle.products as any;

    if (productsObj.type === "curated" && productsObj.items) {
      return productsObj.items;
    }

    if (productsObj.type === "tiered" && productsObj.items) {
      return productsObj.items;
    }

    if (productsObj.type === "subscription" && productsObj.items) {
      return productsObj.items;
    }

    if (productsObj.type === "bonus_points" && productsObj.items) {
      return productsObj.items;
    }

    if (productsObj.type === "mystery" && productsObj.product_pool) {
      // For mystery bundles, show product pool or placeholder
      return productsObj.product_pool.map((productId: string) => ({
        product_id: productId,
        quantity: productsObj.quantity || 1,
        is_mystery: true,
      }));
    }

    if (productsObj.type === "build_own") {
      // Build your own doesn't have fixed products
      return [];
    }

    return [];
  }, []);

  // Then call it safely only when bundle exists
  const productItems = bundle ? getProductsArray(bundle) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-white">Loading live stream...</p>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Bundle Not Found
          </h2>
          <p className="text-purple-300">This bundle is no longer available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden"
    >
      {/* Audio for purchase notifications */}
      <audio ref={audioRef} src="/sounds/purchase-chime.mp3" preload="auto" />

      {/* OBS Metadata (hidden, for stream overlays) */}
      <div className="hidden obs-metadata">
        <div data-title={bundle.name} />
        <div data-type={bundle.bundle_type} />
        <div data-price={bundle.base_price} />
        <div data-stock={liveStats.remaining_stock} />
        <div data-viewers={liveStats.viewers} />
        <div data-purchases={liveStats.purchases} />
      </div>

      {/* Main Live Display */}
      <div className="relative min-h-screen">
        {/* Header Banner */}
        <div
          className={cn("bg-gradient-to-r py-4 px-6 text-white", bundleConfig)}
        >
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="h-4 w-4 text-white animate-pulse" />
                  <span className="text-xs font-mono tracking-wider">
                    LIVE STREAM
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {bundle.name}
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  {bundle.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Fullscreen Button */}
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
                {/* Sound Toggle */}
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
        <div className="bg-black/50 backdrop-blur border-b border-white/10">
          <div className="container mx-auto px-6 py-3">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-mono">LIVE</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Eye className="h-4 w-4" />
                  <span className="font-mono">{liveStats.viewers}</span>
                  <span>watching</span>
                </div>
                {timeRemaining && (
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{timeRemaining} remaining</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="font-mono">{liveStats.purchases}</span>
                  <span>claims</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="font-mono">{liveStats.total_sold}</span>
                  <span>items sold</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Bundle Display - Center/Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bundle Hero Card */}
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
                <div className="p-6">
                  {/* Bundle Type Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge
                      className={cn(
                        "bg-gradient-to-r text-white border-0",
                        bundleConfig,
                      )}
                    >
                      {bundle.bundle_type === "mystery" && (
                        <Gift className="h-3 w-3 mr-1" />
                      )}
                      {bundle.bundle_type === "curated" && (
                        <Crown className="h-3 w-3 mr-1" />
                      )}
                      {bundle.bundle_type === "build_own" && (
                        <Package className="h-3 w-3 mr-1" />
                      )}
                      {bundle.bundle_type === "tiered" && (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      )}
                      {bundle.bundle_type === "subscription" && (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      {bundle.bundle_type === "bonus_points" && (
                        <Star className="h-3 w-3 mr-1" />
                      )}
                      {bundle.bundle_type.replace("_", " ").toUpperCase()}
                    </Badge>

                    {bundle.is_live_exclusive && (
                      <Badge className="bg-red-500 text-white gap-1 animate-pulse">
                        <Zap className="h-3 w-3" />
                        STREAM EXCLUSIVE
                      </Badge>
                    )}
                  </div>

                  {/* Price Display */}
                  <div className="text-center mb-6">
                    {bundle.discounted_price ? (
                      <>
                        <div className="text-5xl font-bold text-white">
                          {formatPrice(bundle.discounted_price)}
                        </div>
                        <div className="text-lg text-purple-300 line-through">
                          {formatPrice(bundle.base_price)}
                        </div>
                        <Badge className="mt-2 bg-green-500 text-white">
                          Save{" "}
                          {Math.round(
                            ((bundle.base_price - bundle.discounted_price) /
                              bundle.base_price) *
                              100,
                          )}
                          %
                        </Badge>
                      </>
                    ) : (
                      <div className="text-5xl font-bold text-white">
                        {formatPrice(bundle.base_price)}
                      </div>
                    )}
                  </div>

                  {/* Stock Meter */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-300">Stock Remaining</span>
                      <span
                        className={cn(
                          "font-bold",
                          isLowStock ? "text-orange-400" : "text-white",
                        )}
                      >
                        {liveStats.remaining_stock} /{" "}
                        {bundle.total_available || "∞"}
                      </span>
                    </div>
                    <Progress
                      value={liveStats.stock_percentage}
                      className="h-3 bg-purple-950"
                    />
                    {isLowStock && !isSoldOut && (
                      <p className="text-orange-400 text-xs mt-2 flex items-center gap-1 animate-pulse">
                        <AlertCircle className="h-3 w-3" />
                        Almost gone! Only {liveStats.remaining_stock} left!
                      </p>
                    )}
                    {isSoldOut && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        SOLD OUT! This bundle is no longer available.
                      </p>
                    )}
                  </div>

                  {/* Bonus Points Display */}
                  {bundle.bonus_points > 0 && (
                    <div className="mb-6 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold">
                          Earn {bundle.bonus_points} Bonus Points!
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Purchase Button Overlay (for stream host to click) */}
                  <Button
                    size="lg"
                    className={cn(
                      "w-full bg-gradient-to-r text-white font-bold py-6 text-lg",
                      bundleConfig,
                    )}
                    disabled={isSoldOut}
                    onClick={() =>
                      window.open(`/bundles/${bundleId}`, "_blank")
                    }
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    {isSoldOut ? "SOLD OUT" : "CLAIM THIS BUNDLE →"}
                  </Button>
                </div>
              </Card>

              {/* Bundle Contents Preview */}
              {bundle && (
                <Card className="bg-black/30 backdrop-blur border-white/10 px-2">
                  {/* Products Display */}
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      What's Inside
                    </h3>

                    {bundle.bundle_type === "mystery" &&
                    !bundle.is_mystery_revealed ? (
                      <div className="text-center py-8 bg-white/5 rounded-lg">
                        <Gift className="h-10 w-10 text-purple-400 mx-auto mb-2 animate-pulse" />
                        <p className="text-purple-300">
                          Mystery Bundle - Contents Hidden
                        </p>
                        {bundle.mystrey_min_value && (
                          <p className="text-sm text-purple-400/70 mt-1">
                            Minimum value: KSH{" "}
                            {bundle.mystrey_min_value.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : bundle.bundle_type === "build_own" ? (
                      <div className="text-center py-6 bg-white/5 rounded-lg">
                        <Package className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-white">Build Your Own Bundle</p>
                        <p className="text-xs text-purple-300">
                          Choose {bundle.min_items_to_select}-
                          {bundle.max_items_to_select} items
                        </p>
                      </div>
                    ) : productItems.length === 0 ? (
                      <div className="text-center py-8 bg-white/5 rounded-lg">
                        <Package className="h-8 w-8 text-purple-400 mx-auto mb-2 opacity-50" />
                        <p className="text-purple-300">
                          No products in this bundle
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {productItems
                          .slice(0, 8)
                          .map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <Package className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                              <p className="text-xs text-white truncate">
                                {item.product_name ||
                                  item.name ||
                                  item.product_id?.slice(0, 8) ||
                                  `Item ${idx + 1}`}
                              </p>
                              <p className="text-xs text-purple-300">
                                x{item.quantity || 1}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Live Ticker - Right Sidebar */}
            <div className="space-y-6">
              {/* Last Purchase Alert */}
              {lastPurchase && (
                <div className="animate-in fade-in slide-in-from-top duration-300">
                  <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {lastPurchase.user_name} just claimed!
                          </p>
                          <p className="text-sm text-green-300">
                            {formatPrice(lastPurchase.final_price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Live Claims Ticker */}
              <Card className="bg-black/50 backdrop-blur border-purple-500/30 h-[500px] flex flex-col">
                <div className="p-4 border-b border-purple-500/30">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    Live Claims
                    <Badge variant="outline" className="ml-2 text-purple-300">
                      {liveStats.purchases} total
                    </Badge>
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {purchases.length === 0 ? (
                    <div className="text-center py-8 text-purple-300">
                      <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Waiting for first claim...</p>
                    </div>
                  ) : (
                    purchases.map((purchase, idx) => (
                      <div
                        key={purchase.id}
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
                            {purchase.user_name}
                          </p>
                          <p className="text-xs text-purple-300">
                            claimed {purchase.quantity} bundle
                            {purchase.quantity !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-400 font-mono">
                            {formatPrice(purchase.final_price)}
                          </p>
                          <p className="text-xs text-purple-400">
                            {new Date(purchase.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Hot Streak Counter */}
              {liveStats.purchases > 5 && (
                <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Zap className="h-5 w-5 text-orange-400" />
                      <span className="text-orange-400 font-bold">
                        HOT STREAK!
                      </span>
                    </div>
                    <p className="text-white text-sm">
                      {liveStats.purchases} claims in the last hour!
                    </p>
                  </div>
                </Card>
              )}

              {/* Call to Action Overlay */}
              <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
                <div className="p-4 text-center">
                  <Gift className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-white font-bold">Limited Time!</h3>
                  <p className="text-sm text-white/80">
                    {countdown || "Get it before it's gone!"}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Scrolling Ticker Bar - Bottom */}
        {purchases.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-t border-purple-500/30 py-2 overflow-hidden">
            <div className="whitespace-nowrap animate-marquee">
              {purchases.slice(0, 15).map((purchase, idx) => (
                <span
                  key={idx}
                  className="inline-block mx-4 text-sm text-white"
                >
                  🎉 {purchase.user_name} just claimed {bundle.name}! 🎉
                </span>
              ))}
              {/* Duplicate for seamless loop */}
              {purchases.slice(0, 15).map((purchase, idx) => (
                <span
                  key={`dup-${idx}`}
                  className="inline-block mx-4 text-sm text-white"
                >
                  🎉 {purchase.user_name} just claimed {bundle.name}! 🎉
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
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
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
