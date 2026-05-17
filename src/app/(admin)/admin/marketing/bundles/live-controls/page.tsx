// app/admin/bundles/live-controls/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Eye,
  Gift,
  Zap,
  TrendingUp,
  Users,
  ShoppingBag,
  Crown,
  Package,
  RefreshCw,
  Star,
  Radio,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { Bundle } from "@/types/bundles";

interface LiveBundle extends Bundle {
  live_stream_active: boolean;
  live_viewers: number;
  live_purchases_today: number;
  live_stock_remaining: number;
}

export default function AdminLiveControls() {
  const { supabase, profile } = useAuth();
  const [bundles, setBundles] = useState<LiveBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<LiveBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({
    viewers: 0,
    purchases_today: 0,
    stock_remaining: 0,
    is_stream_active: false,
  });

  const bundleService = new BundleService(supabase);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data } = await supabase
        .from("bundles")
        .select("*")
        .in("bundle_type", [
          "mystery",
          "curated",
          "tiered",
          "subscription",
          "bonus_points",
        ])
        .order("created_at", { ascending: false });

      if (data) {
        // Enhance with live stats
        const enhancedBundles = await Promise.all(
          data.map(async (bundle) => {
            // Get today's purchases
            const today = new Date().toISOString().split("T")[0];
            const { count: purchasesToday } = await supabase
              .from("bundle_purchases")
              .select("id", { count: "exact", head: true })
              .eq("bundle_id", bundle.id)
              .gte("created_at", today);

            return {
              ...bundle,
              live_stream_active: bundle.is_stream_active || false,
              live_viewers: 0,
              live_purchases_today: purchasesToday || 0,
              live_stock_remaining: bundle.remaining_count || 0,
            };
          }),
        );
        setBundles(enhancedBundles);
      }
    } catch (error) {
      console.error("Error fetching bundles:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStreamActive = async (bundle: LiveBundle, active: boolean) => {
    const { error } = await supabase
      .from("bundles")
      .update({
        is_stream_active: active,
        ...(active && { is_live_exclusive: true }),
      })
      .eq("id", bundle.id);

    if (error) {
      toast.error("Failed to update stream status");
    } else {
      toast.success(
        `Stream ${active ? "activated" : "ended"} for ${bundle.name}`,
      );
      fetchBundles();
      if (selectedBundle?.id === bundle.id) {
        setSelectedBundle({
          ...selectedBundle,
          live_stream_active: active,
          is_stream_active: active,
        });
        setLiveStats((prev) => ({ ...prev, is_stream_active: active }));
      }
    }
  };

  const revealMysteryBundle = async (bundleId: string) => {
    const { error } = await supabase
      .from("bundles")
      .update({
        is_mystery_revealed: true,
        mystery_revealed_at: new Date().toISOString(),
      })
      .eq("id", bundleId);

    if (error) {
      toast.error("Failed to reveal mystery bundle");
    } else {
      toast.success("Mystery bundle revealed!");
      fetchBundles();
    }
  };

  const updateLiveStock = async (bundleId: string, newStock: number) => {
    const { error } = await supabase
      .from("bundles")
      .update({ remaining_count: newStock })
      .eq("id", bundleId);

    if (error) {
      toast.error("Failed to update stock");
    } else {
      toast.success(`Stock updated to ${newStock}`);
      fetchBundles();
    }
  };

  const openLiveDisplay = (bundleId: string) => {
    window.open(`/bundles/live/${bundleId}`, "_blank");
  };

  const getBundleIcon = (type: string) => {
    switch (type) {
      case "mystery":
        return <Gift className="h-4 w-4" />;
      case "curated":
        return <Crown className="h-4 w-4" />;
      case "tiered":
        return <TrendingUp className="h-4 w-4" />;
      case "subscription":
        return <RefreshCw className="h-4 w-4" />;
      case "bonus_points":
        return <Star className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p>Loading live controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Live Stream Controls</h1>
          <p className="text-muted-foreground mt-1">
            Manage live bundle streams and real-time interactions
          </p>
        </div>
        <Badge className="bg-red-500 text-white gap-2 px-4 py-2">
          <Radio className="h-4 w-4 animate-pulse" />
          Live Studio Mode
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bundle List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-lg">Active Bundles</h2>
          {bundles.filter((b) => b.status === "active").length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active bundles</p>
            </Card>
          ) : (
            bundles
              .filter((b) => b.status === "active")
              .map((bundle) => (
                <Card
                  key={bundle.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedBundle?.id === bundle.id
                      ? "ring-2 ring-purple-500"
                      : ""
                  }`}
                  onClick={() => setSelectedBundle(bundle)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getBundleIcon(bundle.bundle_type)}
                        <h3 className="font-semibold">{bundle.name}</h3>
                      </div>
                      {bundle.live_stream_active && (
                        <Badge className="bg-red-500 text-white text-xs animate-pulse">
                          LIVE
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{bundle.live_purchases_today} claims today</span>
                      <span>{bundle.live_stock_remaining} left</span>
                    </div>
                  </div>
                </Card>
              ))
          )}
        </div>

        {/* Live Controls Panel */}
        <div className="lg:col-span-2">
          {selectedBundle ? (
            <div className="space-y-6">
              {/* Stream Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Now Streaming: {selectedBundle.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLiveDisplay(selectedBundle.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Open Display
                      </Button>
                      <Button
                        variant={
                          selectedBundle.live_stream_active
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        onClick={() =>
                          toggleStreamActive(
                            selectedBundle,
                            !selectedBundle.live_stream_active,
                          )
                        }
                      >
                        <Radio className="h-4 w-4 mr-2" />
                        {selectedBundle.live_stream_active
                          ? "End Stream"
                          : "Start Stream"}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-muted">
                      <Users className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-2xl font-bold">
                        {liveStats.viewers || 42}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Live Viewers
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <ShoppingBag className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-2xl font-bold">
                        {selectedBundle.live_purchases_today}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Claims Today
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <Zap className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-2xl font-bold">
                        {selectedBundle.live_stock_remaining}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock Remaining
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stream Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Stream Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stock Control */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Manual Stock Adjustment</Label>
                      <p className="text-xs text-muted-foreground">
                        Update remaining stock during stream
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        defaultValue={selectedBundle.live_stock_remaining}
                        onBlur={(e) =>
                          updateLiveStock(
                            selectedBundle.id,
                            parseInt(e.target.value),
                          )
                        }
                      />
                      <Button size="sm" variant="outline">
                        Update
                      </Button>
                    </div>
                  </div>

                  {/* Mystery Bundle Reveal */}
                  {selectedBundle.bundle_type === "mystery" &&
                    !selectedBundle.is_mystery_revealed && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <div>
                          <Label className="text-purple-400">
                            Mystery Bundle
                          </Label>
                          <p className="text-xs text-purple-300">
                            Reveal contents to audience
                          </p>
                        </div>
                        <Button
                          onClick={() => revealMysteryBundle(selectedBundle.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Reveal Now
                        </Button>
                      </div>
                    )}

                  {/* Sound Effect Controls */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Purchase Sound Effect</Label>
                      <p className="text-xs text-muted-foreground">
                        Play sound on new claims
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => openLiveDisplay(selectedBundle.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Fullscreen Display
                    </Button>
                    <Button variant="outline">
                      <Volume2 className="h-4 w-4 mr-2" />
                      Test Sound
                    </Button>
                    <Button variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      View Bundle Details
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/bundles/${selectedBundle.id}`}>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Store Page
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bundle Selected</h3>
              <p className="text-muted-foreground">
                Select a bundle from the list to start streaming
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
