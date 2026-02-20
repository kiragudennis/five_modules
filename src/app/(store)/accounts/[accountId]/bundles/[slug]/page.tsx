// app/bundles/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useStore } from "@/lib/context/StoreContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Crown,
  Coins,
  ShoppingCart,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Users,
  Sparkles,
  Zap,
  Tag,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Bundle, Product } from "@/types/store";

interface ProductWithDetails extends Product {
  quantity: number;
  required: boolean;
}

export default function BundleDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { supabase, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [userTier, setUserTier] = useState<string>("bronze");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [userPurchases, setUserPurchases] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const { dispatch } = useStore();

  useEffect(() => {
    fetchBundleData();
  }, [slug]);

  const fetchBundleData = async () => {
    try {
      setLoading(true);

      // Get bundle details
      const { data: bundleData, error: bundleError } = await supabase
        .from("mistry_bundles")
        .select("*")
        .eq("slug", slug)
        .single();

      if (bundleError) throw bundleError;
      setBundle(bundleData);

      // Get product details
      const productIds = bundleData.products.map((p: any) => p.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Combine products with bundle quantities
      const productsWithQuantity = productsData.map((product: Product) => ({
        ...product,
        quantity:
          bundleData.products.find((p: any) => p.product_id === product.id)
            ?.quantity || 1,
        required:
          bundleData.products.find((p: any) => p.product_id === product.id)
            ?.required || false,
      }));

      setProducts(productsWithQuantity);

      // If user is logged in, get their loyalty info
      if (profile) {
        const { data: loyaltyData } = await supabase
          .from("loyalty_points")
          .select("tier, points")
          .eq("user_id", profile.id)
          .single();

        if (loyaltyData) {
          setUserTier(loyaltyData.tier);
          setLoyaltyPoints(loyaltyData.points);
        }

        // Get user's purchase count for this bundle
        const { data: purchasesData } = await supabase
          .from("bundle_purchases")
          .select("quantity")
          .eq("user_id", profile.id)
          .eq("bundle_id", bundleData.id);

        if (purchasesData) {
          setUserPurchases(
            purchasesData.reduce((sum: number, p: any) => sum + p.quantity, 0),
          );
        }
      }
    } catch (error: any) {
      console.error("Error fetching bundle:", error);
      toast.error("Could not load bundle");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculateOriginalPrice = () => {
    return products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  };

  const calculateBundlePrice = () => {
    if (!bundle) return 0;
    if (bundle.bundle_price) return bundle.bundle_price;

    const original = calculateOriginalPrice();
    if (bundle.discount_type === "percentage") {
      return original * (1 - bundle.discount_value / 100);
    } else {
      return original - bundle.discount_value;
    }
  };

  const canAccess = () => {
    if (!bundle) return false;
    const tierOk =
      !bundle.min_tier_required || bundle.min_tier_required <= userTier;
    const pointsOk =
      bundle.points_required === 0 || bundle.points_required <= loyaltyPoints;
    const notExpired =
      !bundle.end_date || new Date(bundle.end_date) > new Date();
    const started =
      !bundle.start_date || new Date(bundle.start_date) <= new Date();
    const underUserLimit =
      !bundle.max_purchases_per_user ||
      userPurchases < bundle.max_purchases_per_user;
    const underGlobalLimit =
      !bundle.total_purchases_allowed ||
      (bundle.current_purchases || 0) < bundle.total_purchases_allowed;

    return (
      tierOk &&
      pointsOk &&
      notExpired &&
      started &&
      underUserLimit &&
      underGlobalLimit
    );
  };

  const handleAddToCart = async () => {
    if (!profile) {
      toast.error("Please login to purchase");
      router.push("/login");
      return;
    }

    if (!canAccess()) {
      toast.error("You don't meet the requirements for this bundle");
      return;
    }

    setAddingToCart(true);

    try {
      // Clear any existing bundle metadata
      localStorage.removeItem("pending_bundle");

      // Generate a unique bundle instance ID to track this specific bundle purchase
      const bundleInstanceId = `${bundle?.id}_${Date.now()}`;

      // Add each product to cart with bundle metadata
      for (const product of products) {
        for (let i = 0; i < product.quantity; i++) {
          // Add to cart using your existing store dispatch
          dispatch({
            type: "ADD_TO_CART",
            payload: {
              product,
              quantity: 1,
              metadata: {
                isBundleItem: true,
                bundleId: bundle?.id,
                bundleInstanceId: bundleInstanceId,
                bundleName: bundle?.name,
                originalPrice: product.price,
              },
            },
          });
        }
      }

      // Store bundle metadata in localStorage for checkout
      const bundleMetadata = {
        bundle_id: bundle?.id,
        bundle_instance_id: bundleInstanceId,
        bundle_name: bundle?.name,
        bundle_slug: bundle?.slug,
        discount_type: bundle?.discount_type,
        discount_value: bundle?.discount_value,
        points_required: bundle?.points_required,
        min_tier_required: bundle?.min_tier_required,
        applied_at: new Date().toISOString(),
        items: products.map((p) => ({
          product_id: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
      };

      localStorage.setItem("pending_bundle", JSON.stringify(bundleMetadata));

      toast.success(
        `${products.reduce((sum, p) => sum + p.quantity, 0)} items added to cart!`,
      );
      router.push("/cart");
    } catch (error: any) {
      console.error("Error adding bundle to cart:", error);
      toast.error("Could not add bundle to cart");
    } finally {
      setAddingToCart(false);
    }
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

  if (!bundle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Bundle Not Found</h3>
              <Button onClick={() => router.push("/bundles")}>
                Browse Bundles
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const originalPrice = calculateOriginalPrice();
  const bundlePrice = calculateBundlePrice();
  const savings = originalPrice - bundlePrice;
  const accessible = canAccess();

  return (
    <div className="container mx-auto px-2 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            {bundle.banner_url ? (
              <img
                src={bundle.banner_url}
                alt={bundle.name}
                className="w-full rounded-lg shadow-lg"
              />
            ) : bundle.image_url ? (
              <img
                src={bundle.image_url}
                alt={bundle.name}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Tag className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {bundle.featured && (
                <Badge className="bg-yellow-500">Featured Bundle</Badge>
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
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold">{bundle.name}</h1>

            {/* Description */}
            {bundle.description && (
              <p className="text-muted-foreground">{bundle.description}</p>
            )}

            {/* Requirements */}
            {(bundle.min_tier_required || bundle.points_required > 0) && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Requirements</h3>
                {bundle.min_tier_required && (
                  <div className="flex items-center gap-2">
                    {getTierIcon(bundle.min_tier_required)}
                    <span>
                      Requires{" "}
                      <span className="font-medium capitalize">
                        {bundle.min_tier_required}
                      </span>{" "}
                      tier or higher
                    </span>
                    {userTier >= bundle.min_tier_required ? (
                      <Check className="h-4 w-4 text-green-600 ml-auto" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 ml-auto" />
                    )}
                  </div>
                )}
                {bundle.points_required > 0 && (
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    <span>
                      Requires{" "}
                      <span className="font-medium">
                        {bundle.points_required}
                      </span>{" "}
                      loyalty points
                    </span>
                    {loyaltyPoints >= bundle.points_required ? (
                      <Check className="h-4 w-4 text-green-600 ml-auto" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 ml-auto" />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Products List */}
            <div className="space-y-4">
              <h3 className="font-semibold">What's Included</h3>
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  {product.images.length > 0 && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {product.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      KES {product.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">each</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Regular Price:</span>
                <span className="line-through">
                  KES {originalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Bundle Price:</span>
                <span className="text-2xl font-bold text-primary">
                  KES {bundlePrice.toLocaleString()}
                </span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between items-center mt-2 text-green-600">
                  <span>You Save:</span>
                  <span className="font-semibold">
                    KES {savings.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="space-y-2 text-sm">
              {bundle.end_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Available until{" "}
                    {format(new Date(bundle.end_date), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
              {bundle.max_purchases_per_user && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span>
                    Limit: {bundle.max_purchases_per_user} per user
                    {userPurchases > 0 && ` (${userPurchases} purchased)`}
                  </span>
                </div>
              )}
            </div>

            {/* Terms */}
            {bundle.terms_conditions && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Terms & Conditions:</p>
                <p>{bundle.terms_conditions}</p>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={!accessible || addingToCart}
            >
              {addingToCart ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding to Cart...
                </>
              ) : !accessible ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Requirements Not Met
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add Bundle to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
