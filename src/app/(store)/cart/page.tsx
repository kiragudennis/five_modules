// src/app/(store)/cart/page.tsx
"use client";

import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Shield,
  AlertCircle,
  Bolt,
  MapPin,
  Phone,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useStore } from "@/lib/context/StoreContext";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CartPage() {
  const { cartItems, clearCart } = useCart();
  const { total } = useStore().state;
  const { dispatch } = useStore();

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: { productId },
      });
      toast.success("Item removed from cart");
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, quantity },
      });
      toast.success("Quantity updated");
    }
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
            Your Lighting Cart is Empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Add some premium lighting products to brighten up your space. Free
            Nairobi delivery on orders over KES 3,000.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            <Link href="/products">
              <Bolt className="h-5 w-5 mr-2" />
              Browse Lighting Products
            </Link>
          </Button>

          {/* Store Info */}
          <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg">
            <div className="flex items-center justify-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-amber-600" />
              <span>Visit our store: Duruma Road, Nairobi</span>
              <Phone className="h-4 w-4 text-amber-600" />
              <a
                href="tel:0700000000"
                className="text-amber-700 font-medium hover:underline"
              >
                0700 000 000
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-2 sm:px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-700"
          >
            <MapPin className="w-3 h-3 mr-1" />
            Duruma Road, Nairobi
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          Your Lighting Cart
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Review your selected lighting solutions. Free delivery within Nairobi
          on orders above KES 3,000. 2-Year warranty on all products.
        </p>
      </div>

      {/* Store Benefits Banner */}
      <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Why Shop With Blessed Two?
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-green-600" />
                  <span>Same-Day Nairobi Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>2-Year Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-600" />
                  <span>24/7 Expert Support</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Step 1 of 3
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card className="border-amber-100 dark:border-amber-800/30">
            <div className="p-6 border-b border-amber-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Selected Products
                </h2>
                <Badge variant="outline" className="border-amber-300">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  total items
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-amber-100">
              {cartItems.map((item) => (
                <div key={item.product.id} className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="w-full sm:w-24 h-24 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-amber-200">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-amber-400" />
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
                              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white text-xs">
                                🔥 Deal
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">
                            {item.product.description?.substring(0, 80)}...
                          </p>
                          <p className="font-semibold text-amber-600 mt-2">
                            {formatCurrency(
                              item.product.price,
                              item.product.currency
                            )}
                            {item.quantity > 1 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                × {item.quantity}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center border border-amber-300 rounded-lg">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-amber-50 rounded-l-lg transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-10 text-center font-medium text-amber-700">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-amber-50 rounded-r-lg transition-colors"
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
                      <div className="mt-4 pt-4 border-t border-amber-100 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Item total
                        </span>
                        <span className="font-bold text-amber-700">
                          {formatCurrency(
                            item.product.price * item.quantity,
                            item.product.currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-amber-100 flex flex-col sm:flex-row gap-4 justify-between">
              <Button
                variant="outline"
                asChild
                className="w-full sm:w-auto border-amber-300 text-amber-600 hover:bg-amber-50"
              >
                <Link href="/products">← Continue Shopping</Link>
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

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-amber-100 dark:border-amber-800/30">
            <div className="p-6 border-b border-amber-100">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <Shield className="h-5 w-5 text-amber-600" />
                Order Summary
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-amber-600">
                    {formatCurrency(
                      total,
                      cartItems[0]?.product.currency || "KES"
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-sm text-green-600 font-medium">
                    {total > 3000 ? "FREE" : "KES 300"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (16% VAT)</span>
                  <span className="text-sm text-muted-foreground">
                    {(total * 0.16).toFixed(2)} KES
                  </span>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Have a coupon?</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-amber-300 rounded text-sm"
                  />
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                    Apply
                  </Button>
                </div>
              </div>

              <div className="border-t border-amber-100 pt-4">
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Estimated Total</span>
                  <span className="text-amber-600">
                    {formatCurrency(
                      total + (total > 3000 ? 0 : 300) + total * 0.16,
                      "KES"
                    )}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {total > 3000
                    ? "✓ Eligible for free Nairobi delivery"
                    : "Add KES " + (3000 - total) + " more for free delivery"}
                </p>
              </div>

              {/* Important Notes */}
              <div className="pt-4 border-t border-amber-100">
                <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">
                      Important Information
                    </p>
                    <ul className="text-xs text-amber-700 mt-1 space-y-1">
                      <li>• 2-Year warranty on all lighting products</li>
                      <li>• Professional installation available</li>
                      <li>• 30-day return policy</li>
                      <li>• Same-day Nairobi delivery available</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                asChild
                className="w-full mt-6 h-12 text-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
              >
                <Link href="/checkout">
                  <Shield className="h-5 w-5 mr-2" />
                  Proceed to Secure Checkout →
                </Link>
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Secure checkout with M-Pesa & Credit Cards
                </p>
              </div>
            </div>
          </Card>

          {/* Store Support Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
                Need Expert Advice?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our lighting experts can help you choose the perfect solutions
                for your needs. Call us for free consultation.
              </p>
              <div className="space-y-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 justify-start"
                >
                  <a href="tel:0700000000">
                    <Phone className="h-4 w-4 mr-2" />
                    Call: 0700 000 000
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-amber-300 text-amber-600 hover:bg-amber-50 justify-start"
                >
                  <Link href="/contact">
                    <MapPin className="h-4 w-4 mr-2" />
                    Visit Our Store
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
