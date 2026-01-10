"use client";

import { useState } from "react";
import { categories } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Filter, Grid2x2, Sparkles, ShoppingBag, Shirt } from "lucide-react";

export default function CategoriesPage() {
  const [viewMode, setViewMode] = useState<"martial-arts" | "general">(
    "martial-arts"
  );

  // Filter categories based on view mode
  const filteredCategories = categories.filter((category) => {
    if (viewMode === "martial-arts") {
      // Martial arts categories (first 9 from your array)
      const martialArtsSlugs = [
        "uniforms",
        "gear",
        "belts",
        "equipment",
        "merch",
        "accessories",
        "home",
        "media",
        "kids",
      ];
      return martialArtsSlugs.includes(category.slug);
    } else {
      // General store categories (the rest)
      const martialArtsSlugs = [
        "uniforms",
        "gear",
        "belts",
        "equipment",
        "merch",
        "accessories",
        "home",
        "media",
        "kids",
      ];
      return !martialArtsSlugs.includes(category.slug);
    }
  });

  return (
    <div className="container py-8 px-2 sm:px-4 mx-auto">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-4">
          <Grid2x2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Switch Store Types Instantly
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Flexible Category Systems
        </h1>

        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          This platform adapts to any business. Switch views to see how the same
          system works for different store types.
        </p>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={() => setViewMode("martial-arts")}
            className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              viewMode === "martial-arts"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-white dark:bg-gray-800 border hover:bg-muted"
            }`}
          >
            <Shirt className="w-4 h-4" />
            Martial Arts Demo
          </button>

          <button
            onClick={() => setViewMode("general")}
            className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
              viewMode === "general"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-white dark:bg-gray-800 border hover:bg-muted"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            General Store Demo
          </button>
        </div>

        {/* View Description */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg max-w-xl mx-auto">
          <p className="text-sm">
            {viewMode === "martial-arts"
              ? "Showing a specialized martial arts store with 9 categories. Perfect for niche businesses."
              : "Showing a general e-commerce store with 10+ categories. Perfect for multi-product businesses."}
          </p>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 mb-12">
        {filteredCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="group relative overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Customizable Badge */}
            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Custom</span>
              </div>
            </div>

            {/* Image Container */}
            <div className="aspect-square relative">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Category Name */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-lg font-bold mb-1">{category.name}</h2>
                <p className="text-xs opacity-90 line-clamp-2">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-background border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {viewMode === "martial-arts" ? "Demo Category" : "E-commerce"}
                </span>
                <span className="text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                  Shop →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Features Showcase */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 md:p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {viewMode === "martial-arts"
            ? "Specialized Store Features"
            : "General Store Features"}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Smart Filtering</h3>
            <p className="text-sm text-muted-foreground">
              {viewMode === "martial-arts"
                ? "Filter by belt rank, size, color, and training level"
                : "Filter by price, brand, size, color, and ratings"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
              <Grid2x2 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Flexible Layouts</h3>
            <p className="text-sm text-muted-foreground">
              {viewMode === "martial-arts"
                ? "Organize by training gear, apparel, and accessories"
                : "Organize by department, collections, or featured items"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Custom Attributes</h3>
            <p className="text-sm text-muted-foreground">
              {viewMode === "martial-arts"
                ? "Add custom fields for weight, material, and belt requirements"
                : "Add custom fields for specifications, warranties, and variants"}
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold mb-4">
          Ready for Your Custom Categories?
        </h3>
        <p className="text-muted-foreground mb-6">
          We'll design a category system that perfectly matches your products,
          customer journey, and business goals.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-cyan-500"
        >
          <Link href="/contact">Get Your Custom Store Design</Link>
        </Button>
      </div>
    </div>
  );
}
