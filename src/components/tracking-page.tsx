"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Home,
  Users,
  FileText,
  Printer,
  Download,
  Share2,
  ShoppingBag,
  Calendar,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Hash,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";

interface TrackingOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_county: string;
  shipping_country: string;
  shipping_postal_code: string;
  shipping_method: string;
  shipping_total: number;
  estimated_delivery: string;
  total_amount: number;
  currency: string;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "completed";
  payment_status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded";
  payment_method: string;
  payment_reference: string;
  subtotal: number;
  wholesale_savings: number;
  coupon_discount: number;
  installation_cost: number;
  installation_required: boolean;
  tracking_number: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  items: Array<{
    id: string;
    product_name: string;
    product_title: string;
    product_sku: string;
    product_category: string;
    product_image: string;
    unit_price: number;
    wholesale_price: number;
    has_wholesale: boolean;
    applied_price: number;
    quantity: number;
    total_price: number;
  }>;
  metadata?: any;
}

interface TrackingHistory {
  id: string;
  status: string;
  description?: string;
  location?: string;
  tracking_number: string;
  shipping_method?: string;
  estimated_delivery?: string;
  created_at: string;
}

interface Transaction {
  id: string;
  order_id: string;
  gateway: string;
  amount: number;
  currency: string;
  status: string;
  receipt_number: string;
  phone_number?: string;
  payload?: any;
  created_at: string;
}

interface TrackingData {
  orders: TrackingOrder[];
  trackingHistory: TrackingHistory[];
  transactions: Transaction[];
}

const TRACKING_STEPS = [
  {
    status: "pending",
    label: "Order Placed",
    icon: FileText,
    color: "bg-gray-500",
  },
  {
    status: "processing",
    label: "Processing",
    icon: Package,
    color: "bg-blue-500",
  },
  { status: "shipped", label: "Shipped", icon: Truck, color: "bg-purple-500" },
  {
    status: "delivered",
    label: "Delivered",
    icon: Home,
    color: "bg-green-500",
  },
  {
    status: "completed",
    label: "Completed",
    icon: CheckCircle,
    color: "bg-green-600",
  },
];

