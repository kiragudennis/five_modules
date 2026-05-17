// app/account/bundles/page.tsx
// User account page showing bundle purchase and subscription history
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Star,
  RefreshCw,
  Calendar,
  ChevronRight,
  Download,
  Eye,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface UserBundlePurchase {
  id: string;
  bundle_id: string;
  bundle_name: string;
  bundle_type: string;
  bundle_image: string | null;
  quantity: number;
  final_price: number;
  points_awarded: number;
  points_used: number;
  status: string;
  created_at: string;
  is_subscription: boolean;
  subscription_id?: string;
}

interface UserSubscription {
  id: string;
  bundle_id: string;
  bundle_name: string;
  bundle_type: string;
  interval: string;
  next_delivery_date: string;
  last_delivery_date: string | null;
  delivery_count: number;
  status: string;
  created_at: string;
}

export default function MyBundlesPage() {
  const { supabase, profile } = useAuth();
  const [purchases, setPurchases] = useState<UserBundlePurchase[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("purchases");

  const bundleService = new BundleService(supabase);

  const fetchPurchases = useCallback(async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from("bundle_purchases")
      .select(
        `
        id,
        bundle_id,
        quantity,
        final_price,
        points_awarded,
        points_used,
        status,
        created_at,
        is_recurring,
        subscription_id,
        bundles:bundle_id (name, bundle_type, image_url)
      `,
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchases:", error);
      return;
    }

    setPurchases(
      data.map((p: any) => ({
        id: p.id,
        bundle_id: p.bundle_id,
        bundle_name: p.bundles?.name || "Unknown Bundle",
        bundle_type: p.bundles?.bundle_type || "curated",
        bundle_image: p.bundles?.image_url || null,
        quantity: p.quantity,
        final_price: p.final_price,
        points_awarded: p.points_awarded,
        points_used: p.points_used,
        status: p.status,
        created_at: p.created_at,
        is_subscription: p.is_recurring || false,
        subscription_id: p.subscription_id,
      })),
    );
  }, [supabase, profile?.id]);

  const fetchSubscriptions = useCallback(async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from("bundle_subscriptions")
      .select(
        `
        id,
        bundle_id,
        interval_type,
        next_delivery_date,
        last_delivery_date,
        delivery_count,
        status,
        created_at,
        bundles:bundle_id (name, bundle_type, image_url)
      `,
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return;
    }

    setSubscriptions(
      data.map((s: any) => ({
        id: s.id,
        bundle_id: s.bundle_id,
        bundle_name: s.bundles?.name || "Unknown Bundle",
        bundle_type: s.bundles?.bundle_type || "subscription",
        interval: s.interval_type,
        next_delivery_date: s.next_delivery_date,
        last_delivery_date: s.last_delivery_date,
        delivery_count: s.delivery_count,
        status: s.status,
        created_at: s.created_at,
      })),
    );
  }, [supabase, profile?.id]);

  useEffect(() => {
    Promise.all([fetchPurchases(), fetchSubscriptions()]).finally(() => {
      setLoading(false);
    });
  }, [fetchPurchases, fetchSubscriptions]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;

    const { error } = await supabase
      .from("bundle_subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", subscriptionId);

    if (error) {
      alert("Failed to cancel subscription");
    } else {
      fetchSubscriptions();
      alert("Subscription cancelled successfully");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Bundles</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">My Bundles</h1>
      <p className="text-muted-foreground mb-6">
        Manage your bundle purchases and subscriptions
      </p>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="purchases">
            Purchases ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            Subscriptions ({subscriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          {purchases.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't claimed any bundles yet.
              </p>
              <Button asChild>
                <Link href="/bundles">Browse Bundles</Link>
              </Button>
            </Card>
          ) : (
            purchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-32 h-32 bg-muted flex items-center justify-center">
                    {purchase.bundle_image ? (
                      <img
                        src={purchase.bundle_image}
                        alt={purchase.bundle_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {purchase.bundle_name}
                          </h3>
                          {purchase.is_subscription && (
                            <Badge variant="outline" className="text-xs">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Subscription
                            </Badge>
                          )}
                          {purchase.points_awarded > 0 && (
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-0">
                              <Star className="h-3 w-3 mr-1" />+
                              {purchase.points_awarded} pts
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Claimed on{" "}
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatPrice(purchase.final_price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {purchase.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center mt-3 pt-3 border-t">
                      <Badge
                        variant={
                          purchase.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {purchase.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/bundles/${purchase.bundle_id}`}>
                          View Bundle
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {subscriptions.length === 0 ? (
            <Card className="p-12 text-center">
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No active subscriptions
              </h3>
              <p className="text-muted-foreground mb-4">
                Subscribe to a bundle for recurring deliveries.
              </p>
              <Button asChild>
                <Link href="/bundles?type=subscription">
                  Explore Subscriptions
                </Link>
              </Button>
            </Card>
          ) : (
            subscriptions.map((subscription) => (
              <Card key={subscription.id} className="p-4">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h3 className="font-semibold">
                      {subscription.bundle_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {subscription.interval}
                      </Badge>
                      <Badge
                        variant={
                          subscription.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        Next delivery:{" "}
                        {new Date(
                          subscription.next_delivery_date,
                        ).toLocaleDateString()}
                      </p>
                      {subscription.last_delivery_date && (
                        <p className="text-sm flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          Last delivery:{" "}
                          {new Date(
                            subscription.last_delivery_date,
                          ).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Deliveries completed: {subscription.delivery_count}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {subscription.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelSubscription(subscription.id)}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/bundles/${subscription.bundle_id}`}>
                        View Bundle
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
