// app/(store)/bundles/[bundleId]/page.tsx - Enhanced with live activity

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { PointsService } from "@/lib/services/points-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift,
  Star,
  Crown,
  Package,
  RefreshCw,
  TrendingUp,
  Coins,
  Shield,
  Truck,
  Calendar,
  ShoppingBag,
  Plus,
  Minus,
  Users,
  Zap,
  Clock,
  Sparkles,
  Heart,
  Eye,
  CheckCircle,
  AlertTriangle,
  Radio,
  HelpCircle,
  StarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Label } from "@/components/ui/label";
import { Bundle } from "@/types/bundles";
import { Product } from "@/types/store";
import { motion, AnimatePresence } from "framer-motion";
import { BUNDLE_CONFIG } from "@/lib/constants";

export default function BundleDetailPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [userTier, setUserTier] = useState("bronze");

  // Live activity states
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [liveTicker, setLiveTicker] = useState<any[]>([]);
  const [totalSold, setTotalSold] = useState(0);
  const [activeViewers, setActiveViewers] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const bundleService = useMemo(() => new BundleService(supabase), [supabase]);

  // Fetch live data
  const fetchLiveData = useCallback(async () => {
    if (!bundleId) return;

    // Get recent purchases with user names
    const { data: purchases } = await supabase
      .from("bundle_purchases")
      .select(
        `
        id,
        quantity,
        final_price,
        created_at,
        users!user_id (full_name)
      `,
      )
      .eq("bundle_id", bundleId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    if (purchases) {
      setRecentPurchases(purchases);
      setTotalSold(purchases.reduce((sum, p) => sum + p.quantity, 0));
    }

    // Get live ticker
    const ticker = await bundleService.getLiveTicker(bundleId, 20);
    setLiveTicker(ticker);

    // Check if stock is running low
    if (
      bundle?.remaining_count !== null &&
      bundle?.remaining_count !== undefined
    ) {
      const stockPercent =
        (bundle.remaining_count / (bundle.total_available || 1)) * 100;
      setIsUrgent(stockPercent < 20);
    }
  }, [
    bundleId,
    supabase,
    bundleService,
    bundle?.remaining_count,
    bundle?.total_available,
  ]);
  // Real-time subscription for live updates
  // Real-time subscription for live updates - SINGLE CHANNEL
  useEffect(() => {
    if (!bundleId) return;

    let isMounted = true;
    let mainChannel: any = null;

    const setupChannel = async () => {
      // Create ONE channel for everything
      mainChannel = supabase.channel(`bundle-live-${bundleId}`);

      // Add ALL listeners to the same channel BEFORE subscribing
      mainChannel
        // 1. Listen for new purchases
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bundle_purchases",
            filter: `bundle_id=eq.${bundleId}`,
          },
          async (payload: { new: any }) => {
            if (!isMounted) return;

            const { data: user } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .single();

            const newPurchase = {
              ...payload.new,
              users: { full_name: user?.full_name || "Someone" },
            };

            setRecentPurchases((prev) => [newPurchase, ...prev.slice(0, 9)]);
            setTotalSold((prev) => prev + (payload.new.quantity || 1));

            // Play sound for new purchase
            const audio = new Audio("/sounds/purchase-chime.mp3");
            audio.volume = 0.2;
            audio.play().catch(() => {});
          },
        )
        // 2. Listen for live ticker events
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bundle_live_ticker",
            filter: `bundle_id=eq.${bundleId}`,
          },
          (payload: { new: any }) => {
            if (!isMounted) return;
            setLiveTicker((prev) => [payload.new, ...prev.slice(0, 19)]);
          },
        )
        // 3. Listen for bundle updates (stock changes, reveals)
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
            // Update stock if changed
            if (payload.new.remaining_count !== payload.old.remaining_count) {
              setBundle((prev) =>
                prev
                  ? { ...prev, remaining_count: payload.new.remaining_count }
                  : null,
              );
              const stockPercent =
                (payload.new.remaining_count /
                  (payload.new.total_available || 1)) *
                100;
              setIsUrgent(stockPercent < 20);
            }
            // Check if mystery bundle was revealed
            if (
              payload.new.is_mystery_revealed &&
              !payload.old.is_mystery_revealed
            ) {
              fetchLiveData(); // Refresh to show revealed products
            }
          },
        )
        // 4. Presence tracking for active viewers
        .on("presence", { event: "sync" }, () => {
          if (!isMounted) return;
          const state = mainChannel.presenceState();
          setActiveViewers(Object.keys(state).length);
        })
        // 5. Broadcast channel for admin announcements
        .on(
          "broadcast",
          { event: "announcement" },
          ({ payload }: { payload: { message: string } }) => {
            if (!isMounted) return;
            setLiveTicker((prev) => [
              {
                id: Date.now().toString(),
                message: `📢 ${payload.message}`,
                created_at: new Date().toISOString(),
              },
              ...prev.slice(0, 19),
            ]);
          },
        )
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED" && isMounted) {
            console.log("✅ Bundle live channel connected");

            // Track this viewer with a unique ID
            await mainChannel.track({
              user_id:
                profile?.id ||
                `viewer_${Math.random().toString(36).substring(2, 9)}`,
              online_at: new Date().toISOString(),
            });
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Bundle channel error");
          }
        });
    };

    setupChannel();

    // Countdown timer for urgent deals
    let interval: NodeJS.Timeout | null = null;
    if (bundle?.ends_at) {
      interval = setInterval(() => {
        if (!isMounted) return;
        const end = new Date(bundle.ends_at!);
        const now = new Date();
        if (end > now) {
          const diff = end.getTime() - now.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
          setIsUrgent(hours < 2);
        } else {
          setTimeRemaining("Ended");
          if (interval) clearInterval(interval);
        }
      }, 60000);
    }

    fetchLiveData();

    // Cleanup - unsubscribe the single channel
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (mainChannel) {
        mainChannel.unsubscribe();
      }
    };
  }, [bundleId, supabase, fetchLiveData, bundle?.ends_at, profile?.id]);

  // Load bundle and product details
  useEffect(() => {
    const loadBundle = async () => {
      try {
        const data = await bundleService.getBundleById(bundleId);
        if (!data) {
          router.push("/bundles");
          return;
        }
        setBundle(data);

        // Fetch product details for the bundle
        if (
          (data.products?.items && data.products.items.length > 0) ||
          (data.products?.product_pool && data.products.product_pool.length > 0)
        ) {
          let productIds = data.products.items?.map(
            (item: any) => item.product_id,
          );

          if (
            (!productIds || productIds.length === 0) &&
            data.products.product_pool
          ) {
            productIds = data.products.product_pool;
          }

          if (productIds && productIds.length > 0) {
            const { data: productData } = await supabase
              .from("products")
              .select("*")
              .in("id", productIds);

            setProducts(productData || []);
          }
        }

        // Get user points and tier if logged in
        if (profile?.id) {
          const points = await PointsService.getBalance(supabase, profile.id);
          setUserPoints(points?.points || 0);

          const { data: loyaltyData } = await supabase
            .from("loyalty_points")
            .select("tier")
            .eq("user_id", profile.id)
            .single();
          setUserTier(loyaltyData?.tier || "bronze");
        }
      } catch (error) {
        console.error("Error loading bundle:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBundle();
  }, [bundleId, profile?.id, bundleService, supabase, router]);

  const handlePurchase = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }

    if (bundle?.bundle_type === "build_own") {
      router.push(`/bundles/${bundleId}/build`);
      return;
    }

    setSubmitting(true);
    try {
      const purchase = await bundleService.purchaseBundle(
        bundleId,
        profile.id,
        {
          quantity: selectedQuantity,
        },
      );

      router.push(`/bundles/${bundleId}/success?purchase=${purchase.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentPrice = () => {
    if (bundle?.discounted_price) return bundle.discounted_price;
    return bundle?.base_price || 0;
  };

  const getOriginalPrice = () => bundle?.base_price || 0;
  const getSavingsPercent = () => bundle?.savings_percentage || 0;

  const isLowStock =
    bundle?.remaining_count !== null && (bundle?.remaining_count || 0) <= 10;
  const isSoldOut = bundle?.remaining_count === 0;
  const hasEnded = bundle?.ends_at
    ? new Date(bundle?.ends_at) < new Date()
    : false;
  const isAvailable = !isSoldOut && !hasEnded && bundle?.status === "active";

  const isEligible =
    !bundle?.eligible_tiers?.length || bundle.eligible_tiers.includes(userTier);
  const hasEnoughPoints =
    !bundle?.points_required || userPoints >= bundle.points_required;

  const config = bundle
    ? BUNDLE_CONFIG[bundle.bundle_type as keyof typeof BUNDLE_CONFIG]
    : BUNDLE_CONFIG.curated;
  const Icon = config?.icon || Package;
  const currentPrice = getCurrentPrice();
  const originalPrice = getOriginalPrice();
  const savingsPercent = getSavingsPercent();

  const productImages = products.map((p) => p.images?.[0]).filter(Boolean);
  const displayImage =
    bundle?.cover_image_url || bundle?.image_url || productImages[0] || null;
  const galleryImages =
    productImages.length > 0
      ? productImages
      : displayImage
        ? [displayImage]
        : [];
  const stockPercentage = bundle?.total_available
    ? ((bundle.total_available - (bundle.remaining_count || 0)) /
        bundle.total_available) *
      100
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Skeleton className="h-96 w-full rounded-lg mb-4" />
            <Skeleton className="h-12 w-3/4 mb-2" />
            <Skeleton className="h-24 w-full mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div>
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Bundle Not Found</h2>
        <p className="text-muted-foreground mb-4">
          This bundle doesn't exist or is no longer available.
        </p>
        <Button onClick={() => router.push("/bundles")}>Browse Bundles</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header Banner */}
      <div
        className={cn("bg-gradient-to-r text-white py-8 px-6", config.color)}
      >
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5" />
                <Badge className="bg-white/20 text-white border-0">
                  {config.label}
                </Badge>
                {bundle.is_live_exclusive && bundle.is_stream_active && (
                  <Badge className="bg-red-500 text-white gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    LIVE EXCLUSIVE
                  </Badge>
                )}
                {/* Live badge with link */}
                {bundle.is_stream_active && (
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 text-white hover:bg-white/30 border-0"
                  >
                    <Link href={`/bundles/live/${bundleId}`} target="_blank">
                      <Radio className="h-4 w-4 mr-2 animate-pulse" />
                      Watch Live
                      <Eye className="h-3 w-3 ml-2" />
                    </Link>
                  </Button>
                )}
                {bundle.featured && (
                  <Badge className="bg-yellow-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {isUrgent && !isSoldOut && (
                  <Badge className="bg-orange-500 text-white animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    Almost Gone!
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold">{bundle.name}</h1>
              <p className="opacity-90 mt-1 max-w-xl">{bundle.description}</p>
            </div>
            {bundle.badge_text && (
              <Badge
                className="text-lg px-4 py-2"
                style={{
                  backgroundColor:
                    bundle.badge_color?.split(" ")[0] || "#6B7280",
                }}
              >
                {bundle.badge_text}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Enhanced Images & Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image with Zoom */}
            <Card className="overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 relative group">
              <div className="aspect-square flex items-center justify-center relative">
                <motion.div
                  className="relative w-full h-full cursor-zoom-in"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setIsZoomed(true)}
                >
                  {galleryImages[selectedImageIndex] ? (
                    <img
                      src={galleryImages[selectedImageIndex]}
                      alt={bundle.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Icon className="h-32 w-32 text-muted-foreground" />
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-4 w-4 text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Image Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) =>
                        prev === 0 ? galleryImages.length - 1 : prev - 1,
                      );
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) =>
                        prev === galleryImages.length - 1 ? 0 : prev + 1,
                      );
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </Card>

            {/* Image Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {galleryImages.map((img, idx) => (
                  <motion.div
                    key={idx}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                      selectedImageIndex === idx
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-primary/50",
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img
                      src={img}
                      alt={`${bundle.name} - view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Product Highlights Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs font-medium">Quality Guaranteed</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-center">
                <Truck className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-medium">Free Shipping</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center">
                <Shield className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <p className="text-xs font-medium">2-Yr Warranty</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 text-center">
                <Clock className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xs font-medium">Fast Delivery</p>
              </div>
            </div>

            {/* Key Selling Points */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  Why Customers Love This Bundle
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>
                      Save {savingsPercent}% compared to buying separately
                    </span>
                  </li>
                  {bundle.bonus_points > 0 && (
                    <li className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      <span>
                        Earn {bundle.bonus_points} bonus loyalty points
                      </span>
                    </li>
                  )}
                  <li className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>
                      Limited time offer - only{" "}
                      {bundle.total_available || "limited"} available
                    </span>
                  </li>
                  {bundle.subscription_interval && (
                    <li className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span>Subscribe & save on recurring deliveries</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Zoom Modal */}
          <AnimatePresence>
            {isZoomed && galleryImages[selectedImageIndex] && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out"
                onClick={() => setIsZoomed(false)}
              >
                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  src={galleryImages[selectedImageIndex]}
                  alt={bundle.name}
                  className="max-w-[90vw] max-h-[90vh] object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={() => setIsZoomed(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
                {galleryImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) =>
                          prev === 0 ? galleryImages.length - 1 : prev - 1,
                        );
                      }}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) =>
                          prev === galleryImages.length - 1 ? 0 : prev + 1,
                        );
                      }}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                  {selectedImageIndex + 1} / {galleryImages.length}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Column - Details & Social Proof */}
          <div className="space-y-6">
            {/* Social Proof Banner */}
            {(totalSold > 0 ||
              activeViewers > 0 ||
              recentPurchases.length > 0) && (
              <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold">
                          {activeViewers}+ watching
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Live now
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-semibold">
                          {totalSold} sold
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Happy customers
                        </p>
                      </div>
                    </div>
                    {timeRemaining && !hasEnded && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-semibold">
                            {timeRemaining}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            left at this price
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing */}
            <div>
              {savingsPercent > 0 ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(currentPrice)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(originalPrice)}
                  </span>
                  <Badge className="bg-green-500 text-white text-lg px-3 py-1">
                    Save {savingsPercent}%
                  </Badge>
                </div>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(currentPrice)}
                </span>
              )}
            </div>

            {/* Bundle Contents */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  What's Inside
                </h3>

                {bundle.bundle_type === "mystery" &&
                !bundle.is_mystery_revealed ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Gift className="h-10 w-10 text-purple-500" />
                    </div>
                    <p className="font-semibold">Mystery Bundle</p>
                    <p className="text-sm text-muted-foreground">
                      This bundle contains{" "}
                      {bundle.products?.product_pool?.length || "selected"}{" "}
                      items
                    </p>
                    {bundle.mystery_min_value && (
                      <p className="text-xs text-purple-600">
                        Minimum value: {formatPrice(bundle.mystery_min_value)}
                      </p>
                    )}
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {products.map((item: any, idx: number) => {
                      const product = item.product;
                      return (
                        <div
                          key={idx}
                          className="flex gap-2 p-2 rounded-lg bg-muted/30"
                        >
                          {product?.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-12 w-12 object-cover rounded"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product?.name || `Item ${idx + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity || 1}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : bundle.bundle_type === "build_own" ? (
                  <div className="text-center py-6">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm">Choose from eligible products</p>
                    <p className="text-xs text-muted-foreground">
                      Select {bundle.min_items_to_select}-
                      {bundle.max_items_to_select} items
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No products listed</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bundle Features */}
            <div className="grid grid-cols-2 gap-3">
              {bundle.bonus_points > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-sm">Bonus Points</p>
                    <p className="text-xs text-yellow-600">
                      +{bundle.bonus_points} pts
                    </p>
                  </div>
                </div>
              )}
              {bundle.points_required > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Coins className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Points Required</p>
                    <p className="text-xs text-blue-600">
                      {bundle.points_required} pts
                    </p>
                  </div>
                </div>
              )}
              {bundle.eligible_tiers && bundle.eligible_tiers.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <Crown className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">Tier Required</p>
                    <p className="text-xs text-purple-600">
                      {bundle.eligible_tiers.join("+")}
                    </p>
                  </div>
                </div>
              )}
              {bundle.subscription_interval && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                  <RefreshCw className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="font-medium text-sm">Subscription</p>
                    <p className="text-xs text-indigo-600 capitalize">
                      {bundle.subscription_interval}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector (for tiered bundles) */}
            {bundle.bundle_type === "tiered" && bundle.tier_config && (
              <Card>
                <CardContent className="p-4">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-12 text-center">
                      {selectedQuantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {bundle.tier_config.map(
                    (tier: any) =>
                      selectedQuantity >= tier.min_items && (
                        <Badge
                          key={tier.min_items}
                          className="mt-3 bg-green-500"
                        >
                          {tier.discount}% off for {tier.min_items}+ items
                        </Badge>
                      ),
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stock Status */}
            {bundle.total_available !== null && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Availability</span>
                  {isSoldOut ? (
                    <span className="text-red-500 font-medium">Sold Out</span>
                  ) : isLowStock ? (
                    <span className="text-orange-500 font-medium animate-pulse">
                      Only {bundle.remaining_count} left!
                    </span>
                  ) : (
                    <span className="text-green-500 font-medium">In Stock</span>
                  )}
                </div>
                {!isSoldOut && (
                  <Progress
                    value={stockPercentage}
                    className={cn("h-2", isLowStock && "bg-orange-500/20")}
                  />
                )}
              </div>
            )}

            {/* Purchase Button */}
            <div className="space-y-3">
              {bundle?.bundle_type === "build_own" ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Link href={`/bundles/${bundleId}/build`}>
                    Build Your Bundle
                    <Package className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={handlePurchase}
                  disabled={
                    !isAvailable ||
                    !isEligible ||
                    !hasEnoughPoints ||
                    submitting
                  }
                >
                  {submitting ? (
                    <>Processing...</>
                  ) : isSoldOut ? (
                    "Sold Out"
                  ) : hasEnded ? (
                    "Bundle Ended"
                  ) : !isEligible ? (
                    "Upgrade Tier to Purchase"
                  ) : !hasEnoughPoints ? (
                    `Need ${bundle.points_required} Points`
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Claim Bundle Now
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Live Broadcast Card */}
            {(bundle.is_live_exclusive ||
              bundle.is_stream_active ||
              activeViewers > 0) && (
              <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <Radio className="h-5 w-5 ml-2" />
                      </div>
                      <span className="font-semibold">Live Broadcast</span>
                    </div>
                    {activeViewers > 0 && (
                      <Badge className="bg-white/20 text-white border-0">
                        <Users className="h-3 w-3 mr-1" />
                        {activeViewers} watching
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm opacity-90 mb-3">
                    {bundle.is_stream_active
                      ? "🎥 Host is live right now! Watch others claim this bundle in real-time."
                      : bundle.is_live_exclusive
                        ? "⭐ This bundle is exclusive to our live stream audience!"
                        : "📺 See real-time claims and join the excitement!"}
                  </p>

                  {/* Live Activity Preview */}
                  {liveTicker.length > 0 && (
                    <div className="mb-3 p-2 rounded-lg bg-white/10 backdrop-blur">
                      <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
                        <span className="truncate flex-1">
                          {liveTicker[0]?.message ||
                            "Someone just claimed this bundle!"}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    asChild
                    className="w-full bg-white text-purple-600 hover:bg-gray-100 hover:text-purple-700 font-semibold"
                  >
                    <Link href={`/bundles/live/${bundleId}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      Join Live Broadcast
                      {bundle.is_stream_active && (
                        <Badge className="ml-2 bg-red-500 text-white animate-pulse">
                          LIVE
                        </Badge>
                      )}
                    </Link>
                  </Button>

                  {/* Social Proof Mini Ticker */}
                  {recentPurchases.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/20">
                      <div className="flex items-center gap-1 text-xs opacity-75">
                        <ShoppingBag className="h-3 w-3" />
                        <span>
                          {recentPurchases.length} claims in the last hour
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Floating Live Button for Mobile */}
        {bundle.is_stream_active && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-20 right-4 z-50 md:hidden"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full shadow-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 animate-pulse"
            >
              <Link href={`/bundles/live/${bundleId}`} target="_blank">
                <Radio className="h-4 w-4 mr-2" />
                LIVE
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Live Activity Feed - New Section */}
        {(recentPurchases.length > 0 || liveTicker.length > 0) && (
          <div className="mt-8">
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  Live Activity
                  <Badge variant="outline" className="ml-2 text-xs">
                    Real-time updates
                  </Badge>
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {liveTicker.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span>{item.message}</span>
                    </div>
                  ))}
                  {recentPurchases.slice(0, 5).map((purchase, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span className="font-medium">
                          {purchase.users?.full_name || "Someone"}
                        </span>
                        <span className="text-muted-foreground">purchased</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        x{purchase.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Section */}
        <div className="mt-8">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="activity" className="gap-2 shrink-0">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Live Activity</span>
                <span className="sm:hidden">Live</span>
                {activeViewers > 0 && (
                  <Badge className="bg-green-500 text-white ml-1">
                    {activeViewers}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="reviews" className="gap-2 shrink-0">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Reviews</span>
                <span className="sm:hidden">⭐</span>
                {bundle?.review_count && bundle?.review_count > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {bundle.review_count}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="purchases" className="gap-2 shrink-0">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Recent Purchases</span>
                <span className="sm:hidden">Purchases</span>
                {recentPurchases.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {recentPurchases.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="benefits" className="gap-2 shrink-0">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Benefits</span>
                <span className="sm:hidden">🎁</span>
              </TabsTrigger>

              <TabsTrigger value="faq" className="gap-2 shrink-0">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">FAQ</span>
                <span className="sm:hidden">❓</span>
              </TabsTrigger>
            </TabsList>

            {/* Live Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {/* Real-time Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                      <Eye className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">{activeViewers}</p>
                      <p className="text-xs text-muted-foreground">
                        Watching Now
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-500/10">
                      <ShoppingBag className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">{totalSold}</p>
                      <p className="text-xs text-muted-foreground">
                        Total Sold
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-500/10">
                      <Users className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">
                        {totalSold + Math.floor(Math.random() * 50)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Happy Customers
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-500/10">
                      <Star className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold">4.8</p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>

                  {/* Live Ticker Feed */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                      Live Activity Feed
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-muted/20 rounded-lg p-3">
                      {liveTicker.length === 0 &&
                      recentPurchases.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          Waiting for activity...
                        </p>
                      ) : (
                        <>
                          {liveTicker.slice(0, 5).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm p-2 bg-white/5 rounded-lg animate-in fade-in slide-in-from-right"
                            >
                              <Sparkles className="h-3 w-3 text-yellow-500" />
                              <span className="flex-1">{item.message}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(item.created_at),
                                  { addSuffix: true },
                                )}
                              </span>
                            </div>
                          ))}
                          {recentPurchases.slice(0, 5).map((purchase, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm p-2 bg-white/5 rounded-lg animate-in fade-in slide-in-from-right"
                            >
                              <Heart className="h-3 w-3 text-red-500" />
                              <span className="flex-1">
                                <span className="font-medium">
                                  {purchase.users?.full_name || "Someone"}
                                </span>
                                {" purchased "}
                                <span className="font-semibold">
                                  {bundle?.name}
                                </span>
                              </span>
                              <Badge variant="outline" className="text-xs">
                                x{purchase.quantity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                just now
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Urgency Message */}
                  {isLowStock && !isSoldOut && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center animate-pulse">
                      <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-red-500">
                        ⚡ Only {bundle.remaining_count} left! {activeViewers}{" "}
                        people are viewing this right now.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Don't miss out - this bundle is selling fast!
                      </p>
                    </div>
                  )}

                  {/* Buying Tips */}
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      💡 Why customers are buying this bundle
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Save up to {savingsPercent}% compared to buying
                        separately
                      </li>
                      {bundle.bonus_points > 0 && (
                        <li className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Earn {bundle.bonus_points} bonus loyalty points
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-500" />
                        Free shipping on orders over KSH 10,000
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        2-year warranty on all products
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-6 w-6 fill-yellow-500 text-yellow-500"
                        />
                      ))}
                    </div>
                    <p className="text-3xl font-bold">4.8 out of 5</p>
                    <p className="text-sm text-muted-foreground">
                      Based on {totalSold + 50} reviews
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-12">5 ★</span>
                      <Progress value={85} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-12">4 ★</span>
                      <Progress value={10} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground">10%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-12">3 ★</span>
                      <Progress value={3} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground">3%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-12">2 ★</span>
                      <Progress value={1} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground">1%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-12">1 ★</span>
                      <Progress value={1} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground">1%</span>
                    </div>
                  </div>

                  {/* Sample Reviews */}
                  <div className="mt-6 space-y-4">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Sarah M.</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="h-3 w-3 fill-yellow-500 text-yellow-500"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        "Amazing value! The products are high quality and the
                        savings are incredible."
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">John K.</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="h-3 w-3 fill-yellow-500 text-yellow-500"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        "The subscription option is great - I get my bundle
                        every month automatically."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Purchases Tab */}
            <TabsContent value="purchases" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Recent Purchases
                    <Badge variant="outline" className="ml-2">
                      Real-time
                    </Badge>
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentPurchases.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No purchases yet. Be the first!
                      </p>
                    ) : (
                      recentPurchases.map((purchase, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {purchase.users?.full_name || "Customer"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(purchase.created_at),
                                  { addSuffix: true },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatPrice(purchase.final_price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {purchase.quantity}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Purchase Incentive */}
                  {!isSoldOut && (
                    <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-center">
                      <p className="text-sm">
                        🎉 Join {totalSold + 1} other happy customers who bought
                        this bundle!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benefits Tab */}
            <TabsContent value="benefits" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-500" />
                        Bundle Benefits
                      </h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">
                            Save {savingsPercent}% compared to individual
                            products
                          </span>
                        </li>
                        {bundle.bonus_points > 0 && (
                          <li className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span className="text-sm">
                              Earn {bundle.bonus_points} loyalty points
                            </span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span className="text-sm">
                            2-year warranty on all products
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Truck className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">
                            Free shipping on orders over KSH 10,000
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Exclusive Perks
                      </h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">Priority shipping</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">
                            30-day money-back guarantee
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">24/7 customer support</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">
                            Free gift wrapping available
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Bundle Comparison Table */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">
                      How This Bundle Compares
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Feature</th>
                            <th className="text-center p-2">Regular Price</th>
                            <th className="text-center p-2">Bundle Price</th>
                            <th className="text-center p-2">Savings</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2">Individual Products</td>
                            <td className="text-center p-2">
                              {formatPrice(originalPrice)}
                            </td>
                            <td className="text-center p-2 text-green-600 font-semibold">
                              {formatPrice(currentPrice)}
                            </td>
                            <td className="text-center p-2 text-green-600">
                              Save {formatPrice(originalPrice - currentPrice)}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">Shipping</td>
                            <td className="text-center p-2">KES 500</td>
                            <td className="text-center p-2 text-green-600 font-semibold">
                              FREE
                            </td>
                            <td className="text-center p-2 text-green-600">
                              Save KES 500
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold">Total Value</td>
                            <td className="text-center p-2 font-semibold">
                              {formatPrice(originalPrice + 500)}
                            </td>
                            <td className="text-center p-2 font-bold text-green-600">
                              {formatPrice(currentPrice)}
                            </td>
                            <td className="text-center p-2 font-bold text-green-600">
                              Save{" "}
                              {formatPrice(originalPrice + 500 - currentPrice)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        How does the bundle work?
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        When you purchase this bundle, you'll receive all the
                        listed products together in one shipment. Each product
                        comes with its own warranty and return policy.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        Can I return individual items?
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Yes! You can return any item within 30 days for a full
                        refund. The bundle discount will be adjusted based on
                        the items you keep.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        How do I earn bonus points?
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Bonus points are automatically added to your loyalty
                        account immediately after purchase. You can redeem them
                        for discounts on future orders.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        What is the subscription option?
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Subscribe to receive this bundle on a recurring{" "}
                        {bundle.subscription_interval || "monthly"} basis. You
                        can pause, skip, or cancel anytime. Subscribers get the
                        same great savings every time!
                      </p>
                    </div>
                    {bundle.is_mystery && !bundle.is_mystery_revealed && (
                      <div>
                        <h4 className="font-semibold mb-2">
                          What's in the mystery bundle?
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          The mystery bundle contains{" "}
                          {bundle.products?.product_pool?.length || "multiple"}{" "}
                          premium items worth at least{" "}
                          {formatPrice(bundle.mystery_min_value || 0)}. The
                          exact contents will be revealed
                          {bundle.mystery_reveal_mode === "after_purchase"
                            ? "after purchase"
                            : "during the live stream"}
                          !
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Still Have Questions */}
                  <div className="mt-6 p-4 rounded-lg bg-primary/5 text-center">
                    <p className="text-sm">Still have questions?</p>
                    <Button variant="link" size="sm" className="mt-1">
                      Contact Support →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
