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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { useStore } from "@/lib/context/StoreContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Payment status types
export type PaymentStatus = "idle" | "processing" | "success" | "error";

export default function PaymentPage() {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { profile } = useAuth();
  const { state } = useStore();
  const orderData = state.pendingOrder;

  // If there's no pending order, redirect to products
  useEffect(() => {
    if (!orderData) {
      router.replace("/products");
    }
  }, [orderData, router]);

  if (!orderData) return null;

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
        constructor(message: string, public code?: string) {
          super(message);
          this.name = "MpesaError";
        }
      }

      if (!res.ok) {
        throw new MpesaError(data.error, data.code);
      }

      // Simulate successful payment
      setPaymentStatus("success");

      // Received an STK push notification
      toast.success(
        "M-Pesa STK Push sent! Check your phone to complete payment."
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
        "There was an error processing your M-Pesa payment. Please try again."
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
    <div className="container mx-auto py-8 px-2 sm:px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/checkout"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Checkout
        </Link>

        <div className="mb-6">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 mb-3"
          >
            <Lock className="w-3 h-3 mr-1" />
            Secure Payment
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Complete Your Secure Payment
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Your payment is processed securely using{" "}
            {orderData.shipping?.paymentMethod === "mpesa"
              ? "M-Pesa"
              : "PayPal"}
            . All transactions are recorded in our system dashboard for order
            tracking.
          </p>
        </div>
      </div>

      {/* Payment Security Notice */}
      <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent>
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg mb-2">
                Real Payment Processing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    This platform uses{" "}
                    <strong>live payment integrations</strong>. Your transaction
                    will be processed through actual payment gateways and
                    recorded in our system.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      Real M-Pesa STK Push (with your live credentials)
                    </span>
                  </div>
                </div>
                <div>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span>Transaction recorded in admin dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span>Order tracking available immediately</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span>Real payment confirmation sent</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Status Messages */}
          {paymentStatus === "processing" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      Processing Your Payment
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Initiating{" "}
                      {orderData.shipping?.paymentMethod === "mpesa"
                        ? "M-Pesa STK Push"
                        : "PayPal"}{" "}
                      payment... This may take a few moments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentStatus === "error" && (
            <Card className="border-red-200 bg-red-50">
              <CardContent>
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Payment Error</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {errorMessage}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentStatus("idle")}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Selection */}
          <Card>
            <div className="p-2 sm:p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Payment Method</h2>
                <Badge variant="secondary">
                  {orderData.shipping?.paymentMethod === "mpesa"
                    ? "M-Pesa"
                    : "PayPal"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Complete your payment using the selected method
              </p>
            </div>

            <div className="p-6">
              {/* M-Pesa Payment Option */}
              {orderData.shipping?.paymentMethod === "mpesa" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Pay with M-Pesa</h3>
                      <p className="text-sm text-muted-foreground">
                        Real M-Pesa STK Push with your live credentials
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        M-Pesa Phone Number
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Enter the phone number registered with M-Pesa
                      </p>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="254712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="h-12 sm:text-lg"
                        disabled={paymentStatus === "processing"}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Format: 254 followed by 9 digits (e.g., 254712345678)
                      </p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">
                            What happens next?
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>1. Real M-Pesa STK Push sent to your phone</li>
                            <li>
                              2. Enter your M-Pesa PIN to complete payment
                            </li>
                            <li>
                              3. Transaction recorded in our system dashboard
                            </li>
                            <li>4. Instant order confirmation and tracking</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleMPesaPayment}
                      className="w-full h-14 sm:text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      disabled={
                        paymentStatus === "processing" ||
                        phoneNumber.length !== 12
                      }
                    >
                      {paymentStatus === "processing" ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-5 w-5 mr-2" />
                          Pay KES{" "}
                          {(orderData.totalAmount || orderData.total).toFixed(
                            2
                          )}{" "}
                          with M-Pesa
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* PayPal Payment Option */}
              {orderData.shipping?.paymentMethod === "paypal" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Pay with PayPal</h3>
                      <p className="text-sm text-muted-foreground">
                        Secure credit card or PayPal account payment
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm">
                        You'll be redirected to PayPal's secure payment page.
                        You can pay with your PayPal account or any credit/debit
                        card.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 text-center">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">Credit/Debit Card</p>
                        <p className="text-xs text-muted-foreground">
                          Visa, Mastercard, etc.
                        </p>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <div className="h-8 w-8 bg-blue-700 text-white rounded flex items-center justify-center mx-auto mb-2">
                          <span className="text-xs font-bold">PP</span>
                        </div>
                        <p className="text-sm font-medium">PayPal Account</p>
                        <p className="text-xs text-muted-foreground">
                          Instant payment
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        router.push("/checkout/processing/initial");
                      }}
                      className="w-full h-14 text-lg bg-[#0070ba] hover:bg-[#003087]"
                      disabled={paymentStatus === "processing"}
                    >
                      {paymentStatus === "processing" ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Pay KES
                          {(orderData.totalAmount || orderData.total).toFixed(
                            2
                          )}{" "}
                          with PayPal
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By proceeding, you agree to our Terms and authorize the
                      payment amount.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Transaction Security */}
          <Card className="border-blue-200">
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold">Transaction Security</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="font-medium">Live Integration</p>
                  <p className="text-xs text-muted-foreground">
                    Real payment gateways
                  </p>
                </div>
                <div className="text-center p-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="font-medium">System Recording</p>
                  <p className="text-xs text-muted-foreground">
                    All transactions logged
                  </p>
                </div>
                <div className="text-center p-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Smartphone className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="font-medium">Instant Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Order status available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Tracking */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Order Summary
              </h2>
            </div>

            <div className="p-6">
              {/* Order Details */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    Order ID
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {orderData.orderId ||
                      `DEMO-${Date.now().toString().slice(-6)}`}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
                  {orderData.items.map((item: any) => (
                    <div
                      key={item.id || item.name}
                      className="flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.title || item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Qty: {item.quantity}
                          </Badge>
                          {item.category && (
                            <Badge variant="secondary" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-medium">
                        KES{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Cost Breakdown */}
                <div className="space-y-3 pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      KES
                      {orderData.totalAmount
                        ? (
                            orderData.totalAmount -
                            (orderData.shippingCost || 0)
                          ).toFixed(2)
                        : orderData.total.toFixed(2)}
                    </span>
                  </div>

                  {orderData.shippingCost && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        KES{orderData.shippingCost.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>
                        KES
                        {(orderData.totalAmount || orderData.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Tracking Preview */}
              <div className="pt-6 border-t">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  After Payment Completion
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Payment confirmed instantly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-3 w-3 text-blue-600" />
                    </div>
                    <span>Order tracking page accessible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-3 w-3 text-purple-600" />
                    </div>
                    <span>Transaction visible in admin dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Admin Dashboard Preview */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200">
            <CardContent>
              <h3 className="font-bold text-lg mb-3">
                System Dashboard Recording
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This transaction will appear in our admin dashboard with full
                details:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">
                    {orderData.shipping?.paymentMethod === "mpesa"
                      ? "M-Pesa"
                      : "PayPal"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    KES{(orderData.totalAmount || orderData.total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-blue-600"
              >
                <Link href="/contact">Request Dashboard Access Demo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
