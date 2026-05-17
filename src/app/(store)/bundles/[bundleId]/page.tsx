// app/(store)/bundles/[bundleId]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  Check,
  Shield,
  Truck,
  Calendar,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Bundle } from "@/types/bundles";

const BUNDLE_CONFIG = {
  mystery: {
    icon: Gift,
    label: "Mystery Bundle",
    description: "Surprise package with guaranteed value",
    color: "from-purple-500 to-pink-500",
  },
  curated: {
    icon: Crown,
    label: "Curated Collection",
    description: "Hand-picked by our experts",
    color: "from-amber-500 to-yellow-500",
  },
  build_own: {
    icon: Package,
    label: "Build Your Own",
    description: "Choose the items you want",
    color: "from-blue-500 to-cyan-500",
  },
  tiered: {
    icon: TrendingUp,
    label: "Tiered Savings",
    description: "Save more when you buy more",
    color: "from-green-500 to-emerald-500",
  },
  subscription: {
    icon: RefreshCw,
    label: "Subscribe & Save",
    description: "Recurring deliveries",
    color: "from-indigo-500 to-purple-500",
  },
  bonus_points: {
    icon: Star,
    label: "Points Bundle",
    description: "Earn bonus loyalty points",
    color: "from-yellow-500 to-orange-500",
  },
};

