"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Shield,
  Smartphone,
  CreditCard,
  Lock,
  Phone,
  ArrowRight,
  Info,
  Zap,
  Truck,
  Package,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Loader2,
  Gift,
  Users,
  Sun,
  Battery,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { useStore } from "@/lib/context/StoreContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Payment status types
export type PaymentStatus = "idle" | "processing" | "success" | "error";

export default function PaymentPage() {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { profile } = useAuth();
  const { state, dispatch } = useStore();
  const orderData = state.pendingOrder;

  // If there's no pending order, redirect to products
  useEffect(() => {
    if (!orderData) {
      router.replace("/products");
    }
  }, [orderData, router]);

  if (!orderData) return null;

  // Helper to get payment method display name
  const getPaymentMethodDisplay = () => {
    const method: string = orderData.payment?.method || "mpesa";
    return {
      mpesa: {
        name: "M-Pesa",
        color: "from-green-500 to-emerald-500",
        icon: Smartphone,
      },
      paypal: {
        name: "PayPal",
        color: "from-blue-500 to-blue-700",
        icon: CreditCard,
      },
    }[method as keyof typeof paymentMethods];
  };

  const paymentMethods = {
    mpesa: {
      name: "M-Pesa",
      color: "from-green-500 to-emerald-500",
      icon: Smartphone,
    },
    paypal: {
      name: "PayPal",
      color: "from-blue-500 to-blue-700",
      icon: CreditCard,
    },
  };

  const paymentMethod = getPaymentMethodDisplay();

  // Real M-Pesa payment with actual integration
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

      // Show processing state
      toast.info("Initiating M-Pesa STK Push...");

      const res = await fetch("/api/checkout/mpesa/initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: state.pendingOrder, phoneNumber }),
      });

      const data = await res.json();

      class MpesaError extends Error {
        constructor(
          message: string,
          public code?: string,
        ) {
          super(message);
          this.name = "MpesaError";
        }
      }

      if (!res.ok) {
        throw new MpesaError(data.error, data.code);
      }

      // Simulate successful payment
      setPaymentStatus("success");

      const { orderId: confirmedOrderId, data: mpesaResponse } = data;

      const fullyPaidByLoyalty = mpesaResponse?.fullyPaidByLoyalty || false;
      // Check if loyalcode was used and clean localStorage if so
      const loyaltyPointsUsed = mpesaResponse?.loyaltyPointsUsed || 0;
      const loyaltyDiscountAmount = mpesaResponse?.loyaltyDiscountAmount || 0;

      if (loyaltyPointsUsed > 0) {
        localStorage.removeItem("loyaltyRedemptionCode");
        toast.success(
          `Loyalty points applied! You used ${loyaltyPointsUsed} points for a ${loyaltyDiscountAmount} discount.`,
        );
      }

      if (fullyPaidByLoyalty) {
        toast.success(
          mpesaResponse.message ||
            "Your loyalty points covered the entire order! No payment needed.",
        );
        router.push(`/checkout/success?orderId=${confirmedOrderId}`);
        return;
      }

      if (mpesaResponse?.CustomerMessage) {
        toast.info(mpesaResponse.CustomerMessage);
      }

      // Received an STK push notification
      toast.success(
        "M-Pesa STK Push sent! Check your phone to complete payment.",
      );

      router.push(`/checkout/success?orderId=${confirmedOrderId}`);
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      setErrorMessage(
        "There was an error processing your M-Pesa payment. Please try again.",
      );
      toast.error("Failed. Please try again.", {
        duration: 5000,
        action: {
          label: "Contact Support",
          onClick: () => router.push("/contact"),
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header & Progress */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
              <div>
                <Link
                  href="/checkout"
                  className="flex items-center text-amber-700 hover:text-amber-800 font-medium mb-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Checkout
                </Link>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Complete Your Secure Payment
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Final step to illuminate your space with quality lighting
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Lock className="w-3 h-3 mr-1" />
                Secure Payment
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2 overflow-auto">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Details</span>
                </div>
                <div className="h-px flex-1 bg-green-300 mx-4" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center">
                    2
                  </div>
                  <span className="font-medium">Payment</span>
                </div>
                <div className="h-px flex-1 bg-gray-300 mx-4" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center">
                    3
                  </div>
                  <span className="font-medium text-gray-500">
                    Confirmation
                  </span>
                </div>
              </div>
              <Progress value={66} className="h-2" />
            </div>
          </div>

          {/* Security Notice */}
          <Alert className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-medium">💳 Live Payment Processing</span>
              <span className="text-sm text-green-700 dark:text-green-300">
                Your transaction is secured with bank-level encryption
              </span>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Options */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Status Messages */}
              {paymentStatus === "processing" && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                          Processing Your Payment
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Initiating {paymentMethod.name} payment... Please
                          wait.
                        </p>
                        <div className="mt-2">
                          <Progress value={40} className="h-1" />
                          <p className="text-xs text-gray-500 mt-1">
                            Contacting payment gateway...
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentStatus === "error" && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                          Payment Error
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {errorMessage}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentStatus("idle")}
                          >
                            Try Again
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/contact">Contact Support</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Payment Method
                    </CardTitle>
                    <Badge
                      className={`bg-gradient-to-r ${paymentMethod.color} text-white`}
                    >
                      {paymentMethod.name}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* M-Pesa Payment Option */}
                  {orderData.payment?.method === "mpesa" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${paymentMethod.color} rounded-lg flex items-center justify-center`}
                        >
                          <Smartphone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Pay with M-Pesa</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Instant payment via mobile money
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="phone"
                            className="text-sm font-medium"
                          >
                            M-Pesa Phone Number *
                          </Label>
                          <p className="text-xs text-gray-500 mb-2">
                            Enter the phone number registered with M-Pesa
                          </p>
                          <div>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="254712345678"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="h-12 text-lg"
                              disabled={isProcessing}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Format: 254 followed by 9 digits (e.g.,
                            254712345678)
                          </p>
                        </div>

                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-sm">
                            <span className="font-medium mb-1 block">
                              What happens next?
                            </span>
                            <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>M-Pesa STK Push sent to your phone</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>Enter your M-Pesa PIN to complete</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>Instant order confirmation</span>
                              </li>
                            </ul>
                          </AlertDescription>
                        </Alert>

                        <Button
                          onClick={handleMPesaPayment}
                          className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          disabled={
                            isProcessing || !phoneNumber.match(/^254[0-9]{9}$/)
                          }
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-5 w-5 mr-2" />
                              Pay{" "}
                              {formatCurrency(
                                orderData.totals?.total || 0,
                                "KES",
                              )}{" "}
                              with M-Pesa
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* PayPal Payment Option */}
                  {orderData.payment?.method === "paypal" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${paymentMethod.color} rounded-lg flex items-center justify-center`}
                        >
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            PayPal / Credit Card
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Secure international payment
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Alert>
                          <AlertDescription className="text-sm">
                            You'll be redirected to PayPal's secure payment page
                            to complete your transaction.
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm font-medium">
                              Credit/Debit Card
                            </p>
                            <p className="text-xs text-gray-500">
                              Visa, Mastercard, American Express
                            </p>
                          </div>
                          <div className="border rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="h-8 w-8 bg-blue-700 text-white rounded flex items-center justify-center mx-auto mb-2">
                              <span className="text-xs font-bold">PP</span>
                            </div>
                            <p className="text-sm font-medium">
                              PayPal Account
                            </p>
                            <p className="text-xs text-gray-500">
                              Instant payment
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() =>
                            router.push("/checkout/processing/initial")
                          }
                          className="w-full h-14 text-lg bg-[#0070ba] hover:bg-[#003087] text-white"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-5 w-5 mr-2" />
                              Pay{" "}
                              {formatCurrency(
                                orderData.totals?.total || 0,
                                "KES",
                              )}{" "}
                              with PayPal
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-center text-gray-500">
                          By proceeding, you agree to our Terms and authorize
                          the payment amount.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-600" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Shipping Information */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-500" />
                      Delivery Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Address:</span>
                        <p className="font-medium">
                          {orderData.shipping?.address}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">City:</span>
                        <p className="font-medium">
                          {orderData.shipping?.city},{" "}
                          {orderData.shipping?.county}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Delivery Method:</span>
                        <p className="font-medium">
                          {orderData.shipping?.method === "express"
                            ? "Same-Day Express"
                            : orderData.shipping?.method === "pickup"
                              ? "Store Pickup"
                              : "Standard Delivery"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          Estimated Delivery:
                        </span>
                        <p className="font-medium">
                          {orderData.shipping?.estimatedDelivery}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Installation Details (if applicable) */}
                  {orderData.services?.installation?.required && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Installation Service
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Service:</span>
                          <p className="font-medium">
                            {orderData.services.installation.service?.name}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <p className="font-medium">
                            {formatCurrency(
                              orderData.services.installation.cost,
                              "KES",
                            )}
                          </p>
                        </div>
                        {orderData.services.installation.date && (
                          <div>
                            <span className="text-gray-500">
                              Preferred Date:
                            </span>
                            <p className="font-medium">
                              {orderData.services.installation.date}
                            </p>
                          </div>
                        )}
                        {orderData.services.installation.instructions && (
                          <div className="md:col-span-2">
                            <span className="text-gray-500">Instructions:</span>
                            <p className="font-medium">
                              {orderData.services.installation.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="border-amber-200">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Order Items */}
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
                    {orderData.items?.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-start pb-2 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Qty: {item.quantity}
                            </Badge>
                            {item.has_wholesale &&
                              item.applied_price === item.wholesale_price && (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                                  Wholesale
                                </Badge>
                              )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(
                              item.applied_price * item.quantity,
                              "KES",
                            )}
                          </p>
                          {item.has_wholesale &&
                            item.price !== item.applied_price && (
                              <p className="text-xs text-green-600">
                                Save{" "}
                                {formatCurrency(
                                  (item.price - item.applied_price) *
                                    item.quantity,
                                  "KES",
                                )}
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Financial Breakdown */}
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Subtotal
                      </span>
                      <span className="font-medium">
                        {formatCurrency(orderData.totals?.subtotal || 0, "KES")}
                      </span>
                    </div>

                    {orderData.totals?.wholesaleSavings > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Wholesale Savings</span>
                        <span className="font-medium">
                          -
                          {formatCurrency(
                            orderData.totals.wholesaleSavings,
                            "KES",
                          )}
                        </span>
                      </div>
                    )}

                    {orderData.coupon?.discount > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          Coupon ({orderData.coupon.code})
                        </span>
                        <span className="font-medium">
                          -{formatCurrency(orderData.coupon.discount, "KES")}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Shipping
                      </span>
                      <span className="font-medium">
                        {orderData.shipping?.cost === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          formatCurrency(orderData.shipping?.cost || 0, "KES")
                        )}
                      </span>
                    </div>

                    {orderData.services?.installation?.required && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Installation
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            orderData.services.installation.cost,
                            "KES",
                          )}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total Amount</span>
                      <span className="text-amber-600">
                        {formatCurrency(orderData.totals?.total || 0, "KES")}
                      </span>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      Payment Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Method:</span>
                        <span className="font-medium">
                          {paymentMethod.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order Status:</span>
                        <Badge variant="outline" className="text-amber-600">
                          Awaiting Payment
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="space-y-1">
                        <ShieldCheck className="h-5 w-5 text-green-500 mx-auto" />
                        <p className="text-xs font-medium">Secure Payment</p>
                      </div>
                      <div className="space-y-1">
                        <Truck className="h-5 w-5 text-blue-500 mx-auto" />
                        <p className="text-xs font-medium">Fast Delivery</p>
                      </div>
                      <div className="space-y-1">
                        <Zap className="h-5 w-5 text-amber-500 mx-auto" />
                        <p className="text-xs font-medium">24/7 Support</p>
                      </div>
                      <div className="space-y-1">
                        <Battery className="h-5 w-5 text-purple-500 mx-auto" />
                        <p className="text-xs font-medium">Warranty</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold">Need Help?</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Our lighting experts are here to help
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <a
                        href="tel:+254727833691"
                        className="font-bold text-blue-600 hover:text-blue-700"
                      >
                        0727 833 691
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">8:00 AM - 6:00 PM Daily</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-gray-500">
                        <Info className="h-3 w-3 inline mr-1" />
                        Payment issues? Call us immediately for assistance
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for Kenyan flag
function Flag(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      width="20"
      height="15"
      {...props}
    >
      <defs>
        <path
          id="a"
          fill="#fff"
          d="M-28.6 47.5l1.8 1 46.7-81c2.7-.6 4.2-3.2 5.7-5.8 1-1.8 5-8.7 6.7-17.7a58 58 0 0 0-11.9 14.7c-1.8 2.6-3 5-3.6 6.9z"
        />
      </defs>
      <path fill="#000" d="M0 0h640v480H0z" />
      <path fill="#fff" d="M0 0h640v144H0zm0 336h640v144H0z" />
      <g fill="#060" transform="matrix(3 0 0 3 320 240)">
        <path d="M0-70.2l.2.7 23 79.3L0-70.2z" />
        <circle r="23.9" />
        <path d="M0 23.9a23.9 23.9 0 0 1 0-47.8A23.9 23.9 0 0 0 0 23.9" />
      </g>
      <use xlinkHref="#a" transform="matrix(3 0 0 3 320 240)" />
      <use xlinkHref="#a" transform="rotate(72 320 240)" />
      <use xlinkHref="#a" transform="rotate(144 320 240)" />
      <use xlinkHref="#a" transform="rotate(216 320 240)" />
      <use xlinkHref="#a" transform="rotate(288 320 240)" />
    </svg>
  );
}
