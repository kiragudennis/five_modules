// src/app/(store)/categories/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Grid2x2, Sparkles, ShoppingBag, Zap, Sun, Shield } from "lucide-react";
import { lightingCategories } from "@/lib/constants";

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  return (
    <div className="container py-8 px-2 sm:px-4 mx-auto">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 mb-4">
          <Grid2x2 className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">
            Complete Lighting Solutions
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
          Browse by Lighting Category
        </h1>

        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Nairobi's largest selection of premium lighting products. From
          energy-efficient LED bulbs to advanced solar systems.
        </p>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 border hover:bg-amber-50"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            All Categories
          </button>

          <button
            onClick={() => setSelectedCategory("solar-lights")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === "solar-lights"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 border hover:bg-amber-50"
            }`}
          >
            <Sun className="w-4 h-4" />
            Solar Lighting
          </button>

          <button
            onClick={() => setSelectedCategory("energy-saving")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === "energy-saving"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 border hover:bg-green-50"
            }`}
          >
            <Zap className="w-4 h-4" />
            Energy Saving
          </button>

          <button
            onClick={() => setSelectedCategory("security")}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === "security"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 border hover:bg-blue-50"
            }`}
          >
            <Shield className="w-4 h-4" />
            Security Lighting
          </button>
        </div>

        {/* Store Info */}
        <div className="mt-6 p-4 rounded-lg max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Duruma Road, Nairobi</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-600" />
              <a
                href="tel:0727833691"
                className="text-amber-700 font-medium hover:underline"
              >
                0727 833 691
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>2-Year Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 mb-12">
        {lightingCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="group relative overflow-hidden rounded-xl border border-amber-100 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Category Icon */}
            <div className="absolute top-3 left-3 z-20">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center shadow-lg`}
              >
                <category.icon className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Image Container */}
            <div className="aspect-square relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Fallback gradient if no image */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-20`}
              />

              {/* Category Name */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-lg font-bold mb-1">{category.name}</h2>
                <p className="text-xs opacity-90 line-clamp-2">
                  {category.description}
                </p>
              </div>

              {/* Shop Badge */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  <span>Shop Now</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 dark:from-amber-900/20 dark:to-yellow-900/20 border-t border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-700 font-medium">
                  Browse Products
                </span>
                <span className="text-xs font-medium text-amber-600 group-hover:translate-x-1 transition-transform">
                  View →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Store Benefits */}
      <div className="dark:bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-2xl p-6 md:p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Why Choose Blessed Two Electronics?
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-amber-200">
            <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Same-Day Delivery</h3>
            <p className="text-sm text-muted-foreground">
              Order by 2PM, get it today. Free delivery within Nairobi on orders
              above KES 3,000.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-amber-200">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">2-Year Warranty</h3>
            <p className="text-sm text-muted-foreground">
              All products come with 24-month warranty. Quality guaranteed or
              your money back.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-amber-200">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-3">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Expert Support</h3>
            <p className="text-sm text-muted-foreground">
              24/7 lighting experts available. Free consultation and
              installation advice.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Need Professional Lighting Solutions?
        </h3>
        <p className="text-muted-foreground mb-6">
          Our lighting experts can help you choose the perfect solutions for
          your home or business. Visit our store or schedule a consultation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            <Link href="/contact">
              <MapPin className="h-5 w-5 mr-2" />
              Visit Our Store
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-amber-300 text-amber-600 hover:bg-amber-50"
          >
            <a href="tel:0727833691">
              <Phone className="h-5 w-5 mr-2" />
              Call: 0727 833 691
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add missing icons
function Truck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
      />
    </svg>
  );
}

function Phone({ className }: { className?: string }) {
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
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function MapPin({ className }: { className?: string }) {
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
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