export default function BundleDetailPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [isMysteryRevealed, setIsMysteryRevealed] = useState(false);
  const [mysteryRevealLoading, setMysteryRevealLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const bundleService = new BundleService(supabase);

  // Load bundle data
  useEffect(() => {
    const loadBundle = async () => {
      try {
        const data = await bundleService.getBundleById(bundleId);
        if (!data) {
          router.push("/bundles");
          return;
        }
        setBundle(data);
        setIsMysteryRevealed(data.is_mystery_revealed || false);

        // Fetch product details for the bundle
        const bundleProducts = data.products as any;
        const bundleProductItems = Array.isArray(bundleProducts)
          ? bundleProducts
          : bundleProducts?.items;
        if (bundleProductItems?.length) {
          const productIds = bundleProductItems.map(
            (item: any) => item.product_id,
          );
          const { data: productData } = await supabase
            .from("products")
            .select("*")
            .in("id", productIds);

          if (productData) {
            const productMap = new Map(productData.map((p) => [p.id, p]));
            const enrichedProducts = bundleProductItems.map((item: any) => ({
              ...item,
              product: productMap.get(item.product_id),
            }));
            setProducts(enrichedProducts);
          }
        }
      } catch (error) {
        console.error("Error loading bundle:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBundle();
  }, [bundleId, bundleService, router, supabase]);

  // Handle mystery bundle reveal
  const handleRevealMystery = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }

    setMysteryRevealLoading(true);
    try {
      const revealedProducts = await bundleService.revealMysteryBundle(
        bundleId,
        profile.id,
      );
      setIsMysteryRevealed(true);

      // Fetch product details for revealed items
      if (revealedProducts?.items) {
        const productIds = revealedProducts.items.map(
          (item: any) => item.product_id,
        );
        const { data: productData } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (productData) {
          const productMap = new Map(productData.map((p) => [p.id, p]));
          const enrichedProducts = revealedProducts.items.map((item: any) => ({
            ...item,
            product: productMap.get(item.product_id),
          }));
          setProducts(enrichedProducts);
        }
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setMysteryRevealLoading(false);
    }
  };

  // Handle tier selection
  const handleTierSelect = (quantity: number) => {
    setSelectedTier(quantity);
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      let purchase;

      if (bundle?.bundle_type === "build_own") {
        router.push(`/bundles/${bundleId}/build`);
        return;
      } else if (bundle?.bundle_type === "tiered") {
        purchase = await bundleService.purchaseBundle(bundleId, profile.id, {
          quantity: selectedTier,
        });
      } else {
        purchase = await bundleService.purchaseBundle(bundleId, profile.id);
      }

      setPurchaseSuccess({
        id: purchase.id,
        message: `Successfully purchased ${bundle?.name}!`,
      });

      // Refresh bundle to update stock
      const updatedBundle = await bundleService.getBundleById(bundleId);
      setBundle(updatedBundle);
    } catch (error: any) {
      alert(error.message);
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

    if (bundle?.bundle_type === "tiered" && bundle.tier_config) {
      const tiers = bundle.tier_config.sort(
        (a: any, b: any) => b.min_items - a.min_items,
      );
      const applicableTier = tiers.find(
        (tier: any) => selectedTier >= tier.min_items,
      );
      if (applicableTier) {
        return bundle.base_price * (1 - applicableTier.discount / 100);
      }
    }

    return bundle?.base_price || 0;
  };

  const getOriginalPrice = () => {
    if (bundle?.discounted_price) return bundle.base_price;
    return getCurrentPrice();
  };

  const getSavingsPercent = () => {
    const current = getCurrentPrice();
    const original = getOriginalPrice();
    if (original > current) {
      return Math.round(((original - current) / original) * 100);
    }
    return bundle?.savings_percentage || 0;
  };

  // Utility to normalize products from bundle data structure
  const getNormalizedProducts = (bundle: Bundle): any[] => {
    // If we already have products from fetch (with product details)
    if (products.length > 0) return products;

    // If no bundle, return empty array
    if (!bundle?.products) return [];

    // If it's already an array
    if (Array.isArray(bundle.products)) {
      return bundle.products;
    }

    // Handle the JSON object structure from the database
    const productsObj = bundle.products as any;

    // Curated, Tiered, Subscription, Bonus Points bundles
    if (productsObj.items && Array.isArray(productsObj.items)) {
      return productsObj.items;
    }

    // Mystery bundle - product pool
    if (productsObj.product_pool && Array.isArray(productsObj.product_pool)) {
      return productsObj.product_pool.map((productId: string) => ({
        product_id: productId,
        quantity: productsObj.quantity || 1,
        is_mystery: true,
      }));
    }

    // Build your own - no fixed products
    if (productsObj.type === "build_own") {
      return [];
    }

    return [];
  };

  const normalizedProducts = getNormalizedProducts(bundle as Bundle);

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

  const config = BUNDLE_CONFIG[bundle.bundle_type];
  const currentPrice = getCurrentPrice();
  const originalPrice = getOriginalPrice();
  const savingsPercent = getSavingsPercent();
  const isLowStock =
    bundle.remaining_count !== null && bundle.remaining_count <= 10;
  const isSoldOut = bundle.remaining_count === 0;
  const hasEnded = bundle.ends_at && new Date(bundle.ends_at) < new Date();
  const isAvailable = !isSoldOut && !hasEnded && bundle.status === "active";

  // Check if user is eligible based on tier
  const userTier = profile?.loyalty?.tier || "bronze";
  const isEligible =
    !bundle.eligible_tiers?.length || bundle.eligible_tiers.includes(userTier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Success Toast */}
      {purchaseSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top fade-in duration-300">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Success!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {purchaseSuccess.message}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Bundle Display */}
          <div className="space-y-6">
            {/* Bundle Image/Header */}
            <div
              className={cn(
                "relative rounded-2xl overflow-hidden bg-gradient-to-r h-96",
                config.color,
              )}
            >
              <div className="absolute inset-0 bg-black/30" />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-white/20 text-white border-0 gap-2">
                  <config.icon className="h-3 w-3" />
                  {config.label}
                </Badge>
                {bundle.is_live_exclusive && bundle.is_stream_active && (
                  <Badge className="bg-red-500 text-white gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    LIVE EXCLUSIVE
                  </Badge>
                )}
                {bundle.featured && (
                  <Badge className="bg-yellow-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>

              {bundle.badge_text && (
                <div className="absolute top-4 right-4">
                  <Badge
                    className="border-0"
                    style={{
                      backgroundColor:
                        bundle.badge_color?.split(" ")[0] || "#6B7280",
                    }}
                  >
                    {bundle.badge_text}
                  </Badge>
                </div>
              )}

              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {bundle.name}
                </h1>
                <p className="text-white/80 line-clamp-2">
                  {bundle.description}
                </p>
              </div>
            </div>

            {/* Bundle Contents */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                What's Inside
              </h2>

              {bundle.bundle_type === "mystery" && !isMysteryRevealed ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Gift className="h-10 w-10 text-purple-500" />
                  </div>
                  <h3 className="font-semibold">Mystery Bundle</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    This bundle contains{" "}
                    {Array.isArray(bundle.products)
                      ? bundle.products.length
                      : "selected"}{" "}
                    items with a guaranteed minimum value of KSH{" "}
                    {bundle.mystrey_min_value?.toLocaleString()}
                  </p>
                  {bundle.mystery_reveal_mode === "manual" &&
                    !isMysteryRevealed && (
                      <Button
                        onClick={handleRevealMystery}
                        disabled={mysteryRevealLoading || !isAvailable}
                        variant="outline"
                        className="gap-2"
                      >
                        {mysteryRevealLoading ? (
                          <>Revealing...</>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Reveal Mystery (Live Stream)
                          </>
                        )}
                      </Button>
                    )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {normalizedProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {bundle?.bundle_type === "mystery" &&
                        !bundle?.is_mystery_revealed
                          ? "Mystery bundle - contents hidden"
                          : bundle?.bundle_type === "build_own"
                            ? "Select your own items"
                            : "No products in this bundle"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {normalizedProducts.map((item: any, idx: number) => {
                        const product = item.product;
                        return (
                          <div
                            key={idx}
                            className="flex gap-3 p-2 rounded-lg bg-muted/50"
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
                                {product?.name ||
                                  item.name ||
                                  item.product_id?.slice(0, 8) ||
                                  `Item ${idx + 1}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {item.quantity || 1}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Features */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Bundle Features</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">2-Year Warranty</p>
                    <p className="text-xs text-muted-foreground">
                      On all products
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Free Shipping</p>
                    <p className="text-xs text-muted-foreground">
                      On orders over KSH 10,000
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">30-Day Returns</p>
                    <p className="text-xs text-muted-foreground">
                      Money-back guarantee
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">Customer Support</p>
                    <p className="text-xs text-muted-foreground">
                      24/7 dedicated team
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Purchase Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <div className="p-6">
                {/* Pricing */}
                <div className="mb-6">
                  {savingsPercent > 0 ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">
                          {formatPrice(currentPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      </div>
                      <Badge className="mt-2 bg-green-500 text-white">
                        Save {savingsPercent}%
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {formatPrice(currentPrice)}
                    </span>
                  )}
                </div>

                {/* Tier Selection (for tiered bundles) */}
                {bundle.bundle_type === "tiered" && bundle.tier_config && (
                  <div className="mb-6 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-2">Select Quantity</p>
                    <div className="flex gap-2">
                      {bundle.tier_config.map((tier: any) => (
                        <Button
                          key={tier.min_items}
                          variant={
                            selectedTier >= tier.min_items
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleTierSelect(tier.min_items)}
                          className="flex-1"
                        >
                          <div className="text-center">
                            <div>{tier.min_items}+ items</div>
                            <div className="text-xs opacity-80">
                              {tier.discount}% off
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Availability</span>
                    {isSoldOut ? (
                      <span className="text-red-500 font-medium">Sold Out</span>
                    ) : isLowStock ? (
                      <span className="text-orange-500 font-medium">
                        Low Stock
                      </span>
                    ) : (
                      <span className="text-green-500 font-medium">
                        In Stock
                      </span>
                    )}
                  </div>
                  {bundle.remaining_count !== null && !isSoldOut && (
                    <Progress
                      value={
                        (bundle.remaining_count /
                          (bundle.total_available || 1)) *
                        100
                      }
                      className="h-2"
                    />
                  )}
                  {isLowStock && !isSoldOut && (
                    <p className="text-xs text-orange-500 mt-2">
                      Only {bundle.remaining_count} left! Order soon.
                    </p>
                  )}
                </div>

                {/* Bonus Points */}
                {bundle.bonus_points > 0 && (
                  <div className="mb-6 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-sm">
                          Earn {bundle.bonus_points} Bonus Points
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Redeem for discounts on future purchases
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Points Required */}
                {bundle.points_required > 0 && (
                  <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">
                          Requires {bundle.points_required} Points
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Redeem your loyalty points for this bundle
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Eligibility Warning */}
                {!isEligible && (
                  <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium text-sm">Tier Required</p>
                        <p className="text-xs text-muted-foreground">
                          This bundle requires{" "}
                          {bundle.eligible_tiers?.join(" or ")} tier
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchase Button */}
                {bundle.bundle_type === "build_own" ? (
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/bundles/${bundleId}/build`}>
                      Build Your Bundle
                      <Package className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={
                      !isAvailable ||
                      !isEligible ||
                      submitting ||
                      (bundle.points_required > 0 &&
                        (!profile?.loyalty?.points ||
                          profile.loyalty.points < bundle.points_required))
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
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Claim Bundle Now
                      </>
                    )}
                  </Button>
                )}

                {/* Bundle Terms */}
                {bundle.terms_conditions && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {bundle.terms_conditions}
                  </p>
                )}

                {/* Live Stream Only Message */}
                {bundle.is_live_exclusive && !bundle.is_stream_active && (
                  <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-center">
                    <Zap className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-sm font-medium">Live Stream Exclusive</p>
                    <p className="text-xs text-muted-foreground">
                      This bundle will be available when the live stream starts
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Delivery Info */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Delivery Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Time</span>
                  <span>1-2 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Time</span>
                  <span>3-7 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Returns Policy</span>
                  <span>30 days</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
