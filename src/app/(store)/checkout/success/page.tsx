"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Package,
  FileDown,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Settings,
  TrendingUp,
  Smartphone,
  Sparkles,
  Trophy,
  Eye,
  Clock,
  MapPin,
  Mail,
  Phone,
  Truck,
  CreditCard as CreditCardIcon,
  Calendar,
  Hash,
  Gift,
  Coins,
  Layers,
  Tag,
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
  searchParams: Promise<{ orderId?: string; paymentMethod?: string }>;
}) {
  const { orderId, paymentMethod } = use(searchParams);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { dispatch } = useStore();
  const { profile } = useAuth();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("success");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [countdown, setCountdown] = useState(60);

  // Start countdown when payment is initiated successfully
  useEffect(() => {
    if (paymentStatus === "success") {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 60000);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [paymentStatus]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch order: ${res.status}`);
        }
        const data = await res.json();

        setOrderDetails(data);

        const isPaid =
          data.payment_status === "completed" ||
          data.status === "completed" ||
          data.status === "processing";
        setPaymentComplete(isPaid);

        if (isPaid) {
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

        dispatch({ type: "CLEAR_PENDING_ORDER" });
        dispatch({ type: "CLEAR_CART" });
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    } else {
      router.push("/");
    }
  }, [orderId, dispatch, router]);

  // Celebration animation for paid orders
  useEffect(() => {
    if (paymentComplete) {
      const timer = setTimeout(() => {
        toast.success("💰 Payment successful!", {
          description: "Your order has been confirmed",
          duration: 5000,
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [paymentComplete]);

  const handleMPesaPayment = async () => {
    setPaymentStatus("processing");

    try {
      if (!profile) {
        toast.info("Haven't logged in yet, redirecting to login...");
        return router.push("/login");
      }

      if (!phoneNumber) {
        setPaymentStatus("error");
        setErrorMessage("Please enter your phone number.");
        toast.error("Please enter your phone number.");
        return;
      }

      const res = await fetch("/api/checkout/mpesa/retrial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderDetails.id, phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setPaymentStatus("error");
        setErrorMessage(data.error || "Failed to initiate M-Pesa payment.");
        toast.error(data.error || "Failed to initiate M-Pesa payment.");
        return;
      }

      setPaymentStatus("success");

      toast.success(
        "M-Pesa payment initiated successfully! Please complete the payment on your phone.",
      );

      const { orderId: confirmedOrderId, data: mpesaResponse } = data;

      if (mpesaResponse?.CustomerMessage) {
        toast.info(mpesaResponse.CustomerMessage);
      }

      router.push(`/checkout/success?orderId=${confirmedOrderId}`);
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      setErrorMessage(
        "There was an error processing your M-Pesa payment. Please try again.",
      );
      toast.error(
        "There was an error processing your M-Pesa payment. Please try again.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="animate-spin h-12 w-12 border-2 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-3">Loading Your Order</h2>
          <p className="text-muted-foreground">
            We're retrieving your order details... just a moment!
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
            We couldn't find your order details. Please check your email for
            confirmation or contact support.
          </p>
          <div className="flex items-center space-x-3 w-full justify-evenly">
            <Button asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOrderPaid = paymentComplete;
  const isPending = orderDetails.payment_status === "pending";
  const isFailed = orderDetails.payment_status === "failed";

  // Check if order contains a bundle
  const hasBundle = orderDetails.metadata?.bundle;
  const bundleData = hasBundle ? orderDetails.metadata.bundle : null;

  // Group items by variant for display
  const groupedItems = orderDetails.items?.reduce((acc: any, item: any) => {
    const key = item.variant
      ? `${item.product_id}-${item.variant}`
      : item.product_id;
    if (!acc[key]) {
      acc[key] = {
        ...item,
        variant_details: item.variant ? JSON.parse(item.variant) : null,
      };
    }
    return acc;
  }, {});

  const orderItems = groupedItems
    ? Object.values(groupedItems)
    : orderDetails.items || [];

  // Format status for display
  const getStatusBadge = () => {
    switch (orderDetails.status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            ✓ Delivered
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            🚚 Shipped
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            ⚙️ Processing
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            ⏳ Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            ✗ Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{orderDetails.status}</Badge>;
    }
  };

  // Format payment status for display
  const getPaymentBadge = () => {
    switch (orderDetails.payment_status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            💰 Paid
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            ⏳ Processing
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            ⏳ Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            ✗ Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{orderDetails.payment_status}</Badge>;
    }
  };

  // Calculate estimated delivery date
  const getEstimatedDelivery = () => {
    if (orderDetails.estimated_delivery) {
      return orderDetails.estimated_delivery;
    }
    if (orderDetails.created_at) {
      const orderDate = new Date(orderDetails.created_at);
      const estimatedDate = new Date(orderDate);
      estimatedDate.setDate(
        estimatedDate.getDate() +
          (orderDetails.shipping_method === "express" ? 2 : 7),
      );
      return estimatedDate.toLocaleDateString("en-KE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return "Within 7 business days";
  };

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4 max-w-7xl">
      {/* 🎉 Celebration Header */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div
            className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${
              isOrderPaid
                ? "bg-gradient-to-br from-green-500 to-emerald-400"
                : isPending
                  ? "bg-gradient-to-br from-amber-500 to-orange-400"
                  : "bg-gradient-to-br from-red-500 to-pink-400"
            }`}
          >
            {isOrderPaid ? (
              <Trophy className="h-10 w-10 text-white" />
            ) : isPending ? (
              <Clock className="h-10 w-10 text-white" />
            ) : (
              <XCircle className="h-10 w-10 text-white" />
            )}
          </div>
          <div className="absolute -top-2 -right-4">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
          </div>
        </div>

        <Badge
          className={`mb-4 text-white border-0 ${
            isOrderPaid
              ? "bg-gradient-to-r from-green-500 to-emerald-500"
              : isPending
                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                : "bg-gradient-to-r from-red-500 to-pink-500"
          }`}
        >
          {isOrderPaid
            ? "🎯 Order Confirmed!"
            : isPending
              ? "⏳ Awaiting Payment"
              : "❌ Payment Failed"}
        </Badge>

        <h1 className="text-xl sm:text-4xl md:text-5xl font-bold mb-4">
          {isOrderPaid ? (
            <>
              Order #{orderDetails.order_number}{" "}
              <span className="text-green-600">Confirmed!</span>
            </>
          ) : isPending ? (
            "Order Received - Payment Pending"
          ) : (
            "Payment Failed - Please Try Again"
          )}
        </h1>

        <p className="sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          {isOrderPaid
            ? `Thank you for your order! A confirmation has been sent to ${orderDetails.customer_email}.`
            : isPending
              ? "Please complete your payment to confirm your order. Check your email for payment instructions."
              : "We encountered an issue processing your payment. Please try again or contact support."}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 📦 Order Details & Journey */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="details">Order Summary</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 pt-4">
                  {/* Order Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-3">Order Information</h3>
                        <div className="space-y-2">
                          <InfoItem
                            icon={<Hash className="h-4 w-4" />}
                            label="Order Number"
                            value={orderDetails.order_number}
                          />
                          <InfoItem
                            icon={<Calendar className="h-4 w-4" />}
                            label="Order Date"
                            value={new Date(
                              orderDetails.created_at,
                            ).toLocaleDateString("en-KE", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          />
                          <InfoItem
                            icon={<CreditCardIcon className="h-4 w-4" />}
                            label="Payment Method"
                            value={
                              orderDetails.payment_method?.toUpperCase() ||
                              "N/A"
                            }
                          />
                          <InfoItem
                            icon="🎯"
                            label="Order Status"
                            value={getStatusBadge()}
                          />
                          <InfoItem
                            icon="💰"
                            label="Payment Status"
                            value={getPaymentBadge()}
                          />
                        </div>
                      </div>

                      {orderDetails.payment_reference && (
                        <div>
                          <h3 className="font-medium mb-3">
                            Payment Reference
                          </h3>
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-sm font-mono break-all">
                              {orderDetails.payment_reference}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Customer Information</h3>
                      <div className="space-y-2">
                        <InfoItem
                          icon="👤"
                          label="Customer"
                          value={orderDetails.customer_name}
                        />
                        <InfoItem
                          icon={<Phone className="h-4 w-4" />}
                          label="Phone"
                          value={orderDetails.customer_phone}
                        />
                        <InfoItem
                          icon={<Mail className="h-4 w-4" />}
                          label="Email"
                          value={orderDetails.customer_email}
                        />
                      </div>

                      {orderDetails.coupon_code && (
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Coupon Applied</h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              {orderDetails.coupon_code}
                            </Badge>
                            {orderDetails.coupon_discount > 0 && (
                              <span className="text-sm text-green-600">
                                -
                                {formatCurrency(
                                  orderDetails.coupon_discount,
                                  orderDetails.currency,
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bundle Information */}
                  {hasBundle && bundleData && (
                    <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Gift className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                          {bundleData.bundle_name} Bundle
                        </h3>
                        <Badge className="bg-purple-200 text-purple-800 border-purple-300 ml-auto">
                          Bundle Savings
                        </Badge>
                      </div>
                      {bundleData.savings > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            You Saved:
                          </span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(
                              bundleData.savings,
                              orderDetails.currency,
                            )}
                          </span>
                        </div>
                      )}
                      {bundleData.points_required > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-sm">
                          <Coins className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-600">
                            {bundleData.points_required} loyalty points used
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {orderItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {item.product_title || item.product_name}
                                </p>
                                {item.variant && (
                                  <Badge variant="outline" className="text-xs">
                                    <Layers className="h-3 w-3 mr-1" />
                                    {item.variant.name || "Variant"}
                                  </Badge>
                                )}
                              </div>

                              {/* Variant Details */}
                              {item.variant && (
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                  {Object.entries(item.variant).map(
                                    ([key, value]) =>
                                      key !== "name" && (
                                        <div
                                          key={key}
                                          className="flex items-center gap-1"
                                        >
                                          <Tag className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-muted-foreground capitalize">
                                            {key}:
                                          </span>
                                          <span className="font-medium">
                                            {String(value)}
                                          </span>
                                        </div>
                                      ),
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Qty: {item.quantity}
                                </Badge>
                                {item.has_wholesale &&
                                  item.applied_price ===
                                    item.wholesale_price && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      Wholesale Price
                                    </Badge>
                                  )}
                                {item.metadata?.isBundleItem && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                  >
                                    <Gift className="h-3 w-3 mr-1" />
                                    Bundle Item
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {formatCurrency(
                                  item.total_price ||
                                    item.applied_price * item.quantity,
                                  orderDetails.currency,
                                )}
                              </p>
                              <span className="text-sm text-muted-foreground">
                                @{" "}
                                {formatCurrency(
                                  item.applied_price,
                                  orderDetails.currency,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>
                          {formatCurrency(
                            orderDetails.subtotal,
                            orderDetails.currency,
                          )}
                        </span>
                      </div>

                      {orderDetails.wholesale_savings > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Wholesale Savings</span>
                          <span>
                            -
                            {formatCurrency(
                              orderDetails.wholesale_savings,
                              orderDetails.currency,
                            )}
                          </span>
                        </div>
                      )}

                      {orderDetails.coupon_discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Coupon Discount</span>
                          <span>
                            -
                            {formatCurrency(
                              orderDetails.coupon_discount,
                              orderDetails.currency,
                            )}
                          </span>
                        </div>
                      )}

                      {orderDetails.loyalty_discount > 0 && (
                        <div className="flex justify-between text-purple-600">
                          <span>Loyalty Discount</span>
                          <span>
                            -
                            {formatCurrency(
                              orderDetails.loyalty_discount,
                              orderDetails.currency,
                            )}
                          </span>
                        </div>
                      )}

                      {hasBundle && bundleData?.savings > 0 && (
                        <div className="flex justify-between text-purple-600">
                          <span>Bundle Savings</span>
                          <span>
                            -
                            {formatCurrency(
                              bundleData.savings,
                              orderDetails.currency,
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>
                          {formatCurrency(
                            orderDetails.shipping_total,
                            orderDetails.currency,
                          )}
                        </span>
                      </div>

                      {orderDetails.installation_cost > 0 && (
                        <div className="flex justify-between">
                          <span>Installation Service</span>
                          <span>
                            {formatCurrency(
                              orderDetails.installation_cost,
                              orderDetails.currency,
                            )}
                          </span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between text-lg font-bold pt-2">
                        <span>Total Amount</span>
                        <span className="text-2xl text-green-600">
                          {formatCurrency(
                            orderDetails.total_amount,
                            orderDetails.currency,
                          )}
                        </span>
                      </div>

                      {isOrderPaid && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />✅ This amount has
                          been successfully processed
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="shipping" className="pt-4">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </h4>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {orderDetails.customer_name}
                        </p>
                        <p>{orderDetails.shipping_address}</p>
                        <p>
                          {orderDetails.shipping_city},{" "}
                          {orderDetails.shipping_county}
                        </p>
                        <p>
                          {orderDetails.shipping_country}{" "}
                          {orderDetails.shipping_postal_code}
                        </p>
                        <p className="pt-2">📱 {orderDetails.customer_phone}</p>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Shipping Details
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Method:</span>
                          <span className="font-medium capitalize">
                            {orderDetails.shipping_method}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost:</span>
                          <span>
                            {formatCurrency(
                              orderDetails.shipping_total,
                              orderDetails.currency,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Estimated Delivery:
                          </span>
                          <span className="font-medium">
                            {getEstimatedDelivery()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {orderDetails.installation_required && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Installation Service
                        </h4>
                        <div className="space-y-2">
                          <p className="font-medium">
                            {orderDetails.installation_service?.name ||
                              "Installation Service"}
                          </p>
                          {orderDetails.installation_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Scheduled Date:
                              </span>
                              <span>
                                {new Date(
                                  orderDetails.installation_date,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {orderDetails.installation_time && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Time:
                              </span>
                              <span className="capitalize">
                                {orderDetails.installation_time}
                              </span>
                            </div>
                          )}
                          {orderDetails.special_instructions && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground mb-1">
                                Special Instructions:
                              </p>
                              <p className="text-sm">
                                {orderDetails.special_instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {orderDetails.tracking_number && (
                      <div className="p-4 border rounded-lg bg-green-50">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Tracking Information
                        </h4>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Tracking #: {orderDetails.tracking_number}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!orderDetails.tracking_number}
                            onClick={() =>
                              router.push(
                                `/tracking/${orderDetails.tracking_number}`,
                              )
                            }
                          >
                            Track Shipment
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="pt-4">
                  <div className="space-y-4">
                    <TimelineStep
                      number={1}
                      title="Order Placed"
                      description="Your order was received and confirmed"
                      date={orderDetails.created_at}
                      completed={true}
                    />

                    <TimelineStep
                      number={2}
                      title="Payment Processing"
                      description={
                        isOrderPaid
                          ? "Payment was successfully processed"
                          : "Awaiting payment completion"
                      }
                      date={orderDetails.paid_at}
                      completed={isOrderPaid}
                    />

                    <TimelineStep
                      number={3}
                      title="Order Processing"
                      description="Your items are being prepared for shipment"
                      date={orderDetails.updated_at}
                      completed={isOrderPaid}
                    />

                    <TimelineStep
                      number={4}
                      title="Shipped"
                      description="Your order has been shipped"
                      date={orderDetails.shipped_at}
                      completed={
                        orderDetails.status === "shipped" ||
                        orderDetails.status === "delivered"
                      }
                    />

                    <TimelineStep
                      number={5}
                      title="Delivered"
                      description="Your order has been delivered"
                      date={orderDetails.delivered_at}
                      completed={orderDetails.status === "delivered"}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 🚀 What Happens Next */}
          <Card
            className={`border-2 ${
              isOrderPaid
                ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
                : "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
            }`}
          >
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isOrderPaid ? "bg-green-100" : "bg-amber-100"
                  }`}
                >
                  {isOrderPaid ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-black">
                    {isOrderPaid
                      ? "What Happens Next?"
                      : "Complete Payment to Confirm Order"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isOrderPaid
                      ? "Here's what to expect with your order"
                      : "Your order will be processed once payment is confirmed"}
                  </p>
                </div>
              </div>

              {isOrderPaid ? (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium">Order Processing</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We'll prepare your items for shipment within 24-48 hours
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">Shipping Updates</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You'll receive tracking information via email and SMS
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                  <p className="text-sm mb-3">
                    To complete your order, please check your email for payment
                    instructions or return to checkout to complete payment.
                  </p>
                  <Button asChild className="w-full">
                    <Link href={"#complete-payment"}>Complete Payment Now</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 🎯 Completion & Next Steps */}
        <div className="space-y-6">
          {/* Payment Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isOrderPaid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Order Confirmed
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-amber-600" />
                    Action Required
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent
              id="complete-payment"
              className="space-y-6 scroll-mt-20"
            >
              {/* 🚚 Sidebar Next Steps */}
              <div className="bg-background rounded-lg border p-4 sm:p-6 space-y-6 h-fit">
                {/* Payment Status Messages */}
                {paymentStatus === "processing" && (
                  <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center">
                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-blue-700 border-t-transparent rounded-full"></div>
                    <p>Processing your payment...</p>
                  </div>
                )}

                {paymentStatus === "success" && (
                  <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      <p className="font-medium">
                        Payment initiated successfully!
                      </p>
                    </div>

                    <p className="text-sm my-2">
                      Please check your phone to complete the MPESA payment.
                    </p>

                    <div className="space-x-2">
                      <p className="text-xs text-center mb-2 text-muted-foreground">
                        Page will auto-refresh in {countdown} seconds...
                      </p>

                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm w-full"
                      >
                        Refresh Now
                      </button>
                    </div>
                  </div>
                )}

                {paymentStatus === "error" && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    <p>{errorMessage}</p>
                  </div>
                )}
                {orderDetails.status === "pending" ? (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Payment Pending</h3>
                        <p className="text-muted-foreground text-sm">
                          Your order was placed, but payment hasn’t been
                          completed. Please finish your payment below.
                        </p>
                        <span className="text-xs text-muted-foreground mt-2">
                          📝 If you’ve already completed payment, reload this
                          page to refresh the status.
                        </span>
                      </div>
                    </div>

                    {/* Payment retry component */}
                    <div className="border rounded-lg p-4">
                      {orderDetails.shipping_info?.paymentMethod ===
                        "paypal" && (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800 border-red-200"
                        >
                          Recent Payment Method
                        </Badge>
                      )}
                      <Button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/checkout/processing/retrial?orderId=${orderDetails.id}`,
                          );
                        }}
                        className="w-full bg-[#0070ba] hover:bg-[#003087] text-white"
                      >
                        Retry with PayPal
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-grow border-t border-gray-200 opacity-50" />
                      <span className="text-sm text-muted-foreground">Or</span>
                      <div className="flex-grow border-t border-gray-200 opacity-50" />
                    </div>

                    <div className="border rounded-lg p-4 space-y-3">
                      {orderDetails.shipping_info?.paymentMethod ===
                        "mpesa" && (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800 border-red-200"
                        >
                          Recent Payment Method
                        </Badge>
                      )}
                      <input
                        type="tel"
                        placeholder="e.g., 254712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      />
                      <Button
                        type="button"
                        onClick={handleMPesaPayment}
                        className="w-full bg-[#4CAF50] hover:bg-[#388E3C] text-white"
                        disabled={
                          phoneNumber.length !== 12 ||
                          paymentStatus === "processing"
                        }
                      >
                        Retry with M-Pesa
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">What’s next?</h3>
                        <p className="text-muted-foreground text-sm">
                          We’re packing your items. You’ll get an email once
                          your order ships, with tracking info included.
                        </p>
                      </div>
                    </div>

                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/orders/${orderDetails.id}/invoice`}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download Invoice
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              {isOrderPaid ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">🎯</div>
                    <h3 className="font-bold text-lg mb-2">
                      Thank You for Your Order!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your order has been confirmed and is being processed
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href="/accounts">
                        <Eye className="h-4 w-4 mr-2" />
                        View All Orders
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/api/orders/${orderId}/invoice`}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download Invoice
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Complete your payment to confirm order
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your order will be reserved for 24 hours pending payment
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link href={"#complete-payment"}>
                        <Smartphone className="h-4 w-4 mr-2" />
                        Complete M-Pesa Payment
                      </Link>
                    </Button>
                    {orderDetails.payment_method === "cash_on_delivery" && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm">
                          Your order will be delivered and you'll pay upon
                          receipt.
                        </p>
                      </div>
                    )}
                  </div>
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
                    <Link href="/accounts">
                      <Settings className="h-4 w-4 mr-2" />
                      My Account
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Link href="/contact">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 📞 Need Help? */}
          <Card>
            <CardContent>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Need Help?
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Order Questions</p>
                  <p className="text-sm text-muted-foreground">
                    Email: info@blessedtwoelectricals.com
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Payment Issues</p>
                  <p className="text-sm text-muted-foreground">
                    Phone: +254 727 833 691
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
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
  icon: any;
  label: string;
  value: any;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function TimelineStep({
  number,
  title,
  description,
  date,
  completed = false,
}: {
  number: number;
  title: string;
  description: string;
  date?: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          completed ? "bg-green-100" : "bg-gray-100"
        }`}
      >
        <span
          className={`text-sm font-bold ${
            completed ? "text-green-600" : "text-gray-400"
          }`}
        >
          {number}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className={`font-medium ${completed ? "text-green-700" : ""}`}>
            {title}
          </h4>
          {date && (
            <span className="text-sm text-muted-foreground">
              {new Date(date).toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
