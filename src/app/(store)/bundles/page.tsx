// app/(store)/bundles/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import {
  Gift,
  Star,
  Crown,
  Package,
  RefreshCw,
  TrendingUp,
  Sparkles,
  Clock,
  Users,
  Coins,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Bundle } from "@/types/bundles";

const BUNDLE_ICONS = {
  mystery: {
    icon: Gift,
    label: "Mystery Bundle",
    color: "from-purple-500 to-pink-500",
  },
  curated: {
    icon: Crown,
    label: "Curated Collection",
    color: "from-amber-500 to-yellow-500",
  },
  build_own: {
    icon: Package,
    label: "Build Your Own",
    color: "from-blue-500 to-cyan-500",
  },
  tiered: {
    icon: TrendingUp,
    label: "Tiered Savings",
    color: "from-green-500 to-emerald-500",
  },
  subscription: {
    icon: RefreshCw,
    label: "Subscribe & Save",
    color: "from-indigo-500 to-purple-500",
  },
  bonus_points: {
    icon: Star,
    label: "Points Bundle",
    color: "from-yellow-500 to-orange-500",
  },
};

export default function BundlesPage() {
  const { supabase } = useAuth();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const bundleService = new BundleService(supabase);

  const fetchBundles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bundleService.getActiveBundles();
      setBundles(data);
    } catch (error) {
      console.error("Error fetching bundles:", error);
    } finally {
      setLoading(false);
    }
  }, [bundleService]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const filteredBundles = selectedType
    ? bundles.filter((b) => b.bundle_type === selectedType)
    : bundles;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-48 w-full rounded-lg mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-28" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <Badge className="bg-white/20 text-white mb-4 animate-pulse">
            🔥 Limited Time Offers
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Bundle & Save</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Get amazing deals on product bundles. Save more when you buy more!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Bundle Type Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            onClick={() => setSelectedType(null)}
            className="rounded-full"
          >
            All Bundles
          </Button>
          {Object.entries(BUNDLE_ICONS).map(([type, config]) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              onClick={() => setSelectedType(type)}
              className="rounded-full gap-2"
            >
              <config.icon className="h-4 w-4" />
              {config.label}
            </Button>
          ))}
        </div>

        {/* Bundles Grid */}
        {filteredBundles.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bundles available</h3>
            <p className="text-muted-foreground">
              Check back soon for exciting bundle deals!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBundles.map((bundle) => {
              const config = BUNDLE_ICONS[bundle.bundle_type];
              const isLowStock =
                bundle.remaining_count !== null && bundle.remaining_count <= 10;
              const isSoldOut = bundle.remaining_count === 0;
              const hasEnded =
                !!bundle.ends_at && new Date(bundle.ends_at) < new Date();

              return (
                <Card
                  key={bundle.id}
                  className={cn(
                    "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                    isSoldOut && "opacity-60",
                  )}
                >
                  {/* Bundle Image/Header */}
                  <div
                    className={cn(
                      "relative h-48 bg-gradient-to-r",
                      config.color,
                    )}
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/20 text-white border-0 gap-2">
                        <config.icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                    {bundle.badge_text && (
                      <div className="absolute top-4 right-4">
                        <Badge
                          className={cn("border-0", bundle.badge_color)}
                          style={{
                            backgroundColor: bundle.badge_color?.split(" ")[0],
                          }}
                        >
                          {bundle.badge_text}
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl font-bold text-white mb-1">
                        {bundle.name}
                      </h2>
                      <p className="text-sm text-white/80 line-clamp-2">
                        {bundle.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Price */}
                    <div className="mb-3">
                      {bundle.discounted_price ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-primary">
                            {formatPrice(bundle.discounted_price)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(bundle.base_price)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-green-500 text-white"
                          >
                            Save {bundle.savings_percentage}%
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(bundle.base_price)}
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-4 text-sm">
                      {bundle.bonus_points > 0 && (
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                          <Star className="h-4 w-4" />
                          <span>+{bundle.bonus_points} bonus points</span>
                        </div>
                      )}
                      {bundle.points_required > 0 && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Coins className="h-4 w-4" />
                          <span>{bundle.points_required} points required</span>
                        </div>
                      )}
                      {bundle.min_items_to_select > 1 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>
                            Choose {bundle.min_items_to_select}-
                            {bundle.max_items_to_select} items
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className="mb-4">
                      {isSoldOut ? (
                        <Badge
                          variant="destructive"
                          className="w-full justify-center"
                        >
                          Sold Out
                        </Badge>
                      ) : (
                        isLowStock && (
                          <div className="flex items-center gap-2 text-orange-500 text-xs">
                            <Zap className="h-3 w-3" />
                            <span>Only {bundle.remaining_count} left!</span>
                          </div>
                        )
                      )}
                      {bundle.is_live_exclusive && bundle.is_stream_active && (
                        <div className="flex items-center gap-2 text-red-500 text-xs mt-1">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span>Live Stream Exclusive</span>
                        </div>
                      )}
                      {hasEnded && (
                        <Badge
                          variant="secondary"
                          className="w-full justify-center"
                        >
                          Ended
                        </Badge>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      asChild
                      className="w-full"
                      disabled={isSoldOut || hasEnded}
                    >
                      <Link href={`/bundles/${bundle.id}`}>
                        {bundle.bundle_type === "build_own"
                          ? "Build Bundle →"
                          : "View Bundle →"}
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