export default function TrackingPage({
  trackingData,
  trackingNumber,
}: {
  trackingData: TrackingData;
  trackingNumber: string;
}) {
  const [copied, setCopied] = useState(false);
  const { orders, trackingHistory, transactions } = trackingData;
  const mainOrder = orders[0];

  // Calculate current step index based on order status
  const getCurrentStepIndex = () => {
    const steps = TRACKING_STEPS.map((s) => s.status);
    const currentStatus = mainOrder.status;
    let stepIndex = steps.indexOf(currentStatus);

    // If status is delivered or completed, show all steps completed
    if (currentStatus === "delivered" || currentStatus === "completed") {
      return steps.length - 1;
    }

    // If shipped, show step before delivered
    if (currentStatus === "shipped") {
      return steps.length - 2;
    }

    // Default to first step if not found
    return Math.max(stepIndex, 0);
  };

  const currentStepIndex = getCurrentStepIndex();

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    toast.success("Tracking number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTracking = () => {
    if (navigator.share) {
      navigator.share({
        title: `Track Order #${trackingNumber}`,
        text: `Track my Blessed Two Electronics order: ${trackingNumber}`,
        url: window.location.href,
      });
    } else {
      copyTrackingNumber();
    }
  };

  const printTracking = () => {
    window.print();
  };

  // Calculate total items and amount
  const totalItems = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );

  const totalAmount = orders.reduce(
    (sum, order) => sum + order.total_amount,
    0,
  );
  const currency = mainOrder.currency || "KES";

  // Format status for display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format payment status for display
  const getPaymentBadge = (status: string) => {
    switch (status) {
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
      case "refunded":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            ↩️ Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get estimated delivery date
  const getEstimatedDelivery = () => {
    if (mainOrder.estimated_delivery) {
      return mainOrder.estimated_delivery;
    }
    if (mainOrder.created_at) {
      const orderDate = new Date(mainOrder.created_at);
      const estimatedDate = new Date(orderDate);
      estimatedDate.setDate(
        estimatedDate.getDate() +
          (mainOrder.shipping_method === "express" ? 2 : 7),
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

  // Get transaction for an order
  const getOrderTransaction = (orderId: string) => {
    return transactions.find((tx) => tx.order_id === orderId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-2 sm:px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Track Your Order
              </h1>
              <p className="text-muted-foreground">
                Real-time updates for your Blessed Two Electronics shipment
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={shareTracking}
                className="border-amber-500 text-amber-600 hover:bg-amber-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" onClick={printTracking}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Tracking Overview Card */}
        <Card className="mb-8 border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Tracking #{trackingNumber}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(mainOrder.status)}
                      {getPaymentBadge(mainOrder.payment_status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Order Number
                    </p>
                    <p className="text-lg font-bold">
                      {mainOrder.order_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-lg font-bold">{totalItems}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(totalAmount, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="text-lg font-bold">
                      {format(new Date(mainOrder.created_at), "MMM dd")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={copyTrackingNumber}
                  variant={copied ? "default" : "outline"}
                  className={cn(
                    "border-amber-500",
                    copied
                      ? "bg-green-500 hover:bg-green-600"
                      : "text-amber-600 hover:bg-amber-50",
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-4 w-4 mr-2" />
                      Copy Tracking
                    </>
                  )}
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                >
                  <a href={"tel:0727833691"}>
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Timeline */}
            <Card>
              <CardContent>
                <div className="flex flex-warp justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Shipment Progress</h3>
                  <Badge variant="outline">
                    {currentStepIndex + 1} of {TRACKING_STEPS.length} steps
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="relative mb-8">
                  <Progress
                    value={
                      ((currentStepIndex + 1) / TRACKING_STEPS.length) * 100
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between items-start mt-4 relative overflow-auto">
                    {TRACKING_STEPS.map((step, index) => (
                      <div
                        key={step.status}
                        className="flex flex-col items-center relative z-10"
                      >
                        {/* Progress line between steps */}
                        {index > 0 && (
                          <div
                            className="absolute top-5 -left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"
                            style={{ width: "calc(100% + 1rem)" }}
                          />
                        )}

                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2",
                            index <= currentStepIndex
                              ? `${step.color} text-white border-white shadow-lg`
                              : "bg-gray-200 dark:bg-gray-700 text-gray-500 border-gray-300",
                          )}
                        >
                          <step.icon className="h-5 w-5" />
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium whitespace-nowrap text-center pl-2",
                            index <= currentStepIndex
                              ? "text-gray-900 dark:text-white font-semibold"
                              : "text-gray-500",
                          )}
                        >
                          {step.label}
                        </span>
                        {index === currentStepIndex && (
                          <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-xs">
                            Current Status
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Dates */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Order Placed
                    </p>
                    <p className="font-medium text-sm">
                      {format(new Date(mainOrder.created_at), "MMM dd")}
                    </p>
                  </div>
                  {mainOrder.shipped_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Shipped</p>
                      <p className="font-medium text-sm">
                        {format(new Date(mainOrder.shipped_at), "MMM dd")}
                      </p>
                    </div>
                  )}
                  {mainOrder.delivered_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                      <p className="font-medium text-sm">
                        {format(new Date(mainOrder.delivered_at), "MMM dd")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Est. Delivery
                    </p>
                    <p className="font-medium text-sm">
                      {getEstimatedDelivery()}
                    </p>
                  </div>
                </div>

                {/* Tracking History */}
                <div className="space-y-4">
                  <h4 className="font-medium">Recent Updates</h4>
                  {trackingHistory.length > 0 ? (
                    <div className="space-y-3">
                      {trackingHistory.map((update) => (
                        <div
                          key={update.id}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          <div className="mt-1">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full",
                                update.status === "delivered" ||
                                  update.status === "completed"
                                  ? "bg-green-500"
                                  : update.status === "shipped"
                                    ? "bg-blue-500"
                                    : "bg-amber-500",
                              )}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-medium capitalize">
                                {update.description || update.status}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(update.created_at),
                                  "MMM dd, HH:mm",
                                )}
                              </p>
                            </div>
                            {update.location && (
                              <p className="text-sm text-muted-foreground">
                                📍 {update.location}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No updates available yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Check back soon for tracking updates
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardContent>
                <h3 className="text-lg font-bold mb-6">Order Details</h3>

                {orders.map((order, orderIndex) => {
                  const orderTransaction = getOrderTransaction(order.id);
                  return (
                    <div
                      key={order.id}
                      className={orderIndex > 0 ? "mt-6 pt-6 border-t" : ""}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            {order.order_number}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Placed on{" "}
                            {format(
                              new Date(order.created_at),
                              "MMMM dd, yyyy HH:mm",
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(order.status)}
                          <div className="text-xs text-muted-foreground">
                            Payment: {getPaymentBadge(order.payment_status)}
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-3 mb-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-lg border"
                          >
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <p className="font-medium">
                                    {item.product_title || item.product_name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      SKU: {item.product_sku}
                                    </Badge>
                                    {item.has_wholesale &&
                                      item.applied_price ===
                                        item.wholesale_price && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                          Wholesale
                                        </Badge>
                                      )}
                                  </div>
                                </div>
                                <p className="font-medium">
                                  {formatCurrency(item.total_price, currency)}
                                </p>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <p className="text-muted-foreground">
                                  Qty: {item.quantity}
                                </p>
                                <p className="text-muted-foreground">
                                  {formatCurrency(item.applied_price, currency)}{" "}
                                  each
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Subtotal
                            </span>
                            <span>
                              {formatCurrency(order.subtotal, currency)}
                            </span>
                          </div>

                          {order.wholesale_savings > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span className="text-muted-foreground">
                                Wholesale Savings
                              </span>
                              <span>
                                -
                                {formatCurrency(
                                  order.wholesale_savings,
                                  currency,
                                )}
                              </span>
                            </div>
                          )}

                          {order.coupon_discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span className="text-muted-foreground">
                                Coupon Discount
                              </span>
                              <span>
                                -
                                {formatCurrency(
                                  order.coupon_discount,
                                  currency,
                                )}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Shipping
                            </span>
                            <span>
                              {formatCurrency(order.shipping_total, currency)}
                            </span>
                          </div>

                          {order.installation_cost > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Installation
                              </span>
                              <span>
                                {formatCurrency(
                                  order.installation_cost,
                                  currency,
                                )}
                              </span>
                            </div>
                          )}

                          <Separator />

                          <div className="flex justify-between font-bold pt-2">
                            <span>Total</span>
                            <span className="text-lg text-green-600">
                              {formatCurrency(order.total_amount, currency)}
                            </span>
                          </div>

                          {orderTransaction && (
                            <>
                              <Separator className="my-2" />
                              <div className="text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Payment Method
                                  </span>
                                  <span className="font-medium capitalize">
                                    {order.payment_method}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Payment Status
                                  </span>
                                  <span className="font-medium capitalize">
                                    {order.payment_status}
                                  </span>
                                </div>
                                {orderTransaction.receipt_number && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Receipt #
                                    </span>
                                    <span className="font-mono">
                                      {orderTransaction.receipt_number}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Shipping Info Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardContent>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  Customer Information
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{mainOrder.customer_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <a
                      href={`tel:${mainOrder.customer_phone}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {mainOrder.customer_phone}
                    </a>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <a
                      href={`mailto:${mainOrder.customer_email}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {mainOrder.customer_email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardContent>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  Shipping Address
                </h3>

                <address className="not-italic space-y-2">
                  <p className="font-medium">{mainOrder.customer_name}</p>
                  <p>{mainOrder.shipping_address}</p>
                  <p>
                    {mainOrder.shipping_city}, {mainOrder.shipping_county}
                  </p>
                  <p>{mainOrder.shipping_country}</p>
                  {mainOrder.shipping_postal_code && (
                    <p className="text-muted-foreground">
                      Postal: {mainOrder.shipping_postal_code}
                    </p>
                  )}
                </address>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Shipping Method
                      </p>
                      <p className="font-medium capitalize">
                        {mainOrder.shipping_method}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Estimated Delivery
                      </p>
                      <p className="font-medium">{getEstimatedDelivery()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardContent>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-500" />
                  Delivery Information
                </h3>

                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Important Notes
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        Please ensure someone is available to receive the
                        package
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        Have your ID ready for verification
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        Contact support if you need to reschedule
                      </li>
                    </ul>
                  </div>

                  {mainOrder.installation_required && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Installation Service
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        A technician will contact you to schedule the
                        installation. Please ensure all items are accessible.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
              <CardContent>
                <h3 className="text-lg font-bold mb-4">Need Help?</h3>

                <div className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <a href={`tel:0727833691`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Support
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <a href="mailto:support@blessedtwo.com">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Support
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/contact">
                      <Users className="h-4 w-4 mr-2" />
                      Contact Form
                    </Link>
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Customer Support Hours:</p>
                  <p>Monday - Friday: 8:00 AM - 8:00 PM</p>
                  <p>Saturday: 9:00 AM - 6:00 PM</p>
                  <p>Sunday: 10:00 AM - 4:00 PM EAT</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold">Shop More Products</h3>
            <p className="text-muted-foreground max-w-2xl">
              Explore our wide range of electronics, home appliances, and
              lighting solutions for your home or business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
              >
                <Link href="/products">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse Products
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Copy icon component
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
