// app/accounts/[accountId]/bundles/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  ChevronLeft,
  Crown,
  Coins,
  Tag,
  Clock,
  Users,
  Sparkles,
  ShoppingBag,
  Loader2,
  Lock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

interface Bundle {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url: string | null;
  banner_url: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  bundle_price: number | null;
  products: Array<{
    product_id: string;
    quantity: number;
    required: boolean;
  }>;
  min_tier_required: string | null;
  points_required: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_purchases_allowed: number | null;
  max_purchases_per_user: number | null;
  current_purchases: number;
  featured: boolean;
  badge_text: string | null;
  badge_color: string | null;
  terms_conditions: string | null;
  created_at: string;
}

interface ProductDetails {
  id: string;
  name: string;
  price: number;
  images: string[];
}

export default function BundlesPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [userTier, setUserTier] = useState<string>("bronze");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [productDetails, setProductDetails] = useState<
    Map<string, ProductDetails>
  >(new Map());
  const [userPurchases, setUserPurchases] = useState<Map<string, number>>(
    new Map(),
  );

  useEffect(() => {
    if (!profile || profile.id !== accountId) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [accountId, profile]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get user's loyalty info
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from("loyalty_points")
        .select("tier, points")
        .eq("user_id", accountId)
        .single();

      if (!loyaltyError && loyaltyData) {
        setUserTier(loyaltyData.tier);
        setLoyaltyPoints(loyaltyData.points);
      }

      // Get user's bundle purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("bundle_purchases")
        .select("bundle_id, quantity")
        .eq("user_id", accountId);

      if (!purchasesError && purchasesData) {
        const purchaseMap = new Map();
        purchasesData.forEach((p: any) =>
          purchaseMap.set(p.bundle_id, p.quantity),
        );
        setUserPurchases(purchaseMap);
      }

      // Get available bundles
      const { data: bundlesData, error: bundlesError } = await supabase
        .from("mistry_bundles")
        .select("*")
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (bundlesError) throw bundlesError;

      // Filter bundles based on user's tier and points
      const accessibleBundles = bundlesData.filter((bundle: any) => {
        const tierOk =
          !bundle.min_tier_required || bundle.min_tier_required <= userTier;
        const pointsOk =
          bundle.points_required === 0 ||
          bundle.points_required <= loyaltyPoints;
        const notExpired =
          !bundle.end_date || new Date(bundle.end_date) > new Date();
        const notStarted =
          bundle.start_date && new Date(bundle.start_date) > new Date();
        return tierOk && pointsOk && notExpired && !notStarted;
      });

      setBundles(accessibleBundles);

      // Fetch product details for all bundles
      const productIds = new Set<string>();
      accessibleBundles.forEach((bundle: any) => {
        bundle.products.forEach((p: any) => productIds.add(p.product_id));
      });

      if (productIds.size > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, price, images")
          .in("id", Array.from(productIds));

        if (!productsError && productsData) {
          const productMap = new Map();
          productsData.forEach((p: any) => productMap.set(p.id, p));
          setProductDetails(productMap);
        }
      }
    } catch (error: any) {
      console.error("Error fetching bundles:", error);
      toast.error("Could not load bundles");
    } finally {
      setLoading(false);
    }
  };

  const calculateBundlePrice = (bundle: Bundle) => {
    if (bundle.bundle_price) return bundle.bundle_price;

    let total = 0;
    bundle.products.forEach((item) => {
      const product = productDetails.get(item.product_id);
      if (product) {
        total += product.price * item.quantity;
      }
    });

    if (bundle.discount_type === "percentage") {
      total = total * (1 - bundle.discount_value / 100);
    } else {
      total = total - bundle.discount_value;
    }

    return Math.max(0, total);
  };

  const calculateOriginalPrice = (bundle: Bundle) => {
    let total = 0;
    bundle.products.forEach((item) => {
      const product = productDetails.get(item.product_id);
      if (product) {
        total += product.price * item.quantity;
      }
    });
    return total;
  };

  const canPurchase = (bundle: Bundle) => {
    const userPurchased = userPurchases.get(bundle.id) || 0;
    const underUserLimit =
      !bundle.max_purchases_per_user ||
      userPurchased < bundle.max_purchases_per_user;
    const underGlobalLimit =
      !bundle.total_purchases_allowed ||
      bundle.current_purchases < bundle.total_purchases_allowed;
    return underUserLimit && underGlobalLimit;
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "platinum":
        return <Zap className="h-4 w-4" />;
      case "gold":
        return <Crown className="h-4 w-4" />;
      case "silver":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/accounts/${accountId}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mistry Bundles</h1>
            <p className="text-muted-foreground mt-1">
              Curated bundles with exclusive discounts
            </p>
          </div>
        </div>

        {/* User Status */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Tier</p>
                  <p className="text-2xl font-bold capitalize">{userTier}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Coins className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Loyalty Points
                  </p>
                  <p className="text-2xl font-bold">
                    {loyaltyPoints.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bundles Grid */}
        {bundles.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Bundles Available</h3>
                <p className="text-muted-foreground mb-6">
                  Check back later for exciting bundle offers!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => {
              const originalPrice = calculateOriginalPrice(bundle);
              const bundlePrice = calculateBundlePrice(bundle);
              const savings = originalPrice - bundlePrice;
              const canBuy = canPurchase(bundle);

              return (
                <Card
                  key={bundle.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Banner Image */}
                  {bundle.banner_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={bundle.banner_url}
                        alt={bundle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <CardContent className="p-6">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {bundle.featured && (
                        <Badge className="bg-yellow-500">Featured</Badge>
                      )}
                      {bundle.badge_text && (
                        <Badge
                          style={{
                            backgroundColor:
                              bundle.badge_color?.split(" ")[0] || "#000",
                          }}
                        >
                          {bundle.badge_text}
                        </Badge>
                      )}
                      {bundle.min_tier_required && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {getTierIcon(bundle.min_tier_required)}
                          {bundle.min_tier_required}
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2">{bundle.name}</h3>
                    {bundle.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {bundle.description}
                      </p>
                    )}

                    {/* Products Preview */}
                    <div className="space-y-2 mb-4">
                      {bundle.products.slice(0, 3).map((item, idx) => {
                        const product = productDetails.get(item.product_id);
                        return product ? (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm"
                          >
                            {product.images.length > 0 && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-8 w-8 object-cover rounded"
                              />
                            )}
                            <span className="flex-1 truncate">
                              {product.name}
                            </span>
                            <span className="font-medium">
                              x{item.quantity}
                            </span>
                          </div>
                        ) : null;
                      })}
                      {bundle.products.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{bundle.products.length - 3} more items
                        </p>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          KES {bundlePrice.toLocaleString()}
                        </span>
                        {originalPrice > bundlePrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            KES {originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {savings > 0 && (
                        <p className="text-sm text-green-600">
                          Save KES {savings.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Points Requirement */}
                    {bundle.points_required > 0 && (
                      <div className="flex items-center gap-2 text-sm mb-4 p-2 bg-blue-50 rounded">
                        <Coins className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700">
                          Requires {bundle.points_required} loyalty points
                        </span>
                      </div>
                    )}

                    {/* Availability */}
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      {bundle.end_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Available until{" "}
                            {format(new Date(bundle.end_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                      {bundle.max_purchases_per_user && (
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          <span>
                            Limit: {bundle.max_purchases_per_user} per user
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Purchase Button */}
                    <Button
                      className="w-full"
                      disabled={!canBuy}
                      onClick={() => router.push(`/bundles/${bundle.slug}`)}
                    >
                      {!canBuy ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Limit Reached
                        </>
                      ) : (
                        "View Bundle"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
