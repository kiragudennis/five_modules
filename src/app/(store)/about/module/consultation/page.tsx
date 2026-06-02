// app/(store)/about/modules/consultation/page.tsx

"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  Coins,
  CreditCard,
  FileSearch,
  Heart,
  MessageCircle,
  Phone,
  Shield,
  Zap,
  CheckCircle,
  RefreshCw,
  Users,
  Globe,
  Lock,
  BarChart,
  Mail,
  Star,
  Cpu,
  Server,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  consultationPackages,
  enterpriseFeatures,
  faqs,
  fraudPrevention,
  integrationPoints,
  modulePricing,
  successMetrics,
  whatYouGet,
} from "@/lib/constants";

export default function ConsultationPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          Enterprise Engagement Suite
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Build a Community, Not Just a Store
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          What we deliver isn't a plugin - it's a live engagement ecosystem.
          Real-time WebSocket infrastructure, shared points economy, OBS-ready
          broadcast displays, and admin controls. This is enterprise-grade
          community-building technology that transforms casual buyers into loyal
          brand advocates.
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
            asChild
          >
            <Link href="#booking">
              <Calendar className="mr-2 h-5 w-5" />
              Book Consultation (KES 5,000)
            </Link>
          </Button>
        </div>
      </section>

      {/* What Makes This Enterprise */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          What You're Actually Getting
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          This isn't a basic plugin. It's a production-ready engagement
          platform.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enterpriseFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Module Pricing - Detailed */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-4">Module Pricing</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Enterprise-grade modules. Each is a production-ready engagement
          system.
        </p>
        <div className="space-y-8">
          {modulePricing.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card
                key={mod.module}
                className={mod.highlight ? "border-2 border-amber-500" : ""}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-r ${mod.color} flex items-center justify-center`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{mod.module}</h3>
                        <p className="text-sm text-gray-500">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mod.price}
                      </div>
                      <div className="text-sm text-gray-500">
                        Setup: {mod.setup}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Core Features
                      </h4>
                      <ul className="space-y-2">
                        {mod.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {mod.whatMakesItEnterprise && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-blue-500" />
                          Enterprise Capabilities
                        </h4>
                        <ul className="space-y-2">
                          {mod.whatMakesItEnterprise.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-600 dark:text-gray-300">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {mod.longDescription && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {mod.longDescription}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* What's Included */}
      <section className="mb-20">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8">
          <h2 className="text-2xl font-bold mb-4">
            What's Included in Every Module
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {whatYouGet.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Points */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Seamless Integration
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Works with your existing infrastructure
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="flex gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{point.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {point.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fraud Prevention */}
      <section className="mb-20">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">
              Enterprise-Grade Security & Fraud Prevention
            </h2>
          </div>
          <p className="mb-6 opacity-90">
            Your engagement program is protected by multiple layers of security
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {fraudPrevention.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expected ROI */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-4">Expected ROI</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Real results from stores using the complete suite
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {successMetrics.map((metric) => (
            <div
              key={metric.metric}
              className="text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="text-2xl font-bold text-green-600">
                {metric.increase}
              </div>
              <div className="text-sm font-medium">{metric.metric}</div>
              <div className="text-xs text-gray-500">{metric.timeframe}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          *Based on aggregate data across 50+ active stores using all 5 modules
        </p>
      </section>

      {/* FAQ */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Consultation Packages */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Consultation Packages
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Get expert guidance for your engagement strategy
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {consultationPackages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <Card
                key={pkg.name}
                className={`relative ${pkg.recommended ? "border-2 border-blue-500" : ""}`}
              >
                {pkg.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${pkg.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {pkg.price}
                    </div>
                    <div className="text-sm">{pkg.duration}</div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {pkg.description}
                  </p>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          * Consultation fee is credited toward any module purchase
        </p>
      </section>

      {/* CTA Section */}
      <section id="booking" className="mb-16 scroll-mt-20">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your Community?
          </h2>
          <p className="text-lg opacity-95 max-w-2xl mx-auto mb-8">
            Book your KES 5,000 consultation today. This fee is fully credited
            toward any module purchase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-gray-900"
              asChild
            >
              <Link href="https://wa.me/254113062599?text=I%27m%20interested%20in%20a%20consultation%20for%20the%20engagement%20modules">
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Inquiry
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="mailto:hello@northwind.com?subject=Consultation%20Request">
                <Mail className="mr-2 h-5 w-5" />
                Email Us
              </Link>
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Or call us directly: +254 113 062 599
          </p>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="text-center">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Secure payment
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            30-day launch support
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            2+ successful deployments
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Global support
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Enterprise infrastructure
          </div>
        </div>
      </section>
    </div>
  );
}
