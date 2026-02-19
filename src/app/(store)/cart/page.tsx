// src/app/(store)/cart/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Shield,
  AlertCircle,
  Bolt,
  Phone,
  ShieldCheck,
  CreditCard,
  Gift,
  Package,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useStore } from "@/lib/context/StoreContext";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BundleGroup {
  bundleId: string;
  bundleInstanceId: string;
  bundleName: string;
  items: any[];
  discount_type?: string;
  discount_value?: number;
}

export default function CartPage() {
  const { cartItems, clearCart } = useCart();
  const { dispatch } = useStore();
  const [bundles, setBundles] = useState<Map<string, BundleGroup>>(new Map());
  const [regularItems, setRegularItems] = useState<any[]>([]);

  // Group cart items by bundle
  useEffect(() => {
    const bundleMap = new Map<string, BundleGroup>();
    const regular: any[] = [];

    cartItems.forEach((item) => {
      if (item.metadata?.isBundleItem && item.metadata.bundleInstanceId) {
        const instanceId = item.metadata.bundleInstanceId;
        if (!bundleMap.has(instanceId)) {
          bundleMap.set(instanceId, {
            bundleId: item.metadata.bundleId,
            bundleInstanceId: instanceId,
            bundleName: item.metadata.bundleName,
            discount_type: item.metadata.discount_type,
            discount_value: item.metadata.discount_value,
            items: [],
          });
        }
        bundleMap.get(instanceId)!.items.push(item);
      } else {
        regular.push(item);
      }
    });

    setBundles(bundleMap);
    setRegularItems(regular);
  }, [cartItems]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0,
  );

  const updateQuantity = (
    productId: string,
    quantity: number,
    metadata?: any,
  ) => {
    if (quantity < 1) {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: { productId },
      });

      // If this was a bundle item, check if we need to remove the entire bundle
      if (metadata?.isBundleItem && metadata.bundleInstanceId) {
        const remainingBundleItems = cartItems.filter(
          (item) =>
            item.metadata?.bundleInstanceId === metadata.bundleInstanceId &&
            item.product.id !== productId,
        );

        if (remainingBundleItems.length === 0) {
          // Clear the pending bundle from localStorage
          localStorage.removeItem("pending_bundle");
          toast.info("Bundle removed from cart");
        }
      }

      toast.success("Item removed from cart");
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, quantity },
      });
      toast.success("Quantity updated");
    }
  };

  const removeBundle = (bundleInstanceId: string) => {
    // Remove all items in this bundle
    const bundleItems = cartItems.filter(
      (item) => item.metadata?.bundleInstanceId === bundleInstanceId,
    );

    bundleItems.forEach((item) => {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: { productId: item.product.id },
      });
    });

    // Clear from localStorage
    localStorage.removeItem("pending_bundle");
    toast.success("Bundle removed from cart");
  };

  const calculateBundleOriginalTotal = (bundleItems: any[]) => {
    return bundleItems.reduce((sum, item) => {
      return (
        sum +
        (item.metadata?.originalPrice || item.product.price) * item.quantity
      );
    }, 0);
  };

  const calculateBundleDiscountedTotal = (bundle: BundleGroup) => {
    const originalTotal = calculateBundleOriginalTotal(bundle.items);

    if (bundle.discount_type === "percentage") {
      return originalTotal * (1 - (bundle.discount_value || 0) / 100);
    } else if (bundle.discount_type === "fixed") {
      return originalTotal - (bundle.discount_value || 0);
    }

    return originalTotal;
  };

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-2 py-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-24 w-24 mx-auto mb-6 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Your Cart is Empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Browse our premium products and add items to your cart to get
            started.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            <Link href="/products">
              <Bolt className="h-5 w-5 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-2 sm:px-4">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
          Your Cart
        </h1>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
          </Badge>
          <p className="text-muted-foreground text-sm">
            Review your items before checkout
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items - Main Focus */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Shopping Cart
                </h2>
                <Badge variant="outline">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  items
                </Badge>
              </div>
            </div>

            <div className="divide-y">
              {/* Render Bundles First */}
              {Array.from(bundles.values()).map((bundle) => {
                const originalTotal = calculateBundleOriginalTotal(
                  bundle.items,
                );
                const discountedTotal = calculateBundleDiscountedTotal(bundle);
                const savings = originalTotal - discountedTotal;

                return (
                  <div
                    key={bundle.bundleInstanceId}
                    className="p-6 bg-purple-50/30 dark:bg-purple-950/10"
                  >
                    {/* Bundle Header */}
                    <div className="mb-4 pb-4 border-b border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                              {bundle.bundleName} Bundle
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className="text-xs border-purple-300"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                Bundle Discount
                              </Badge>
                              {savings > 0 && (
                                <span className="text-xs text-green-600">
                                  Save {formatCurrency(savings, "KES")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBundle(bundle.bundleInstanceId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove Bundle
                        </Button>
                      </div>
                    </div>

                    {/* Bundle Items */}
                    <div className="space-y-4 pl-4">
                      {bundle.items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          {/* Product Image */}
                          <div className="w-full sm:w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                            {item.product.images?.[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name}
                                width={80}
                                height={80}
                                className="object-cover rounded-lg"
                              />
                            ) : (
                              <ShoppingBag className="h-6 w-6 text-gray-400" />
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {item.product.title || item.product.name}
                                </h4>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-sm line-through text-muted-foreground">
                                    {formatCurrency(
                                      item.metadata?.originalPrice ||
                                        item.product.price,
                                      "KES",
                                    )}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-purple-100 text-purple-700"
                                  >
                                    Bundle Price
                                  </Badge>
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="flex items-center border rounded-lg">
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.product.id,
                                        item.quantity - 1,
                                        item.metadata,
                                      )
                                    }
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-10 text-center font-medium">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.product.id,
                                        item.quantity + 1,
                                        item.metadata,
                                      )
                                    }
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-lg transition-colors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>

                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product.id,
                                      0,
                                      item.metadata,
                                    )
                                  }
                                  className="text-sm text-red-500 hover:text-red-700 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="mt-2 pt-2 border-t flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Item total
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(
                                  (item.metadata?.originalPrice ||
                                    item.product.price) * item.quantity,
                                  "KES",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bundle Total */}
                    <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Bundle Total</span>
                        <div className="text-right">
                          {savings > 0 && (
                            <span className="text-sm line-through text-muted-foreground block">
                              {formatCurrency(originalTotal, "KES")}
                            </span>
                          )}
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(discountedTotal, "KES")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Regular Items */}
              {regularItems.map((item) => (
                <div key={item.product.id} className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <h3 className="font-medium text-lg text-gray-900 dark:text-white">
                              {item.product.title || item.product.name}
                            </h3>
                            {item.product.isDealOfTheDay && (
                              <Badge className="bg-red-500 border-0 text-white text-xs">
                                🔥 Deal
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">
                            {item.product.description?.substring(0, 100)}...
                          </p>
                          <div className="mt-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(item.product.price, "KES")}
                            </p>
                            {item.product.wholesale_price &&
                              item.quantity >=
                                (item.product.wholesale_min_quantity || 2) && (
                                <p className="text-sm text-green-600 mt-1">
                                  ✓ Wholesale price applied
                                </p>
                              )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                )
                              }
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-10 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                )
                              }
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-lg transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => updateQuantity(item.product.id, 0)}
                            className="text-sm text-red-500 hover:text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Item total
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(
                            item.product.price * item.quantity,
                            "KES",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-6 border-t flex flex-col sm:flex-row gap-4 justify-between">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/products">
                  <Plus className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Clear Entire Cart
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Summary - Purely Informational */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <ShoppingBag className="h-5 w-5" />
                Order Summary
              </h2>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Subtotal */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-lg text-gray-900 dark:text-white">
                    {formatCurrency(subtotal, "KES")}
                  </span>
                </div>

                {/* Bundle Savings Summary */}
                {Array.from(bundles.values()).map((bundle) => {
                  const originalTotal = calculateBundleOriginalTotal(
                    bundle.items,
                  );
                  const discountedTotal =
                    calculateBundleDiscountedTotal(bundle);
                  const savings = originalTotal - discountedTotal;

                  if (savings > 0) {
                    return (
                      <div
                        key={bundle.bundleInstanceId}
                        className="text-sm text-green-600"
                      >
                        <span>{bundle.bundleName} bundle savings: </span>
                        <span className="font-medium">
                          -{formatCurrency(savings, "KES")}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}

                <div className="text-sm text-muted-foreground italic">
                  Shipping, taxes, and additional discounts calculated at
                  checkout
                </div>
              </div>

              {/* Checkout Button */}
              <div className="pt-4 border-t">
                <Button
                  asChild
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Link href="/checkout">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </Link>
                </Button>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-3 w-3" />
                    Secure checkout with M-Pesa & Cards
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Store Benefits - Informational */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Shopping Benefits</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Same-Day Delivery Available</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span>2-Year Warranty on Most Products</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <span>30-Day Return Policy</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-purple-600" />
                  <span>Professional Installation Available</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <a href="tel:0727833691">
                    <Phone className="h-4 w-4 mr-2" />
                    Need Help? Call 0727 833 691
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
