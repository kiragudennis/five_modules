// app/(store)/bundles/[bundleId]/build/page.tsx - Enhanced version

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Check,
  ArrowRight,
  ShoppingBag,
  Minus,
  Plus,
  Star,
  Coins,
  Zap,
  Sparkles,
  TrendingUp,
  Gift,
  Crown,
  Users,
  Clock,
  Shield,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Bundle } from "@/types/bundles";
import confetti from "canvas-confetti";

interface SelectedProduct {
  product_id: string;
  product: any;
  quantity: number;
}

export default function BuildYourOwnBundlePage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [showSavingsBadge, setShowSavingsBadge] = useState(false);

  const bundleService = new BundleService(supabase);

  useEffect(() => {
    const loadData = async () => {
      try {
        const bundleData = await bundleService.getBundleById(bundleId);
        if (!bundleData || bundleData.bundle_type !== "build_own") {
          router.push("/bundles");
          return;
        }
        setBundle(bundleData);

        const products = await bundleService.getEligibleProducts(bundleId);
        setEligibleProducts(products);
      } catch (error) {
        console.error("Error loading bundle:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bundleId, bundleService, router]);

  const handleSelectProduct = (product: any, checked: boolean) => {
    if (checked) {
      if (selectedProducts.length >= (bundle?.max_items_to_select || 5)) {
        alert(`You can only select up to ${bundle?.max_items_to_select} items`);
        return;
      }
      setSelectedProducts([
        ...selectedProducts,
        {
          product_id: product.id,
          product: product,
          quantity: 1,
        },
      ]);

      // Show savings badge animation when first product is added
      if (selectedProducts.length === 0) {
        setShowSavingsBadge(true);
        setTimeout(() => setShowSavingsBadge(false), 3000);
      }
    } else {
      setSelectedProducts(
        selectedProducts.filter((p) => p.product_id !== product.id),
      );
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.product_id === productId) {
          const newQuantity = Math.max(1, p.quantity + delta);
          return { ...p, quantity: newQuantity };
        }
        return p;
      }),
    );
  };

  const getTotalPrice = () => {
    const subtotal = selectedProducts.reduce(
      (sum, p) => sum + p.product.price * p.quantity,
      0,
    );
    if (bundle?.discounted_price) {
      return bundle.discounted_price;
    }
    return subtotal;
  };

  const getOriginalPrice = () => {
    return selectedProducts.reduce(
      (sum, p) => sum + p.product.price * p.quantity,
      0,
    );
  };

  const handleSubmit = async () => {
    if (!profile) {
      router.push("/login");
      return;
    }

    if (selectedProducts.length < (bundle?.min_items_to_select || 1)) {
      alert(`Please select at least ${bundle?.min_items_to_select} items`);
      return;
    }

    setSubmitting(true);
    try {
      const purchase = await bundleService.purchaseBundle(
        bundleId,
        profile.id,
        {
          selectedItems: selectedProducts.map((p) => ({
            product_id: p.product_id,
            quantity: p.quantity,
          })),
        },
      );

      // Trigger confetti on success
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#9333ea", "#ec4899", "#fbbf24"],
      });

      router.push(`/bundles/${bundleId}/success?purchase=${purchase.id}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isValidSelection =
    selectedProducts.length >= (bundle?.min_items_to_select || 1);
  const progress =
    (selectedProducts.length / (bundle?.max_items_to_select || 5)) * 100;
  const totalPrice = getTotalPrice();
  const originalPrice = getOriginalPrice();
  const savings = originalPrice - totalPrice;
  const savingsPercent =
    originalPrice > 0 ? (savings / originalPrice) * 100 : 0;
  const remainingSelections =
    (bundle?.max_items_to_select || 5) - selectedProducts.length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-64 w-full rounded-lg mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section with Savings Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-white/20 text-white mb-3">
            <Package className="h-3 w-3 mr-1" />
            Build Your Own Bundle
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{bundle.name}</h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            {bundle.description}
          </p>

          {savingsPercent > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-semibold">
                Save up to {savingsPercent}% when you build your bundle!
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product Selection Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection Progress Card */}
            <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    Build Your Custom Bundle
                  </span>
                </div>
                <Badge variant="outline" className="bg-white/50">
                  {selectedProducts.length} / {bundle.max_items_to_select} items
                </Badge>
              </div>
              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>✨ Need at least {bundle.min_items_to_select} items</span>
                <span>🎁 Max {bundle.max_items_to_select} items</span>
              </div>
              {remainingSelections > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  You can add {remainingSelections} more{" "}
                  {remainingSelections === 1 ? "item" : "items"} to your bundle!
                </p>
              )}
            </Card>

            {/* Products Grid - Compact Cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              {eligibleProducts.map((product) => {
                const isSelected = selectedProducts.some(
                  (p) => p.product_id === product.id,
                );
                const isHovered = hoveredProduct === product.id;

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      isSelected && "ring-2 ring-blue-500 bg-blue-500/5",
                      isHovered && "transform scale-[1.01]",
                    )}
                    onMouseEnter={() => setHoveredProduct(product.id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    onClick={() => handleSelectProduct(product, !isSelected)}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Product Image - Smaller */}
                      <div className="flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-14 w-14 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-14 w-14 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Info - Condensed */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm truncate flex-1">
                            {product.name}
                          </h3>
                          <p className="text-sm font-bold text-primary whitespace-nowrap">
                            KSH {product.price.toLocaleString()}
                          </p>
                        </div>

                        {/* Quantity Controls - More compact */}
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, -1);
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-medium w-5 text-center">
                              {selectedProducts.find(
                                (p) => p.product_id === product.id,
                              )?.quantity || 1}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, 1);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Selection Checkbox - Smaller */}
                      <div className="flex-shrink-0">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 bg-white",
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Live Activity Preview */}
            <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold">Live Activity</span>
                <Badge variant="outline" className="text-xs">
                  Real-time
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                🎉 24 people are building their bundles right now!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ⚡ The most popular combo today:{" "}
                {eligibleProducts
                  .slice(0, 2)
                  .map((p) => p.name)
                  .join(" + ")}
              </p>
            </Card>
          </div>

          {/* Order Summary Sidebar - Enhanced */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 overflow-hidden">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Your Custom Bundle
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  You're building something special!
                </p>
              </div>

              {/* Selected Items */}
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Select products to build your bundle
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose {bundle.min_items_to_select}-
                      {bundle.max_items_to_select} items
                    </p>
                  </div>
                ) : (
                  selectedProducts.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt=""
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <span className="truncate">
                          {item.quantity}x {item.product.name}
                        </span>
                      </div>
                      <span className="font-semibold">
                        KSH{" "}
                        {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-4 border-t space-y-2 bg-muted/20">
                {savings > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Original Price
                      </span>
                      <span className="line-through">
                        KSH {originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Bundle Savings</span>
                      <span className="font-medium">
                        - KSH {savings.toLocaleString()} (
                        {savingsPercent.toFixed(0)}%)
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total</span>
                  <span className="text-primary">
                    KSH {totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Bonus Points */}
                {bundle.bonus_points > 0 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 p-2 rounded-lg bg-yellow-500/10">
                    <Star className="h-4 w-4" />
                    <span>
                      Earn {bundle.bonus_points} bonus points on purchase!
                    </span>
                  </div>
                )}

                {/* Requirements */}
                {bundle.points_required > 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 p-2 rounded-lg bg-blue-500/10">
                    <Coins className="h-4 w-4" />
                    <span>
                      Requires {bundle.points_required} loyalty points
                    </span>
                  </div>
                )}

                {/* Free Shipping Threshold */}
                {totalPrice >= 10000 && (
                  <div className="flex items-center gap-2 text-sm text-green-600 p-2 rounded-lg bg-green-500/10">
                    <Truck className="h-4 w-4" />
                    <span>✨ Free shipping included!</span>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!isValidSelection || submitting}
                >
                  {submitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Claim Your Custom Bundle
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Selection Reminder */}
                {!isValidSelection && (
                  <p className="text-xs text-amber-600 text-center mt-2">
                    ⚠️ You need{" "}
                    {bundle.min_items_to_select - selectedProducts.length} more
                    item
                    {selectedProducts.length !== bundle.min_items_to_select - 1
                      ? "s"
                      : ""}{" "}
                    to complete your bundle
                  </p>
                )}

                {/* Live Broadcast Link */}
                <div className="mt-3 pt-2 border-t text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full"
                    onClick={() =>
                      window.open(`/bundles/live/${bundleId}`, "_blank")
                    }
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Watch others build their bundles live →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Savings Celebration Animation */}
        {showSavingsBadge && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 shadow-2xl">
              <div className="text-center">
                <Sparkles className="h-8 w-8 mx-auto mb-2" />
                <p className="text-lg font-bold">Great choice!</p>
                <p className="text-sm">
                  You're saving {savingsPercent}% on your bundle!
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
