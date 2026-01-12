// components/TrackingPage.tsx
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TrackingOrder {
  id: string;
  shipping_info: any;
  total: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  tracking_number: string;
  created_at: string;
  order_items: Array<{
    id: string;
    qty: number;
    unit_price: number;
    products: {
      name: string;
      sku: string;
      images?: string[];
    };
  }>;
  transactions?: Array<{
    gateway: string;
    amount: number;
    status: string;
    phone_number?: string;
  }>;
}

interface TrackingHistory {
  id: string;
  status: string;
  tracking_number: string;
  shipping_method?: string;
  estimated_delivery?: string;
  created_at: string;
}

interface TrackingData {
  orders: TrackingOrder[];
  trackingHistory: TrackingHistory[];
}

const TRACKING_STEPS = [
  { status: "pending", label: "Order Placed", icon: FileText },
  { status: "paid", label: "Payment Confirmed", icon: CheckCircle },
  { status: "processing", label: "Processing", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: Home },
];

export default function TrackingPage({
  trackingData,
  trackingNumber,
}: {
  trackingData: TrackingData;
  trackingNumber: string;
}) {
  const [copied, setCopied] = useState(false);
  const { orders, trackingHistory } = trackingData;
  const mainOrder = orders[0];

  // Calculate current step index
  const getCurrentStepIndex = () => {
    const steps = TRACKING_STEPS.map((s) => s.status);
    const currentStatus = mainOrder.status;
    let stepIndex = steps.indexOf(currentStatus);

    // If status is delivered, show all steps completed
    if (currentStatus === "delivered") {
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
      sum + order.order_items.reduce((itemSum, item) => itemSum + item.qty, 0),
    0
  );

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);

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
          <CardContent className="p-6">
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
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      {mainOrder.status === "delivered"
                        ? "✅ Delivered"
                        : mainOrder.status === "shipped"
                        ? "🚚 In Transit"
                        : "🔄 Processing"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Orders
                    </p>
                    <p className="text-lg font-bold">{orders.length}</p>
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
                      KES {totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Shipment Date
                    </p>
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
                      : "text-amber-600 hover:bg-amber-50"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Tracking
                    </>
                  )}
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                >
                  <a href={`tel:0700000000`}>
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
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-6">Shipment Progress</h3>

                {/* Progress Bar */}
                <div className="relative mb-8">
                  <Progress
                    value={
                      (currentStepIndex / (TRACKING_STEPS.length - 1)) * 100
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between mt-4">
                    {TRACKING_STEPS.map((step, index) => (
                      <div
                        key={step.status}
                        className="flex flex-col items-center relative"
                        style={{
                          left: `${
                            (index / (TRACKING_STEPS.length - 1)) * 100
                          }%`,
                        }}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mb-2",
                            index <= currentStepIndex
                              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                          )}
                        >
                          <step.icon className="h-4 w-4" />
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium whitespace-nowrap",
                            index <= currentStepIndex
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500"
                          )}
                        >
                          {step.label}
                        </span>
                        {index === currentStepIndex && (
                          <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500">
                            Current
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking History */}
                <div className="space-y-4">
                  <h4 className="font-medium">Recent Updates</h4>
                  {trackingHistory.length > 0 ? (
                    <div className="space-y-3">
                      {trackingHistory.map((update, index) => (
                        <div
                          key={update.id}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          <div className="mt-1">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full",
                                update.status === "delivered"
                                  ? "bg-green-500"
                                  : update.status === "shipped"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              )}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-medium capitalize">
                                {update.status}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(update.created_at),
                                  "MMM dd, HH:mm"
                                )}
                              </p>
                            </div>
                            {update.shipping_method && (
                              <p className="text-sm text-muted-foreground">
                                Method: {update.shipping_method}
                              </p>
                            )}
                            {update.estimated_delivery && (
                              <p className="text-sm text-muted-foreground">
                                Est. Delivery:{" "}
                                {format(
                                  new Date(update.estimated_delivery),
                                  "MMM dd"
                                )}
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
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-6">Order Details</h3>

                {orders.map((order, orderIndex) => (
                  <div
                    key={order.id}
                    className={orderIndex > 0 ? "mt-6 pt-6 border-t" : ""}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">
                          Order #{order.id.substring(0, 8)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Placed on{" "}
                          {format(new Date(order.created_at), "MMMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "paid"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {order.status}
                      </Badge>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">
                                  {item.products.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  SKU: {item.products.sku}
                                </p>
                              </div>
                              <p className="font-medium">
                                KES {(item.unit_price * item.qty).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <p className="text-muted-foreground">
                                Qty: {item.qty}
                              </p>
                              <p className="text-muted-foreground">
                                KES {item.unit_price.toFixed(2)} each
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
                          <span>KES {order.total.toFixed(2)}</span>
                        </div>
                        {order.transactions?.[0] && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Payment Method
                              </span>
                              <span>{order.transactions[0].gateway}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Payment Status
                              </span>
                              <span className="capitalize">
                                {order.transactions[0].status}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Shipping Info Sidebar */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  Shipping Address
                </h3>

                <address className="not-italic space-y-2">
                  <p className="font-medium">
                    {mainOrder.shipping_info?.firstName}{" "}
                    {mainOrder.shipping_info?.lastName}
                  </p>
                  <p>{mainOrder.shipping_info?.address}</p>
                  <p>
                    {mainOrder.shipping_info?.city},{" "}
                    {mainOrder.shipping_info?.state}
                  </p>
                  <p>{mainOrder.shipping_info?.country}</p>
                  <p className="text-muted-foreground">
                    Postal: {mainOrder.shipping_info?.postalCode}
                  </p>
                </address>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${mainOrder.shipping_info?.phone}`}
                      className="text-primary hover:underline"
                    >
                      {mainOrder.shipping_info?.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${mainOrder.shipping_info?.email}`}
                      className="text-primary hover:underline"
                    >
                      {mainOrder.shipping_info?.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  Delivery Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Carrier
                    </p>
                    <p className="font-medium">Blessed Two Delivery Network</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Service
                    </p>
                    <p className="font-medium">Standard Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      1-2 business days within Nairobi
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Delivery Hours
                    </p>
                    <p className="font-medium">9:00 AM - 7:00 PM</p>
                    <p className="text-sm text-muted-foreground">
                      Monday - Saturday
                    </p>
                  </div>

                  <Separator className="my-2" />

                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Delivery Instructions
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      • Please ensure someone is available to receive the
                      package
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Have your ID ready for verification
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Contact 0700 000 000 for delivery questions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Need Help?</h3>

                <div className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <a href={`tel:0700000000`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Support: 0700 000 000
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <a href="mailto:support@blessedtwo.co.ke">
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
                      Live Chat Support
                    </Link>
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Office Hours:</p>
                  <p>Monday - Friday: 8:00 AM - 8:00 PM</p>
                  <p>Saturday: 9:00 AM - 6:00 PM</p>
                  <p>Sunday: 10:00 AM - 4:00 PM</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold">Shop More Lighting Solutions</h3>
            <p className="text-muted-foreground max-w-2xl">
              Explore our wide range of LED bulbs, solar lights, and security
              lighting for your home or business.
            </p>
            <div className="flex gap-3">
              <Button
                asChild
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
              >
                <Link href="/products">Continue Shopping</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Copy icon component
function Copy({ className }: { className?: string }) {
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
