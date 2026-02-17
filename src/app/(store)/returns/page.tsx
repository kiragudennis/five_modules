// app/(store)/returns/page-content.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Truck,
  Smartphone,
  Clock,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Zap,
  Battery,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Package,
  Phone,
  Mail,
  ArrowRight,
  Calendar,
  CreditCard,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReturnsPageContent() {
  const faqs = [
    {
      question: "How long do I have to return a product?",
      answer:
        "You have 7 days to return non-faulty items in original condition. For defective products, we offer a 30-day replacement guarantee and a 2-year warranty for manufacturing defects.",
    },
    {
      question: "How do I initiate a return?",
      answer:
        "Contact our support team at +254 727 833 691 via call or WhatsApp. Provide your order number and reason for return, and we'll guide you through the process.",
    },
    {
      question: "Who pays for return shipping?",
      answer:
        "We cover return shipping for defective items and wrong/damaged deliveries. For change of mind returns, customers cover the return shipping costs.",
    },
    {
      question: "How long do refunds take to process?",
      answer:
        "M-Pesa refunds are processed within 24-48 hours after we receive the returned item. Credit card refunds take 5-10 business days to appear on your statement.",
    },
    {
      question: "Can I exchange a product instead of returning it?",
      answer:
        "Yes, you can exchange products within 7 days of delivery. We offer priority shipping for exchanges to minimize your wait time.",
    },
    {
      question: "What is covered under the 2-year warranty?",
      answer:
        "Our warranty covers manufacturing defects in materials and workmanship. It does not cover physical damage, improper installation, water damage, or use outside specified conditions.",
    },
  ];

  const returnMethods = [
    {
      method: "Store Return (Duruma Road)",
      cost: "FREE",
      timeframe: "Immediate processing",
      bestFor: "Nairobi residents, fastest option",
      icon: MapPin,
      color: "text-green-600 bg-green-50",
    },
    {
      method: "Scheduled Pickup",
      cost: "KES 200-500",
      timeframe: "1-2 business days",
      bestFor: "Greater Nairobi area",
      icon: Truck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      method: "Courier Drop-off",
      cost: "Customer pays actuals",
      timeframe: "3-5 business days",
      bestFor: "Upcountry customers",
      icon: Package,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="container py-8 px-2 mx-auto max-w-5xl">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Returns & Refunds Policy",
            description:
              "Comprehensive returns and refunds policy for Blessed Two Electronics lighting products",
            url: "https://www.blessedtwoelectronics.com/returns",
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://www.blessedtwoelectronics.com",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Returns Policy",
                  item: "https://www.blessedtwoelectronics.com/returns",
                },
              ],
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MerchantReturnPolicy",
            name: "Blessed Two Electronics Return Policy",
            description: "Returns policy for lighting products and electronics",
            returnPolicyCategory: "MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: ["ReturnInStore", "ReturnByMail"],
            returnFees: "ReturnFeesCustomerResponsibility",
            returnShippingFeesAmount: {
              "@type": "MonetaryAmount",
              value: 200,
              currency: "KES",
            },
            itemCondition: "NewCondition",
            returnPolicyCountry: "KE",
          }),
        }}
      />

      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          Returns, Refunds & Exchange Policy
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          Your satisfaction is our priority at Blessed Two Electronics. We stand
          behind our lighting solutions with comprehensive warranty coverage and
          hassle-free return procedures.
        </p>
      </section>

      {/* Trust Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 mb-12 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              2-Year Comprehensive Warranty on All Products
            </h2>
            <p className="text-lg opacity-95 max-w-3xl">
              At Blessed Two Electronics, we stand by our products. Every
              lighting solution comes with a comprehensive 2-year warranty for
              complete peace of mind and long-term reliability.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-white/90 font-semibold"
            >
              <Link href="/products">
                Shop Quality Lighting
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {/* Return Guidelines */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
              Lighting & Electronics Return Guidelines
            </h2>

            <div className="space-y-8">
              {/* 7-Day Return */}
              <div className="p-8 border-2 border-blue-200 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                      7-Day Return Window for Non-Faulty Items
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Not completely satisfied? Return unused, unopened items
                      within 7 days of delivery for a full refund or exchange.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
                    Return Conditions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Original Packaging</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Must be intact with all materials
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Complete Accessories</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          All manuals, cables, and parts included
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Unused Condition</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Product must not be installed or used
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Proof of Purchase</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Original receipt or order confirmation required
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faulty Products */}
              <div className="p-8 border-2 border-amber-200 rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                      Faulty or Defective Products
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      For products that don't work as expected or have
                      manufacturing defects, we offer comprehensive support
                      throughout our warranty period.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        Within 30 Days
                      </h4>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Full refund or replacement
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Free pickup service
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Priority processing
                        </span>
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        For manufacturing defects only
                      </span>
                    </div>
                  </div>

                  <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        2-Year Warranty Period
                      </h4>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Repair or replacement
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Warranty-covered issues only
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Assessment required
                        </span>
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Excludes physical damage or misuse
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Methods */}
              <div className="p-8 border-2 border-purple-200 rounded-2xl bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                      Return Process & Shipping Options
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Choose the most convenient return method for your location
                      in Kenya.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {returnMethods.map((method, index) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg ${method.color.split(" ")[1]} flex items-center justify-center`}
                            >
                              <Icon
                                className={`w-5 h-5 ${method.color.split(" ")[0]}`}
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                                {method.method}
                              </h4>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {method.bestFor}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {method.cost}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {method.timeframe}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Considerations */}
              <div className="p-8 border-2 border-amber-200 rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                      Special Considerations for Lighting Products
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Due to the unique nature of electrical and lighting
                      products, please note these specific guidelines.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Solar Products</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Batteries have 1-year warranty separate from main
                          product. Solar panels have 5-year performance
                          warranty.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Installation Services</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Installation fees are non-refundable once service is
                          rendered. Workmanship has 6-month warranty.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Custom Orders</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Made-to-order products cannot be returned unless
                          defective. Special order terms apply.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Battery className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Open Box Items</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Products removed from packaging can only be returned
                          if defective. No change-of-mind returns.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Refunds Process */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
              Refund Processing & Timeline
            </h2>

            <div className="space-y-8">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border-2 border-blue-200">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                      M-Pesa Refunds (Most Common)
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      For customers who paid via M-Pesa, we offer fast and
                      secure refund processing.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Clock className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                    <div className="font-bold text-lg mb-1">24-48 Hours</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Processing time after receiving return
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <CreditCard className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <div className="font-bold text-lg mb-1">
                      Original Method
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Refunded to same payment method
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Smartphone className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                    <div className="font-bold text-lg mb-1">
                      SMS Notification
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Sent when refund is initiated
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                        Store Credit Option
                      </h4>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Opt for store credit and receive a 10% bonus on your
                      refund amount. Perfect for future lighting purchases.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                        Valid for 1 year
                      </span>
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                        10% Bonus Credit
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                        Exchange Process
                      </h4>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Exchange for another product with price difference
                      adjustment. We offer priority shipping for exchanges.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                        Priority Shipping
                      </span>
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                        Price Adjustment
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-6 mb-6 border-2 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                Quick Reference Guide
              </h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Return Windows
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      • 7 days: Non-faulty items
                      <br />
                      • 30 days: Defective products
                      <br />• 2 years: Warranty claims
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Battery className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Warranty Coverage
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      • 2 years: Lighting products
                      <br />
                      • 1 year: Solar batteries
                      <br />• 6 months: Installation
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Important Notes
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      • Test products upon installation
                      <br />
                      • Keep original packaging
                      <br />• Save proof of purchase
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Quick Assistance
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      WhatsApp: +254 727 833 691
                      <br />
                      Call for immediate support
                    </div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">
                Need Help With Returns?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Our lighting experts are here to help you with any return or
                exchange questions. Contact us for personalized assistance.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Phone Support
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      +254 727 833 691
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Business Hours
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Mon-Sat: 8AM-6PM
                      <br />
                      Sun: 10AM-4PM
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Email Support
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      support@blessedtwoelectronics.com
                    </div>
                  </div>
                </div>
              </div>

              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
              >
                <Link href="/contact">
                  Contact Support Team
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-700 text-center">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Quality Lighting, Guaranteed
        </h3>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          At Blessed Two Electronics, we're committed to providing top-quality
          lighting solutions backed by excellent customer service and
          comprehensive warranty coverage.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg"
          >
            <Link href="/products">
              Shop Quality Lighting
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Link href="/contact">
              Visit Our Duruma Road Store
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            2-Year Warranty on All Products
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" />
            Free Returns for Defective Items
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-500" />
            24-48 Hour Refund Processing
          </div>
        </div>
      </section>
    </div>
  );
}
