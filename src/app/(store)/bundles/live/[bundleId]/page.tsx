// app/bundles/live/[bundleId]/page.tsx - Fixed and Enhanced

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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
  Mic,
  MicOff,
  PartyPopper,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Bundle, LivePurchase, LiveStats } from "@/types/bundles";
import confetti from "canvas-confetti";
import { toast } from "sonner";

const BUNDLE_COLORS = {
  mystery: "from-purple-600 to-pink-600",
  curated: "from-amber-500 to-yellow-500",
  build_own: "from-blue-500 to-cyan-500",
  tiered: "from-green-500 to-emerald-500",
  subscription: "from-indigo-500 to-purple-500",
  bonus_points: "from-yellow-500 to-orange-500",
};

// Announcement component for host to read out
const AnnouncementBanner = ({
  userName,
  action,
  prize,
}: {
  userName: string;
  action: string;
  prize?: string;
}) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
  >
    <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 shadow-2xl">
      <div className="text-center">
        <PartyPopper className="h-8 w-8 mx-auto mb-2" />
        <p className="text-lg font-bold">
          🎉 {userName} {action}! 🎉
        </p>
        {prize && <p className="text-sm mt-1">Won: {prize}</p>}
        <p className="text-xs mt-2 opacity-90">
          Shout out to {userName.split(" ")[0]}!
        </p>
      </div>
    </Card>
  </motion.div>
);

