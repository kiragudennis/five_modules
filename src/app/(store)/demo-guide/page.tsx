// app/demo-guide/page.tsx
import {
  ShieldCheck,
  ArrowLeft,
  CreditCard,
  Clock,
  Users,
  TrendingUp,
  Package,
  ShoppingBag,
  BarChart3,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Mail,
  Phone,
  Globe,
  Lock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DemoGuidePage() {
  const steps = [
    {
      number: "01",
      title: "Pick a Low-Cost Product",
      description:
        "Start by selecting any product under KES 500 / $5 to minimize your test payment amount.",
      icon: ShoppingBag,
      color: "from-green-500 to-emerald-500",
      tips: [
        "Look for 'Test Product' tags",
        "Choose digital/downloadable items when available",
        "All products work for testing",
      ],
    },
    {
      number: "02",
      title: "Add to Cart & Checkout",
      description:
        "Test the complete shopping flow - cart management, shipping options, and payment methods.",
      icon: CreditCard,
      color: "from-blue-500 to-cyan-500",
      tips: [
        "Try adding multiple quantities",
        "Test coupon codes if available",
        "Explore different payment methods",
      ],
    },
    {
      number: "03",
      title: "Complete Real Payment",
      description:
        "Make an actual payment (KES 500 max). Your money will be automatically refunded within 24 hours.",
      icon: ShieldCheck,
      color: "from-purple-500 to-violet-500",
      tips: [
        "Use real payment credentials",
        "Receipts are automatically generated",
        "Refunds process within 24 hours",
      ],
      important:
        "This is a REAL payment gateway - your payment will go through and be refunded",
    },
    {
      number: "04",
      title: "Request Admin Access",
      description:
        "Email us to get temporary admin dashboard access to see the complete backend.",
      icon: BarChart3,
      color: "from-amber-500 to-orange-500",
      tips: [
        "See live order tracking",
        "Monitor real-time traffic",
        "Test product management",
      ],
    },
  ];

  const adminFeatures = [
    {
      title: "Order Management",
      description: "Track orders in real-time, update statuses, manage refunds",
      icon: Package,
    },
    {
      title: "Customer Insights",
      description:
        "View customer data, purchase history, and behavior analytics",
      icon: Users,
    },
    {
      title: "Sales Analytics",
      description:
        "Real-time revenue reports, traffic sources, conversion rates",
      icon: TrendingUp,
    },
    {
      title: "Product Management",
      description: "Add/edit products, manage inventory, set up promotions",
      icon: ShoppingBag,
    },
  ];

  const refundDetails = [
    {
      time: "Immediately",
      description: "Payment confirmation and receipt sent",
    },
    {
      time: "Within 1 hour",
      description: "Order processed and marked for refund",
    },
    {
      time: "Within 24 hours",
      description: "Full refund processed back to your account",
    },
    {
      time: "1-3 business days",
      description: "Refund appears in your bank statement",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Button asChild variant="ghost" className="mb-6">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                Live Demo Guide
              </Badge>
            </div>

            <h1 className="text-xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Interactive Store Demo Guide
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
              Experience our complete e-commerce platform with real payments,
              full refunds, and admin dashboard access.
            </p>
          </div>

          {/* Important Notice */}
          <Card className="mb-8 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20">
            <CardContent>
              <div className="flex items-start gap-4">
                <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="sm:text-lg font-bold text-amber-800 dark:text-amber-300 mb-2">
                    Important: This is a REAL Store with REAL Payments
                  </h3>
                  <div className="text-sm space-y-2 text-amber-700 dark:text-amber-400">
                    <p className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>
                        All payments go through actual payment gateways
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>
                        Your money is automatically refunded within 24 hours
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>Maximum test amount: KES 500</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Steps */}
          <div className="mb-12">
            <h2 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              How to Test Our Platform
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {steps.map((step, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div
                        className={`h-12 w-12 rounded-lg bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg`}
                      >
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex sm:items-center gap-3 mb-2">
                          <step.icon
                            className={`h-5 w-5 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                          />
                          <h3 className="sm:text-xl font-bold text-gray-900 dark:text-white">
                            {step.title}
                          </h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {step.description}
                        </p>

                        {step.important && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {step.important}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-400">
                            Pro Tips:
                          </h4>
                          {step.tips.map((tip, tipIndex) => (
                            <div
                              key={tipIndex}
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Refund Timeline */}
          <div className="mb-12">
            <h2 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Refund Process & Timeline
            </h2>

            <Card>
              <CardContent>
                <div className="flex items-center gap-3 mb-6">
                  <RefreshCw className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h3 className="sm:text-xl font-bold text-gray-900 dark:text-white">
                    Your Money is Always Safe
                  </h3>
                </div>

                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />

                  <div className="space-y-8 pl-12">
                    {refundDetails.map((detail, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-12 top-0">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              index === 0
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                : index === 1
                                ? "bg-gradient-to-r from-purple-500 to-violet-500"
                                : index === 2
                                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                : "bg-gradient-to-r from-amber-500 to-orange-500"
                            }`}
                          >
                            <Clock className="h-6 w-6 text-white" />
                          </div>
                        </div>

                        <div className="pl-4">
                          <h4 className="sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {detail.time}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300">
                            {detail.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
                  <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    All refunds are automatic - no manual request needed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Dashboard Preview */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Admin Access
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  See how you'll manage your actual store
                </p>
              </div>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Link href="mailto:admin@yourdomain.com?subject=Demo Admin Access Request">
                  Request Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {adminFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardContent>
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact & Support */}
          <Card className="mb-8">
            <CardContent>
              <div className="text-center mb-8">
                <h2 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Need Help During Your Demo?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Our team is ready to assist you with any questions about the
                  demo process
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-xl border hover:shadow-lg transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    Email Support
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    support@worldsamma.org (Affiliated IT Support Team)
                  </p>
                  <p className="text-xs text-gray-500">
                    Response within 2 hours
                  </p>
                </div>

                <div className="text-center p-3 sm:p-6 rounded-xl border hover:shadow-lg transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    Call Us
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    +254 113 062 599
                  </p>
                  <p className="text-xs text-gray-500">
                    9 AM - 6 PM EAT, Mon-Fri
                  </p>
                </div>

                <div className="text-center p-6 rounded-xl border hover:shadow-lg transition-shadow">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    Live Chat
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    Chat on Whatsapp [+254 113 062 599]
                  </p>
                  <p className="text-xs text-gray-500">
                    Available 24/7 for demo support
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final CTA */}
          <div className="text-center">
            <div className="max-w-2xl mx-auto mb-8">
              <h2 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Experience Real E-commerce?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Test our platform with confidence. Your payment is protected by
                our automatic refund guarantee.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg"
              >
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Start Demo Shopping
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg"
              >
                <Link href="/contact">
                  <Eye className="mr-2 h-5 w-5" />
                  Book Custom Demo
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Secure Payment Processing</span>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>100% Refund Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
