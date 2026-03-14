// app/login/page.tsx - Updated for Blessed Two Electricals
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lightbulb,
  Zap,
  Shield,
  Truck,
  Award,
  Star,
  Clock,
  MapPin,
  Phone,
  Percent,
  Package,
  Users,
  CheckCircle,
} from "lucide-react";
import { useStore } from "@/lib/context/StoreContext";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; message?: string; ref?: string }>;
}) {
  const { profile } = useAuth();
  const router = useRouter();
  const searchParam = use(searchParams);
  const { redirect, message, ref } = searchParam;
  const [panel, setPanel] = useState<"signin" | "signup">("signin");
  const { state } = useStore();
  const orderData = state.pendingOrder;

  useEffect(() => {
    if (profile) {
      const redirectPath =
        redirect || profile.role === "admin"
          ? `/admin`
          : orderData
            ? "/checkout/payment"
            : "/products";
      router.push(redirectPath);
    }
  }, [profile, router, orderData, redirect]);

  const handleTabChange = (value: string) => {
    if (value === "signin" || value === "signup") {
      setPanel(value);
    }
  };

  const getMessage = () => {
    switch (message) {
      case "verified":
        return "🎉 Email verified successfully! You can now log in.";
      case "already-verified":
        return "✅ Your email is already verified. Please log in.";
      case "verification-expired":
        return "⏰ Verification link expired. Please sign up again.";
      default:
        return message;
    }
  };

  return (
    <div className="min-h-screen dark:from-gray-900 dark:to-amber-950 py-8">
      <div className="container max-w-6xl mx-auto px-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Auth Forms */}
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-xl border-amber-200 dark:bg-gray-800 dark:border-amber-800">
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <div className="h-8 w-px bg-amber-300 dark:bg-amber-700"></div>
                  <Zap className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Blessed Two Electricals
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Login for faster checkout, order tracking, and exclusive
                  lighting deals
                </CardDescription>

                {message && (
                  <div
                    className={`rounded-lg p-3 ${
                      message === "verified" || message === "already-verified"
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                        : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    <p className="text-sm">{getMessage()}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs
                  value={panel}
                  onValueChange={handleTabChange}
                  defaultValue={panel}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-amber-100 dark:bg-amber-900/30">
                    <TabsTrigger
                      value="signin"
                      className="data-[state=active]:bg-white data-[state=active]:text-amber-600 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-amber-400"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="data-[state=active]:bg-white data-[state=active]:text-amber-600 dark:data-[state=active]:bg-gray-600 dark:data-[state=active]:text-amber-400"
                    >
                      Create Account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-4">
                    <LoginForm />
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
                        <Users className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Join Blessed Two Electricals
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create your account for the best lighting shopping
                        experience
                      </p>
                    </div>

                    <SignUpForm
                      onSuccess={() => setPanel("signin")}
                      ref={ref}
                    />
                  </TabsContent>
                </Tabs>

                {/* Guest Checkout Option */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 text-center mb-3">
                    Want to shop without an account?
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                  >
                    <Link href="/products">
                      Continue as Guest
                      <Package className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <p className="text-xs text-amber-600 dark:text-amber-300 text-center mt-2">
                    You can create an account later to save your order history
                  </p>
                </div>

                {/* Support Links */}
                <div className="text-center pt-4 border-t border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By signing in, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Need help?{" "}
                    <a
                      href="mailto:support@blessedtwo.co.ke"
                      className="text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Contact Support
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Benefits & Features */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                <span>Nairobi&apos;s Trusted Lighting Partner</span>
              </div>
              <h1 className="text-xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Illuminate Your World with Blessed Two
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Join thousands of satisfied customers for premium lighting
                solutions
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-amber-100 dark:border-gray-700">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center">
                  <Percent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Exclusive Member Discounts
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Get 15% off your first order plus ongoing member-only deals
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-amber-100 dark:border-gray-700">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Same-Day Nairobi Delivery
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Order by 2PM, get it today. Free delivery over KES 3,000
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-amber-100 dark:border-gray-700">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Expert Installation Support
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Free consultation and professional installation services
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-amber-100 dark:border-gray-700">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Priority Customer Support
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    24/7 access to our lighting experts for advice and support
                  </p>
                </div>
              </div>
            </div>

            {/* For Business Customers */}
            <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    Special Benefits for Business Customers
                  </h3>
                  <ul className="text-sm opacity-95 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Dedicated account manager for bulk orders
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Special wholesale pricing for contractors & businesses
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Consolidated shipping and billing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Priority technical support and installation
                    </li>
                  </ul>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white text-black hover:bg-white/20 mt-4"
                  >
                    <Link href="/business">
                      Learn about business accounts →
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Customer Testimonial */}
            <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">JM</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    James M., Commercial Client
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Restaurant Owner in Westlands
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                "As a restaurant owner, lighting is everything. Blessed Two's
                business account made outfitting my entire space seamless. Their
                expert advice on commercial lighting and reliable same-day
                delivery has made them my go-to supplier for all lighting
                needs."
              </p>
              <div className="flex mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </div>

            {/* Store Info */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                Visit Our Nairobi Store
              </h4>
              <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Blessed Two Electricals</strong>
                  <br />
                  Duruma Road, Nairobi, Kenya
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Mon-Sat: 8:00 AM - 6:00 PM | Sun: 10:00 AM - 4:00 PM
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <a
                    href="tel:0727833691"
                    className="text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    0727 833 691
                  </a>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <a
                  href="https://maps.google.com/?q=Duruma+Road+Nairobi"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Directions
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Building icon component
function Building({ className }: { className?: string }) {
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
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}
