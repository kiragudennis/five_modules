// app/(store)/about/modules/page.tsx
"use client";

import Link from "next/link";
import {
  Target,
  CheckCircle,
  Star,
  Heart,
  ShoppingBag,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ModulesAboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          5 Engagement Modules
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Gamified Customer Retention
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Each module is designed to drive specific retention behaviors. Used
          together, they create a complete engagement ecosystem that keeps
          customers coming back.
        </p>
      </section>

      {/* Retention Impact Overview */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Measurable Retention Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {retentionMetrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div key={i} className="text-center">
                  <div className="flex justify-center mb-2">
                    <Icon className={`w-8 h-8 ${metric.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-300">{metric.label}</div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-gray-300 mt-6">
            *Based on aggregate data across 10+ active stores using all 5
            modules
          </p>
        </div>
      </section>

      {/* Module Details */}
      {modules.map((module, index) => {
        const Icon = module.icon;
        return (
          <section
            key={module.id}
            id={module.id}
            className="mb-20 scroll-mt-20"
          >
            <div
              className={`rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}
            >
              {/* Header */}
              <div
                className={`bg-gradient-to-r ${module.color} p-6 text-white`}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-6 h-6" />
                      <Badge className="bg-white/20 text-white border-0">
                        Module {index + 1} of 5
                      </Badge>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">
                      {module.name}
                    </h2>
                    <p className="text-white/90 mt-1 max-w-2xl">
                      {module.tagline}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={module.href}>Try it →</Link>
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Overview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {module.longDescription}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {module.stats.map((stat, i) => (
                    <div
                      key={i}
                      className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Mechanics and Benefits */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Key Mechanics
                    </h3>
                    <div className="space-y-4">
                      {module.mechanics.map((mechanic, i) => (
                        <div key={i} className="flex gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {mechanic.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {mechanic.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Retention Value
                    </h3>
                    <div className="space-y-3">
                      {module.retentionValue.map((value, i) => (
                        <div key={i} className="flex gap-3">
                          <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Benefits & Use Cases */}
                <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                      Benefits
                    </h3>
                    <ul className="space-y-2">
                      {module.benefits.map((benefit, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                      Perfect For
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {module.useCases.map((useCase, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-gray-100 dark:bg-gray-700"
                        >
                          {useCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Tv className="w-4 h-4" />
                    Live broadcast ready - OBS compatible
                  </div>
                  <Button
                    asChild
                    className={`bg-gradient-to-r ${module.color} text-white`}
                  >
                    <Link href={module.href}>Try {module.name} →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Combined Power Section */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">The Combined Effect</h2>
          <p className="text-lg opacity-95 max-w-2xl mx-auto mb-8">
            Using all 5 modules together creates a complete engagement ecosystem
            that drives:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-bold">65%</div>
              <div className="text-sm opacity-90">Daily Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold">3.2x</div>
              <div className="text-sm opacity-90">Purchase Frequency</div>
            </div>
            <div>
              <div className="text-3xl font-bold">85%</div>
              <div className="text-sm opacity-90">90-Day Retention</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5.4x</div>
              <div className="text-sm opacity-90">Social Reach</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Ready to Boost Your Customer Retention?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Start with one module or deploy all five. Each integrates seamlessly
          with your existing e-commerce.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-500"
          >
            <Link href="/products">
              <ShoppingBag className="mr-2 w-5 h-5" />
              Start Shopping
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/spin">
              <Target className="mr-2 w-5 h-5" />
              Try a Module
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

import { Settings } from "lucide-react";
import { modules, retentionMetrics } from "@/lib/constants";
