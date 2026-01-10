"use client";

import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useStore } from "@/lib/context/StoreContext";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, quantity },
      });
    }
  };

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-2 py-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-24 w-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some demo products to test the complete checkout experience.
          </p>
          <Button asChild size="lg">
            <Link href="/products">Browse Demo Products</Link>
          </Button>
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
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <ShoppingBag className="w-3 h-3 mr-1" />
            Demo Experience
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Shopping Cart</h1>
        <p className="text-muted-foreground max-w-3xl">
          Review your items below. The next step will showcase our customizable
          checkout flow with shipping and payment integration.
        </p>
      </div>

      {/* Checkout Preview Banner */}
      <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-lg">
                  Next: Test the Complete Checkout Flow
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                After reviewing your cart, you'll proceed to a fully functional
                checkout demo. You'll see how we implement shipping
                calculations, address forms, and M-Pesa integration in custom
                stores.
              </p>
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
          <Card>
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Your Items ({cartItems.length})
                </h2>
                <Badge variant="outline">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  total items
                </Badge>
              </div>
            </div>

            <div className="divide-y">
              {cartItems.map((item) => (
                <div key={item.product.id} className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="w-full sm:w-24 h-24 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden border">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <h3 className="font-medium text-lg">
                              {item.product.title || item.product.name}
                            </h3>
                            {item.product.category && (
                              <Badge variant="secondary" className="text-xs">
                                {item.product.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">
                            {item.product.description?.substring(0, 80)}...
                          </p>
                          <p className="font-semibold text-primary mt-2">
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
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1
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
                                  item.quantity + 1
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
                        <span className="font-bold">
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

            <div className="p-6 border-t flex flex-col sm:flex-row gap-4 justify-between">
              <Button variant="outline" asChild className="w-full sm:w-auto">
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
          <Card className="sticky top-24">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Order Summary
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(
                      total,
                      cartItems[0]?.product.currency || "USD"
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-sm text-muted-foreground">
                    Calculated at checkout
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-sm text-muted-foreground">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Estimated Total</span>
                  <span>
                    {formatCurrency(
                      total,
                      cartItems[0]?.product.currency || "USD"
                    )}
                  </span>
                </div>
              </div>

              {/* Demo Note */}
              <div className="pt-4 border-t">
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      Actual Store Experience
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      This is a live checkout flow for demonstration purposes.
                      Transactions will be processed if completed.
                    </p>
                  </div>
                </div>
              </div>

              <Button asChild className="w-full mt-6 h-12 text-lg">
                <Link href="/checkout">Proceed to Checkout Demo →</Link>
              </Button>
            </div>
          </Card>

          {/* Custom Store CTA */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3">Need a Custom Store?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This demo shows our checkout capabilities. We can build a
                complete store with your products, branding, and custom
                workflows.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full border-blue-300"
              >
                <Link href="/contact">Get Custom Store Quote</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
