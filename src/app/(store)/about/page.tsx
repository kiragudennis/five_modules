// app/(store)/about/page-content.tsx

"use client";

import Link from "next/link";
import {
  MapPin,
  Clock,
  Target,
  ShieldCheck,
  Award,
  Star,
  Heart,
  Phone,
  MessageCircle,
  ArrowRight,
  Users,
  Truck,
  Shield,
  CheckCircle,
  Sparkles,
  Gift,
  Trophy,
  Ticket,
  Zap,
  Crown,
  Coins,
  TrendingUp,
  Layers,
  Smartphone,
  Globe,
  BarChart,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Module data for the 5 engagement features
const engagementModules = [
  {
    name: "Spin to Win",
    icon: Target,
    description:
      "Interactive wheel with daily free spins. Win points, discounts, and products.",
    href: "/spin",
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    stats: "1M+ spins completed",
  },
  {
    name: "Live Challenges",
    icon: Trophy,
    description:
      "Real-time trivia and competitions. Host asks questions, customers compete live.",
    href: "/challenges",
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    stats: "50K+ active participants",
  },
  {
    name: "Lucky Draws",
    icon: Ticket,
    description:
      "Time-limited giveaways. Enter via purchases, referrals, or social shares.",
    href: "/draws",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    stats: "10K+ winners monthly",
  },
  {
    name: "Mystery Bundles",
    icon: Gift,
    description:
      "Curated product bundles with surprise reveals. Stream-exclusive deals.",
    href: "/bundles",
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    stats: "25% higher AOV",
  },
  {
    name: "Flash Deals",
    icon: Zap,
    description:
      "Limited-time offers with live countdowns. Real-time stock depletion.",
    href: "/deals",
    color: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    stats: "500+ units sold daily",
  },
];

// Platform features
const platformFeatures = [
  {
    title: "Complete E-commerce Suite",
    description:
      "Full product catalogue, order management, inventory tracking, and checkout with real payment integration.",
    icon: ShoppingBag,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Loyalty Points System",
    description:
      "Earn points on purchases, redeem for discounts. Tier-based rewards (Bronze → Platinum).",
    icon: Crown,
    color: "text-yellow-600 bg-yellow-50",
  },
  {
    title: "Coupon Management",
    description:
      "Create, manage, and track promotional codes. Percentage or fixed discounts.",
    icon: Ticket,
    color: "text-green-600 bg-green-50",
  },
  {
    title: "Analytics Dashboard",
    description:
      "Real-time traffic analysis, conversion tracking, and customer behavior insights.",
    icon: BarChart,
    color: "text-purple-600 bg-purple-50",
  },
  {
    title: "Customer Management",
    description:
      "Full customer profiles, order history, and support ticket system.",
    icon: Users,
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    title: "Mobile-First Design",
    description: "Fully responsive interface optimized for all devices.",
    icon: Smartphone,
    color: "text-indigo-600 bg-indigo-50",
  },
];

// Stats
const stats = [
  { value: "100K+", label: "Active Users", icon: Users, trend: "+25% MoM" },
  { value: "500K+", label: "Engagements", icon: Target, trend: "+40% MoM" },
  { value: "50K+", label: "Points Awarded", icon: Coins, trend: "Monthly" },
  {
    value: "98%",
    label: "Retention Rate",
    icon: Heart,
    trend: "After 30 days",
  },
];

// FAQ
const faqs = [
  {
    question: "What is a Customer Retention System?",
    answer:
      "A Customer Retention System is a revolutionary e-commerce system that combines traditional online shopping with gamified engagement modules (Spin Wheel, Challenges, Draws, Bundles, and Deals) to drive customer retention and loyalty.",
  },
  {
    question: "How does the loyalty points system work?",
    answer:
      "Customers earn points on every purchase (configurable rate). Points can be redeemed for discounts at checkout. Higher tiers (Silver, Gold, Platinum) unlock exclusive benefits and higher discount rates.",
  },
  {
    question: "What types of challenges are available?",
    answer:
      "We offer multiple challenge types: Referral Challenges, Purchase Challenges, Social Share Challenges, Daily Streak Challenges, Team Challenges, Combo Challenges, and Live Trivia where hosts ask questions in real-time.",
  },
  {
    question: "Can I customize the gamification modules?",
    answer:
      "Yes! All modules are fully customizable. Configure prize pools, spin probabilities, entry rules, challenge types, bundle products, and deal parameters through the admin dashboard.",
  },
  {
    question: "Is this suitable for my business type?",
    answer:
      "Absolutely. Northwind works for any e-commerce business - retail, electronics, fashion, groceries, services, and more. The modules are designed to be industry-agnostic.",
  },
  {
    question: "What integrations are available?",
    answer:
      "Supports major payment gateways (MPesa, Stripe, PayPal), email/SMS notifications, WebSocket for live broadcasts, and REST APIs for custom integrations.",
  },
];

// Core values
const coreValues = [
  {
    title: "Innovation First",
    description:
      "We continuously evolve our platform with cutting-edge engagement technologies.",
    icon: Sparkles,
    color: "text-purple-600 bg-purple-50",
  },
  {
    title: "Customer Success",
    description:
      "Our metrics are retention, engagement, and lifetime value - not just sales.",
    icon: Heart,
    color: "text-red-600 bg-red-50",
  },
  {
    title: "Transparency",
    description:
      "Real-time analytics, clear pricing, and honest communication.",
    icon: ShieldCheck,
    color: "text-green-600 bg-green-50",
  },
  {
    title: "Continuous Improvement",
    description:
      "Regular updates based on customer feedback and emerging trends.",
    icon: TrendingUp,
    color: "text-blue-600 bg-blue-50",
  },
];

export default function AboutPageContent() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-xl">
              <Layers className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
              Revolutionary
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Northwind Systems
          </span>
          <br />
          <span className="text-gray-900 dark:text-white">
            Complete E-commerce + Engagement System
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          We provide a{" "}
          <strong className="text-blue-600">
            fully-featured e-commerce system
          </strong>{" "}
          with 5 powerful gamification modules that transform casual browsers
          into <strong className="text-blue-600">loyal brand advocates</strong>.
          Order management, payments, analytics, and engagement — all in one
          platform.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-10">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex justify-center mb-2">
                  <Icon className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
                <div className="text-xs text-green-600 mt-1">{stat.trend}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5 Engagement Modules Showcase */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            5-in-1 Engagement Suite
          </Badge>
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Gamified Customer Engagement
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Keep customers coming back with our proven engagement modules. Each
            module is fully integrated with your e-commerce data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {engagementModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.name} href={module.href}>
                <div
                  className={`group p-6 rounded-xl border ${module.bg} border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${module.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-green-600">
                      {module.stats}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Platform Features */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Complete E-commerce Platform
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to run a successful online store, plus
            engagement tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${feature.color.split(" ")[1]} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${feature.color.split(" ")[0]}`} />
                </div>
                <div>
                  <h3 className="font-bold mb-1 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-20">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg opacity-95 max-w-2xl mx-auto">
              A seamless integration of e-commerce and engagement
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="font-bold mb-2">Shop Products</h3>
              <p className="text-sm opacity-90">
                Browse catalogue, add to cart, checkout securely
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h3 className="font-bold mb-2">Earn Points</h3>
              <p className="text-sm opacity-90">
                Every purchase earns loyalty points
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="font-bold mb-2">Play & Engage</h3>
              <p className="text-sm opacity-90">
                Spin wheels, join challenges, enter draws
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                4
              </div>
              <h3 className="font-bold mb-2">Redeem Rewards</h3>
              <p className="text-sm opacity-90">
                Use points for discounts, win prizes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Our Core Values
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((value, index) => {
            const Icon = value.icon;
            return (
              <div
                key={index}
                className="text-center p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${value.color.split(" ")[1]} flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className={`w-6 h-6 ${value.color.split(" ")[0]}`} />
                </div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your E-commerce?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Join forward-thinking brands using Northwind to boost retention and
            drive repeat purchases.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Link href="/">
                <ShoppingBag className="mr-2 w-5 h-5" />
                Start Shopping
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-black dark:text-white"
            >
              <Link href="/about/module/consultation">
                <MessageCircle className="mr-2 w-5 h-5" />
                Consult with Us
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-black dark:text-white"
            >
              <Link href="/about/module">
                <Layers className="mr-2 w-5 h-5" />
                Explore Modules
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Complete e-commerce backend
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />5 engagement
              modules
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Real-time analytics
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Payment integrations
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
