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
  Truck,
  CreditCard as CreditCardIcon,
  Calendar,
  Hash,
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
  const router = useRouter();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch real order details
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch order: ${res.status}`);
        }
        const data = await res.json();

        setOrderDetails(data);

        // Check if payment is completed based on new statuses
        const isPaid =
          data.payment_status === "completed" ||
          data.status === "completed" ||
          data.status === "processing";
        setPaymentComplete(isPaid);

        // 🎉 Launch epic confetti on success
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

        // Clear pending order and cart from state
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
      // If no orderId, redirect to home
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
          <div className="space-y-3">
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
          (orderDetails.shipping_method === "express" ? 2 : 7)
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
                              orderDetails.created_at
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
                                  orderDetails.currency
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {orderDetails.items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {item.product_title || item.product_name}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Qty: {item.quantity}
                              </Badge>
                              {item.has_wholesale &&
                                item.applied_price === item.wholesale_price && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    Wholesale Price
                                  </Badge>
                                )}
                              <span className="text-sm text-muted-foreground">
                                @{" "}
                                {formatCurrency(
                                  item.applied_price,
                                  orderDetails.currency
                                )}
                              </span>
                            </div>
                          </div>
                          <p className="font-bold">
                            {formatCurrency(
                              item.total_price ||
                                item.applied_price * item.quantity,
                              orderDetails.currency
                            )}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>
                          {formatCurrency(
                            orderDetails.subtotal,
                            orderDetails.currency
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
                              orderDetails.currency
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
                              orderDetails.currency
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>
                          {formatCurrency(
                            orderDetails.shipping_total,
                            orderDetails.currency
                          )}
                        </span>
                      </div>

                      {orderDetails.installation_cost > 0 && (
                        <div className="flex justify-between">
                          <span>Installation Service</span>
                          <span>
                            {formatCurrency(
                              orderDetails.installation_cost,
                              orderDetails.currency
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
                            orderDetails.currency
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
                              orderDetails.currency
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
                      <div className="p-4 border rounded-lg bg-blue-50">
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
                                  orderDetails.installation_date
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
                          <Button size="sm" variant="outline">
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
                  <h3 className="font-bold text-lg">
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
                    <Link
                      href={`/checkout/payment/${
                        orderDetails.payment_method === "paypal"
                          ? "paypal"
                          : "mpesa"
                      }?orderId=${orderId}`}
                    >
                      Complete Payment Now
                    </Link>
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
            <CardContent className="space-y-6">
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
                      <Link href="/account/orders">
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
                    {orderDetails.payment_method === "mpesa" && (
                      <Button asChild className="w-full">
                        <Link
                          href={`/checkout/payment/mpesa?orderId=${orderId}`}
                        >
                          <Smartphone className="h-4 w-4 mr-2" />
                          Complete M-Pesa Payment
                        </Link>
                      </Button>
                    )}

                    {orderDetails.payment_method === "paypal" && (
                      <Button asChild className="w-full">
                        <Link
                          href={`/checkout/payment/paypal?orderId=${orderId}`}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Complete PayPal Payment
                        </Link>
                      </Button>
                    )}

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
                    <Link href="/account">
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
                    Email: support@worldsamma.com
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Payment Issues</p>
                  <p className="text-sm text-muted-foreground">
                    Phone: +254 700 000 000
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
