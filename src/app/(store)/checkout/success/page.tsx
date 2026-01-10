"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Package,
  ArrowRight,
  FileDown,
  XCircle,
  AlertCircle,
  BarChart3,
  Users,
  ShoppingBag,
  Settings,
  Shield,
  TrendingUp,
  CreditCard,
  Smartphone,
  Sparkles,
  Trophy,
  Download,
  Eye,
  Clock,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { useStore } from "@/lib/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; transactionId?: string }>;
}) {
  const { orderId, transactionId } = use(searchParams);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const router = useRouter();
  const { profile } = useAuth();
  const { dispatch } = useStore();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch real order details
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        setOrderDetails(data);
        setPaymentComplete(
          data.status === "paid" || data.status === "completed"
        );

        // 🎉 Launch epic confetti on success
        if (data.status === "paid" || data.status === "completed") {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
          });

          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 60,
              spread: 80,
              origin: { x: 0 },
            });
            confetti({
              particleCount: 100,
              angle: 120,
              spread: 80,
              origin: { x: 1 },
            });
          }, 250);
        }

        // Clear pending order and cart from state
        dispatch({ type: "CLEAR_PENDING_ORDER" });
        dispatch({ type: "CLEAR_CART" });
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, dispatch]);

  // Celebration animation for paid orders
  useEffect(() => {
    if (paymentComplete) {
      const timer = setTimeout(() => {
        toast.success("💰 Payment landed in your account!", {
          description: "Now you're ready to ship the order",
          duration: 5000,
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [paymentComplete]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="animate-spin h-12 w-12 border-2 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-3">Finalizing Your Order</h2>
          <p className="text-muted-foreground">
            We're completing the journey... just a moment!
          </p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="container mx-auto py-12 text-center">
        <div className="max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find your order details. Please contact support.
          </p>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOrderPaid =
    orderDetails.status === "paid" || orderDetails.status === "completed";

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      {/* 🎉 Celebration Header */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            {isOrderPaid ? (
              <Trophy className="h-10 w-10 text-white" />
            ) : (
              <Clock className="h-10 w-10 text-white" />
            )}
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
          </div>
        </div>

        <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
          {isOrderPaid ? "🎯 Mission Complete!" : "⏳ Awaiting Payment"}
        </Badge>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {isOrderPaid ? (
            <>
              Payment Successfully{" "}
              <span className="text-green-600">Landed!</span>
            </>
          ) : (
            "Order Received - Payment Pending"
          )}
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {isOrderPaid
            ? "The money is in your account! This demo shows exactly what your customers will experience."
            : "Complete the payment to see the full order fulfillment process."}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 📦 Order Details & Journey */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details & Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="details">Order Details</TabsTrigger>
                  <TabsTrigger value="journey">Customer Journey</TabsTrigger>
                  <TabsTrigger value="admin">Admin View</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 pt-4">
                  {/* Order Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-3">Order Information</h3>
                        <div className="space-y-2">
                          <InfoItem
                            icon="📦"
                            label="Order ID"
                            value={orderDetails.id}
                          />
                          <InfoItem
                            icon="📅"
                            label="Order Date"
                            value={new Date(
                              orderDetails.created_at
                            ).toLocaleDateString()}
                          />
                          <InfoItem
                            icon="💰"
                            label="Payment Method"
                            value={orderDetails.shipping_info?.paymentMethod?.toUpperCase()}
                          />
                          <InfoItem
                            icon="🎯"
                            label="Status"
                            value={
                              <Badge
                                className={
                                  isOrderPaid
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                }
                              >
                                {isOrderPaid ? "💰 PAID" : "⏳ PENDING"}
                              </Badge>
                            }
                          />
                        </div>
                      </div>

                      {transactionId && (
                        <div>
                          <h3 className="font-medium mb-3">
                            Payment Reference
                          </h3>
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-sm font-mono break-all">
                              {transactionId}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Shipping Information</h3>
                      <div className="space-y-2">
                        <InfoItem
                          icon="👤"
                          label="Customer"
                          value={`${orderDetails.shipping_info?.firstName} ${orderDetails.shipping_info?.lastName}`}
                        />
                        <InfoItem
                          icon="📱"
                          label="Phone"
                          value={orderDetails.shipping_info?.phone}
                        />
                        <InfoItem
                          icon="📧"
                          label="Email"
                          value={orderDetails.shipping_info?.email}
                        />
                        <InfoItem
                          icon="📍"
                          label="Location"
                          value={
                            <>
                              {orderDetails.shipping_info?.address}
                              <br />
                              {orderDetails.shipping_info?.city},{" "}
                              {orderDetails.shipping_info?.postalCode}
                            </>
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {orderDetails.order_items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.products.name}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Qty: {item.qty}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                @ {formatCurrency(item.unit_price, "KES")}
                              </span>
                            </div>
                          </div>
                          <p className="font-bold">
                            {formatCurrency(item.unit_price * item.qty, "KES")}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span className="text-2xl text-green-600">
                          {formatCurrency(orderDetails.total, "KES")}
                        </span>
                      </div>
                      {isOrderPaid && (
                        <p className="text-sm text-green-600 mt-2">
                          ✅ This amount has been deposited to your account
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="journey" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">
                          1
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">
                          Customer Browse & Select
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Customer browses products, adds to cart, and proceeds
                          to checkout
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">
                          2
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Checkout & Payment</h4>
                        <p className="text-sm text-muted-foreground">
                          Customer enters shipping details and completes payment
                          via M-Pesa/PayPal
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg bg-green-50">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-green-600">
                          3
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">
                          💰 Money Lands in Your Account
                        </h4>
                        <p className="text-sm text-green-700">
                          Payment is instantly deposited to your business
                          account
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">
                          4
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Order Fulfillment</h4>
                        <p className="text-sm text-muted-foreground">
                          You receive the order notification and prepare for
                          shipping
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="admin" className="pt-4">
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <h3 className="font-bold mb-4">
                      What You See in Your Admin Dashboard
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">
                          Real-time Analytics
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-sm font-medium">Customer Database</p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm font-medium">Order Management</p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <Settings className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                        <p className="text-sm font-medium">
                          Product Management
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/contact">
                        <Eye className="h-4 w-4 mr-2" />
                        Request Full Dashboard Demo
                      </Link>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 🚀 What Happens Next */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {isOrderPaid
                      ? "💰 Money Received! Now What?"
                      : "Complete Payment to Continue"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This is where your business journey continues
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium">Order Fulfillment</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Package the items, generate shipping labels, and update
                    tracking
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium">Customer Communication</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send automated updates via email/SMS at every stage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🎯 Completion & Next Steps */}
        <div className="space-y-6">
          {/* Payment Status & Actions */}
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isOrderPaid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Journey Complete!
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-amber-600" />
                    Awaiting Payment
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isOrderPaid ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">🎯</div>
                    <h3 className="font-bold text-lg mb-2">
                      Complete Demo Experience
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You've experienced the entire customer journey from start
                      to finish
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href="/contact">
                        <Shield className="h-4 w-4 mr-2" />
                        Get Your Custom Admin Dashboard
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/orders/${orderDetails.id}/invoice`}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download Invoice PDF
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Complete the payment to finish the journey
                    </p>
                    <p className="text-xs text-muted-foreground">
                      See how the full flow works when customers pay
                      successfully
                    </p>
                  </div>

                  {orderDetails.shipping_info?.paymentMethod === "mpesa" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          M-Pesa Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="254712345678"
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Complete Payment with M-Pesa
                      </Button>
                    </div>
                  )}
                </>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Link href="/">← Return to Home</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Link href="/products">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Link href="/contact">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      See Analytics Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🚀 Get Your Own Store */}
          <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-0">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🚀</div>
                <h3 className="font-bold text-lg mb-2">
                  Ready for Your Own Store?
                </h3>
                <p className="text-sm opacity-90">
                  This demo shows what we can build for your business
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Custom-branded store with your products
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Full admin dashboard with analytics
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  M-Pesa & PayPal integration
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  24/7 Kenyan support
                </li>
              </ul>

              <Button
                asChild
                className="w-full bg-white text-blue-600 hover:bg-white/90"
              >
                <Link href="/contact">
                  Get Your Custom Quote
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: any;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
