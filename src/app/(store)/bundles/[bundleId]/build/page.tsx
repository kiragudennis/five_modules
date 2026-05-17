// app/(store)/bundles/[bundleId]/build/page.tsx
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
import Image from "next/image";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Bundle } from "@/types/bundles";

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
    // Apply bundle discount if any
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

  const totalPrice = getTotalPrice();
  const originalPrice = getOriginalPrice();
  const savings = originalPrice - totalPrice;
  const savingsPercent =
    originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">
            <Package className="h-3 w-3 mr-1" />
            Build Your Own Bundle
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{bundle.name}</h1>
          <p className="text-muted-foreground">{bundle.description}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Product Selection Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection Progress */}
            <Card className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Selected {selectedProducts.length} of{" "}
                  {bundle.max_items_to_select} items
                </span>
                <span className="text-sm text-muted-foreground">
                  Need at least {bundle.min_items_to_select}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </Card>

            {/* Eligible Products Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {eligibleProducts.map((product) => {
                const isSelected = selectedProducts.some(
                  (p) => p.product_id === product.id,
                );

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-blue-500",
                    )}
                    onClick={() => handleSelectProduct(product, !isSelected)}
                  >
                    <div className="flex gap-3 p-3">
                      <div className="flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm font-bold text-primary mt-1">
                          KSH {product.price.toLocaleString()}
                        </p>
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, -1);
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs w-6 text-center">
                              {selectedProducts.find(
                                (p) => p.product_id === product.id,
                              )?.quantity || 1}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
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
                      <div className="flex-shrink-0">
                        <Checkbox checked={isSelected} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Your Bundle
                </h3>
              </div>

              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {selectedProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select products to build your bundle
                  </p>
                ) : (
                  selectedProducts.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex justify-between text-sm"
                    >
                      <span className="truncate flex-1">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-medium">
                        KSH{" "}
                        {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t space-y-2">
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
                      <span>
                        - KSH {savings.toLocaleString()} (
                        {savingsPercent.toFixed(0)}%)
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total</span>
                  <span>KSH {totalPrice.toLocaleString()}</span>
                </div>

                {bundle.bonus_points > 0 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <Star className="h-4 w-4" />
                    <span>Earn {bundle.bonus_points} bonus points</span>
                  </div>
                )}

                {bundle.points_required > 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Coins className="h-4 w-4" />
                    <span>Requires {bundle.points_required} points</span>
                  </div>
                )}

                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!isValidSelection || submitting}
                >
                  {submitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Claim Bundle
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  You can select {bundle.min_items_to_select}-
                  {bundle.max_items_to_select} items
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
