// app/bundles/[bundleId]/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Package,
  Star,
  ShoppingBag,
  ArrowRight,
  Share2,
  Download,
  Gift,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { RefreshCw } from "lucide-react";
import { Bundle } from "@/types/bundles";

interface PurchaseDetails {
  id: string;
  bundle_id: string;
  quantity: number;
  final_price: number;
  points_awarded: number;
  points_used: number;
  created_at: string;
  selected_items?: any[];
}

export default function BundleSuccessPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [purchase, setPurchase] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const bundleService = new BundleService(supabase);

  useEffect(() => {
    const purchaseId = searchParams.get("purchase");
    if (!purchaseId) {
      router.push("/bundles");
      return;
    }

    const loadData = async () => {
      try {
        // Fetch purchase details
        const { data: purchaseData } = await supabase
          .from("bundle_purchases")
          .select("*")
          .eq("id", purchaseId)
          .single();

        if (purchaseData) {
          setPurchase(purchaseData);

          // Fetch bundle details
          const bundleData = await bundleService.getBundleById(
            purchaseData.bundle_id,
          );
          setBundle(bundleData);
        }

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#9333ea", "#ec4899", "#fbbf24"],
        });
      } catch (error) {
        console.error("Error loading purchase:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bundleId, searchParams, router, bundleService, supabase]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `I just claimed ${bundle?.name}!`,
        text: `Check out this amazing bundle I got!`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your purchase...</p>
        </div>
      </div>
    );
  }

  if (!bundle || !purchase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-purple-950 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Purchase Not Found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find your purchase details.
          </p>
          <Button onClick={() => router.push("/bundles")}>
            Browse Bundles
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Purchase Successful! 🎉</h1>
            <p className="text-muted-foreground">
              You've successfully claimed {bundle.name}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Bundle Summary */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Bundle Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bundle Name</span>
                  <span className="font-medium">{bundle.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">x{purchase.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Price</span>
                  <span className="line-through text-muted-foreground">
                    {formatPrice(bundle.base_price * purchase.quantity)}
                  </span>
                </div>
                {purchase.points_used > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Points Used</span>
                    <span>-{purchase.points_used} points</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total Paid</span>
                  <span className="text-green-600">
                    {formatPrice(purchase.final_price)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Points & Rewards */}
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Points & Rewards
              </h2>

              {purchase.points_awarded > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">
                      +{purchase.points_awarded} Points Earned!
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Points have been added to your loyalty balance
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-sm">
                    {purchase.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Date</span>
                  <span>
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t">
                <Progress value={100} className="h-1" />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Your order is being processed. You'll receive shipping
                  confirmation soon.
                </p>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleShare} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Your Win
            </Button>
            <Button asChild variant="outline">
              <Link href="/account/bundles">
                <Package className="h-4 w-4 mr-2" />
                My Bundles
              </Link>
            </Button>
            <Button asChild>
              <Link href="/bundles">
                Continue Shopping
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Upsell Suggestions */}
          <Card className="mt-6 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5" />
              You Might Also Like
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/bundles?type=subscription">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Subscribe & Save
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/bundles?type=mystery">
                  <Gift className="h-4 w-4 mr-2" />
                  Mystery Bundles
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/bundles?type=bonus_points">
                  <Star className="h-4 w-4 mr-2" />
                  Bonus Points Deals
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