// Hot streak notification
const HotStreakNotification = ({ count }: { count: number }) => (
  <motion.div
    initial={{ x: 100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 100, opacity: 0 }}
    className="fixed bottom-24 right-4 z-50"
  >
    <Card className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 animate-pulse" />
        <div>
          <p className="font-bold text-sm">HOT STREAK! 🔥</p>
          <p className="text-xs">{count} claims in the last 10 minutes!</p>
        </div>
      </div>
    </Card>
  </motion.div>
);

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
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastPurchase, setLastPurchase] = useState<LivePurchase | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState<any>(null);
  const [showHotStreak, setShowHotStreak] = useState(false);
  const [recentClaims, setRecentClaims] = useState<number[]>([]);
  const [hostSpeaking, setHostSpeaking] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bundleService = new BundleService(supabase);

  // Time remaining calculation
  const getTimeRemaining = useCallback(() => {
    if (!bundle?.ends_at) return null;
    const end = new Date(bundle.ends_at);
    if (end < new Date()) return "Ended";
    return formatDistanceToNowStrict(end);
  }, [bundle?.ends_at]);

  const timeRemaining = getTimeRemaining();
  const isLowStock =
    liveStats.stock_percentage < 20 && liveStats.stock_percentage > 0;
  const isSoldOut = liveStats.remaining_stock === 0;

  // Enhanced helper to fetch product details from product_pool
  const fetchProductImages = useCallback(async () => {
    if (!bundle?.products) return [];

    let productIds: string[] = [];

    // Handle different bundle types
    if (
      bundle.bundle_type === "build_own" &&
      bundle.products.product_pool &&
      bundle.products.product_pool.length > 0
    ) {
      productIds = bundle.products.product_pool;
    } else if (bundle.bundle_type === "curated" && bundle.products.items) {
      productIds = bundle.products.items.map((item: any) => item.product_id);
    } else if (
      bundle.bundle_type === "mystery" &&
      bundle.products.product_pool
    ) {
      productIds = bundle.products.product_pool;
    } else if (bundle.bundle_type === "tiered" && bundle.products.items) {
      productIds = bundle.products.items.map((item: any) => item.product_id);
    } else if (bundle.bundle_type === "subscription" && bundle.products.items) {
      productIds = bundle.products.items.map((item: any) => item.product_id);
    }

    if (productIds.length === 0) return [];

    // Fetch product images
    const { data: products } = await supabase
      .from("products")
      .select("id, name, images, price")
      .in("id", productIds.slice(0, 12));

    if (products) {
      const images = products
        .filter((p) => p.images?.[0])
        .map((p) => p.images[0]);
      setProductImages(images);
      return images;
    }
    return [];
  }, [bundle, supabase]);

  // Auto-rotate product images for visual interest
  useEffect(() => {
    if (productImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [productImages]);

  // Helper to get readable product names for host
  const getProductNames = useCallback(() => {
    if (!bundle?.products) return "items";

    // For build-your-own with product pool
    if (
      bundle.bundle_type === "build_own" &&
      bundle.eligible_product_ids &&
      bundle.eligible_product_ids.length > 0
    ) {
      return `${bundle.eligible_product_ids.length} premium products to choose from`;
    }

    if (Array.isArray(bundle.products)) {
      return bundle.products.map((p) => p.product_name).join(", ");
    }
    if (bundle.products.items) {
      const names = bundle.products.items.map(
        (i: any) => i.product_name || `Item ${i.product_id?.slice(0, 8)}`,
      );
      return names.join(", ");
    }
    if (bundle.products.product_pool) {
      return `${bundle.products.product_pool.length} mystery items`;
    }
    return "selected items";
  }, [bundle]);

  // Load bundle data
  const loadBundle = useCallback(async () => {
    try {
      const data = await bundleService.getBundleById(bundleId);
      if (data) {
        setBundle(data);
        setLiveStats((prev) => ({
          ...prev,
          remaining_stock: data.remaining_count ?? 0,
          total_sold: data.current_purchases ?? 0,
          stock_percentage: data.total_available
            ? ((data.remaining_count ?? 0) / data.total_available) * 100
            : 100,
        }));
        await fetchProductImages();
      }
    } catch (error) {
      console.error("Error loading bundle:", error);
    } finally {
      setLoading(false);
    }
  }, [bundleId, bundleService, fetchProductImages]);

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

      // Track recent claims for hot streak detection
      const now = Date.now();
      const tenMinutesAgo = now - 10 * 60 * 1000;
      const recentCount = formattedPurchases.filter(
        (p) => new Date(p.created_at).getTime() > tenMinutesAgo,
      ).length;
      if (recentCount >= 5 && !showHotStreak) {
        setShowHotStreak(true);
        setTimeout(() => setShowHotStreak(false), 8000);
      }
    }
  }, [bundleId, supabase, showHotStreak]);

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

  // Real-time subscription
  useEffect(() => {
    if (!bundleId) return;

    let isMounted = true;
    let channel: any = null;

    const setupChannel = async () => {
      channel = supabase.channel(`bundle-live-${bundleId}`);

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bundle_purchases",
            filter: `bundle_id=eq.${bundleId}`,
          },
          async (payload: { new: any; old: any }) => {
            if (!isMounted) return;

            let userName = "Someone";
            try {
              const { data: user } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", payload.new.user_id)
                .maybeSingle();
              userName = user?.full_name || "Someone";
            } catch (userError) {}

            const newPurchase = {
              id: payload.new.id,
              user_name: userName,
              quantity: payload.new.quantity || 1,
              final_price: payload.new.final_price,
              created_at: payload.new.created_at,
            };

            setPurchases((prev) => [newPurchase, ...prev.slice(0, 19)]);
            setLastPurchase(newPurchase);

            setShowAnnouncement({
              userName,
              action: "just claimed",
              prize: `${bundle?.name} Bundle`,
            });

            if (announcementTimeoutRef.current) {
              clearTimeout(announcementTimeoutRef.current);
            }
            announcementTimeoutRef.current = setTimeout(() => {
              setShowAnnouncement(null);
            }, 5000);

            if (isSoundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }

            if (
              liveStats.purchases > 0 &&
              (liveStats.purchases + 1) % 5 === 0
            ) {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
            }

            setTimeout(() => {
              if (isMounted) setLastPurchase(null);
            }, 4000);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bundles",
            filter: `id=eq.${bundleId}`,
          },
          (payload: { new: any; old: any }) => {
            if (!isMounted) return;
            if (
              payload.new.is_mystery_revealed !==
              payload.old.is_mystery_revealed
            ) {
              setShowAnnouncement({
                userName: "MYSTERY REVEALED!",
                action: "The mystery bundle contents are now visible",
              });
              setTimeout(() => setShowAnnouncement(null), 8000);
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
        )
        .on("presence", { event: "sync" }, () => {
          if (!isMounted) return;
          const state = channel.presenceState();
          setLiveStats((prev) => ({
            ...prev,
            viewers: Object.keys(state).length,
          }));
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED" && isMounted) {
            await channel.track({
              user_id: `host_${Math.random().toString(36).substring(2, 9)}`,
              online_at: new Date().toISOString(),
              role: "host",
            });
          }
        });

      loadBundle();
      loadPurchases();
    };

    setupChannel();

    const interval = setInterval(() => {
      if (isMounted) loadPurchases();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
      if (channel) channel.unsubscribe();
    };
  }, [
    bundleId,
    supabase,
    loadBundle,
    loadPurchases,
    isSoundEnabled,
    bundle?.total_available,
    liveStats.purchases,
  ]);

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

  const bundleConfig =
    BUNDLE_COLORS[bundle?.bundle_type as keyof typeof BUNDLE_COLORS] ||
    "from-purple-600 to-pink-600";

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
      {/* Audio */}
      <audio ref={audioRef} src="/sounds/purchase-chime.mp3" preload="auto" />

      {/* Announcement Banner for Host */}
      <AnimatePresence>
        {showAnnouncement && (
          <AnnouncementBanner
            userName={showAnnouncement.userName}
            action={showAnnouncement.action}
            prize={showAnnouncement.prize}
          />
        )}
      </AnimatePresence>

      {/* Hot Streak Notification */}
      <AnimatePresence>
        {showHotStreak && <HotStreakNotification count={recentClaims.length} />}
      </AnimatePresence>

      {/* OBS Metadata */}
      <div className="hidden obs-metadata">
        <div data-title={bundle.name} />
        <div data-type={bundle.bundle_type} />
        <div data-price={bundle.base_price} />
        <div data-stock={liveStats.remaining_stock} />
        <div data-viewers={liveStats.viewers} />
        <div data-purchases={liveStats.purchases} />
        <div data-products={getProductNames()} />
      </div>

      {/* Host Speaking Indicator */}
      <button
        onClick={() => setHostSpeaking(!hostSpeaking)}
        className="fixed top-20 right-20 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        {hostSpeaking ? (
          <Mic className="h-5 w-5 text-red-500" />
        ) : (
          <MicOff className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Main Live Display */}
      <div className="relative min-h-screen">
        {/* Header Banner */}
        <div
          className={cn("bg-gradient-to-r py-4 px-6 text-white", bundleConfig)}
        >
          <div className="container mx-auto">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="h-4 w-4 text-white animate-pulse" />
                  <span className="text-xs font-mono tracking-wider">
                    LIVE STREAM
                  </span>
                  {hostSpeaking && (
                    <Badge className="bg-red-500 text-white animate-pulse ml-2">
                      <Mic className="h-3 w-3 mr-1" />
                      HOST SPEAKING
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {bundle.name}
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  {bundle.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-black/30 hover:bg-black/50"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className="p-2 rounded-full bg-black/30 hover:bg-black/50"
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
                  <Eye className="h-4 w-4" />
                  <span className="font-mono">{liveStats.viewers}</span>
                  <span>watching</span>
                </div>
                {timeRemaining && (
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Clock className="h-4 w-4" />
                    <span
                      className={isLowStock ? "text-orange-400 font-bold" : ""}
                    >
                      {timeRemaining} remaining
                    </span>
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
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Target className="h-4 w-4" />
                  <span className="font-mono">{liveStats.remaining_stock}</span>
                  <span>remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Bundle Display */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
                <div className="p-6">
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
                        CRITICAL: Only {liveStats.remaining_stock} left!
                      </p>
                    )}
                  </div>

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

                  {/* Product Image Carousel for Visual Interest */}
                  {productImages.length > 0 && (
                    <div className="mt-4 relative">
                      <div className="overflow-hidden rounded-lg">
                        <motion.img
                          key={currentImageIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                          src={productImages[currentImageIndex]}
                          alt="Product preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {productImages.slice(0, 6).map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all",
                              idx === currentImageIndex
                                ? "bg-white w-3"
                                : "bg-white/50",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Host Talking Points */}
                  <div className="mt-4 p-3 rounded-lg bg-white/10">
                    <p className="text-xs text-white/60 mb-1">
                      📢 HOST TALKING POINTS:
                    </p>
                    <ul className="text-xs text-white/80 space-y-1">
                      <li>
                        •{" "}
                        {bundle.bonus_points > 0
                          ? `Earn ${bundle.bonus_points} bonus points`
                          : "Limited time offer"}
                      </li>
                      <li>
                        •{" "}
                        {isLowStock
                          ? `Only ${liveStats.remaining_stock} left in stock!`
                          : `${liveStats.purchases} people have claimed this already!`}
                      </li>
                      <li>
                        •{" "}
                        {bundle.discounted_price
                          ? `Save ${Math.round(((bundle.base_price - bundle.discounted_price) / bundle.base_price) * 100)}%`
                          : "Best value bundle"}
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Bundle Contents Preview */}
              {bundle && (
                <Card className="bg-black/30 backdrop-blur border-white/10">
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
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
                        {bundle.mystery_min_value && (
                          <p className="text-sm text-purple-400/70 mt-1">
                            Minimum value: KSH{" "}
                            {bundle.mystery_min_value.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : bundle.bundle_type === "build_own" ? (
                      <div className="text-center py-6 bg-white/5 rounded-lg">
                        <Package className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-white">Build Your Own Bundle</p>
                        <p className="text-xs text-purple-300">
                          Choose {bundle.min_items_to_select}-
                          {bundle.max_items_to_select} items from{" "}
                          {bundle.eligible_product_ids?.length || "many"}{" "}
                          products
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {bundle.products?.items
                          ?.slice(0, 8)
                          .map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-center p-2 rounded-lg bg-white/5"
                            >
                              <Package className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                              <p className="text-xs text-white truncate">
                                {item.product_name || `Item ${idx + 1}`}
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

            {/* Live Ticker Sidebar */}
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
                    Live Claims Feed
                    <Badge variant="outline" className="ml-2 text-purple-300">
                      {liveStats.purchases} total
                    </Badge>
                  </h3>
                  <p className="text-xs text-purple-300 mt-1">
                    🎙️ Announce these names on stream!
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {purchases.length === 0 ? (
                    <div className="text-center py-8 text-purple-300">
                      <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Waiting for first claim...</p>
                    </div>
                  ) : (
                    purchases.map((purchase, idx) => (
                      <motion.div
                        key={purchase.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(purchase.user_name);
                          toast.success(`"${purchase.user_name}" copied!`);
                        }}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(purchase.user_name);
                            toast.success(`"${purchase.user_name}" copied!`);
                          }}
                        >
                          📋
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>

              {/* Engagement Tips */}
              <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
                <div className="p-4 text-center">
                  <Mic className="h-8 w-8 text-white mx-auto mb-2" />
                  <h3 className="text-white font-bold">Host Tips</h3>
                  <div className="text-xs text-white/80 mt-2 space-y-1 text-left">
                    <p>
                      🎙️ "Shout out to{" "}
                      {purchases[0]?.user_name?.split(" ")[0] ||
                        "the next claim"}{" "}
                      for grabbing this bundle!"
                    </p>
                    <p>
                      📢 "Only {liveStats.remaining_stock} left at this price!"
                    </p>
                    <p>
                      ⭐ "
                      {bundle.bonus_points > 0
                        ? `Plus you earn ${bundle.bonus_points} bonus points!`
                        : "Best deal on the stream!"}
                      "
                    </p>
                  </div>
                </div>
              </Card>

              {/* How to claim */}
              <Card className="bg-black/30 backdrop-blur border-white/10">
                <div className="px-4 text-center">
                  <RefreshCw className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-white font-bold">How to Claim</h3>
                  <div className="text-xs text-white/80 mt-2 space-y-1">
                    <p>1. Click the "CLAIM THIS BUNDLE" button</p>
                    <p>2. Complete your purchase on the website</p>
                    <p>3. See your name appear live on stream!</p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                    onClick={() =>
                      window.open(`/bundles/${bundleId}`, "_blank")
                    }
                  >
                    View Bundle Page
                  </Button>
                  <div className="text-xs text-purple-300 mt-2">
                    * Make sure to complete the purchase for your name to show
                    up!
                  </div>
                  <div className="text-xs text-purple-300 mt-1">
                    * Refresh the page if you don't see your claim immediately.
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Scrolling Ticker Bar */}
        {purchases.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-t border-purple-500/30 py-2 overflow-hidden">
            <div className="whitespace-nowrap animate-marquee">
              {purchases.slice(0, 20).map((purchase, idx) => (
                <span
                  key={idx}
                  className="inline-block mx-4 text-sm text-white"
                >
                  🎉 {purchase.user_name} just claimed {bundle.name}! 🎉
                </span>
              ))}
              {purchases.slice(0, 20).map((purchase, idx) => (
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
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
