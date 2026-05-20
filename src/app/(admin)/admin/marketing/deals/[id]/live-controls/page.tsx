// app/(admin)/admin/marketing/deals/[dealId]/live-controls/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { DealsService } from "@/lib/services/deals-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Clock,
  Package,
  Gift,
  Eye,
  Coins,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
  RefreshCw,
  EyeOff,
  Users,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Deal {
  id: string;
  name: string;
  description: string;
  deal_type: string;
  status: string;
  starts_at: string;
  ends_at: string;
  total_quantity: number | null;
  remaining_quantity: number | null;
  per_user_limit: number;
  bonus_points_per_purchase: number;
  points_required_for_early_access: number | null;
  points_to_revive: number | null;
  revive_duration_minutes: number;
  show_countdown: boolean;
  show_stock_counter: boolean;
  show_claim_ticker: boolean;
  urgency_levels: any[];
  mystery_config: any;
}

interface DealStatus {
  is_active: boolean;
  time_remaining_ms: number;
  time_remaining_formatted: string;
  urgency_level: any;
  stock_remaining: number | null;
  stock_percentage: number;
  can_claim: boolean;
  user_claims_count: number;
  remaining_user_claims: number;
  can_revive: boolean;
  revive_cost_points: number | null;
}

export default function DealLiveControlsPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const { supabase } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState<DealStatus | null>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [extendMinutes, setExtendMinutes] = useState(10);
  const [addStockAmount, setAddStockAmount] = useState(25);
  const [revealing, setRevealing] = useState(false);
  const [extending, setExtending] = useState(false);
  const [addingStock, setAddingStock] = useState(false);

  const dealsService = new DealsService(supabase);

  const loadData = useCallback(async () => {
    if (!dealId) return;

    const { data: dealData } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();
    setDeal(dealData);

    const dealStatus = await dealsService.getDealStatus(dealId);
    setStatus(dealStatus);

    const { data: claimsData } = await supabase
      .from("deal_claims")
      .select("*, users!user_id(full_name, email)")
      .eq("deal_id", dealId)
      .order("claimed_at", { ascending: false })
      .limit(20);
    setClaims(claimsData || []);

    setLoading(false);
  }, [dealId, supabase, dealsService]);

  useEffect(() => {
    loadData();

    // Refresh every 2 seconds for countdown
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleTriggerFlashSale = async () => {
    try {
      await dealsService.triggerFlashSale(dealId);
      toast.success("Flash sale triggered!");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleExtendTimer = async () => {
    setExtending(true);
    try {
      await dealsService.extendTimer(dealId, extendMinutes);
      toast.success(`Timer extended by ${extendMinutes} minutes`);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setExtending(false);
    }
  };

  const handleAddStock = async () => {
    setAddingStock(true);
    try {
      await dealsService.addStock(dealId, addStockAmount);
      toast.success(`Added ${addStockAmount} units`);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAddingStock(false);
    }
  };

  const handleRevealMystery = async () => {
    setRevealing(true);
    try {
      const result = await dealsService.revealMysteryDeal(dealId);
      toast.success(
        `Revealed: ${result.product_name} at KES ${result.price.toLocaleString()}`,
      );
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRevealing(false);
    }
  };

  const getUrgencyColor = () => {
    if (!status) return "text-gray-400";
    switch (status.urgency_level?.color) {
      case "green":
        return "text-green-500";
      case "yellow":
        return "text-yellow-500";
      case "red":
        return "text-red-500 animate-pulse";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
        <p className="text-muted-foreground">
          The deal you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b backdrop-blur-sm bg-purple-950/80 border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400 font-mono">
                  LIVE CONTROL PANEL
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{deal.name}</h1>
              <p className="text-sm text-purple-300">{deal.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href={`/deals/live/${deal.id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Open Live Display
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card className="bg-black/30 backdrop-blur border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Live Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300">Current Status:</span>
                  <Badge
                    className={cn(
                      "text-white",
                      deal.status === "active"
                        ? "bg-green-500"
                        : deal.status === "paused"
                          ? "bg-yellow-500"
                          : "bg-gray-500",
                    )}
                  >
                    {deal.status.toUpperCase()}
                  </Badge>
                </div>

                {status?.is_active && (
                  <>
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className={cn("h-6 w-6", getUrgencyColor())} />
                        <span className={cn("text-sm", getUrgencyColor())}>
                          {status.urgency_level?.message}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "text-5xl font-mono font-bold",
                          getUrgencyColor(),
                        )}
                      >
                        {status.time_remaining_formatted}
                      </div>
                    </div>

                    {deal.show_stock_counter &&
                      status.stock_remaining !== null && (
                        <div>
                          <div className="flex justify-between text-sm text-purple-300 mb-1">
                            <span>Stock Remaining</span>
                            <span
                              className={
                                status.stock_remaining < 10
                                  ? "text-red-400 font-bold"
                                  : ""
                              }
                            >
                              {status.stock_remaining} / {deal.total_quantity}
                            </span>
                          </div>
                          <Progress
                            value={status.stock_percentage}
                            className="h-3 bg-purple-950"
                          />
                          {status.stock_remaining < 10 &&
                            status.stock_remaining > 0 && (
                              <div className="flex items-center justify-center gap-1 mt-2 text-red-400 animate-pulse">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-bold">
                                  CRITICAL STOCK!
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Admin Controls */}
            <Card className="bg-black/30 backdrop-blur border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Live Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Flash Sale Trigger */}
                {deal.deal_type === "flash_sale" && deal.status === "draft" && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                    <h4 className="font-semibold text-orange-400 mb-2">
                      Flash Sale Control
                    </h4>
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      onClick={handleTriggerFlashSale}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Trigger Flash Sale Now
                    </Button>
                  </div>
                )}

                {/* Extend Timer */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold text-blue-400 mb-3">
                    Extend Timer
                  </h4>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={extendMinutes}
                      onChange={(e) =>
                        setExtendMinutes(parseInt(e.target.value))
                      }
                      className="w-32"
                      min="1"
                      max="60"
                    />
                    <Button
                      onClick={handleExtendTimer}
                      disabled={extending}
                      className="flex-1"
                    >
                      {extending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      +{extendMinutes} minutes
                    </Button>
                  </div>
                </div>

                {/* Add Stock */}
                {deal.total_quantity !== null && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <h4 className="font-semibold text-green-400 mb-3">
                      Add Stock
                    </h4>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        value={addStockAmount}
                        onChange={(e) =>
                          setAddStockAmount(parseInt(e.target.value))
                        }
                        className="w-32"
                        min="1"
                      />
                      <Button
                        onClick={handleAddStock}
                        disabled={addingStock}
                        className="flex-1"
                      >
                        {addingStock ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Package className="h-4 w-4 mr-2" />
                        )}
                        +{addStockAmount} units
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reveal Mystery Deal */}
                {deal.deal_type === "mystery" &&
                  !deal.mystery_config?.revealed_at && (
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <h4 className="font-semibold text-purple-400 mb-3">
                        Mystery Deal Control
                      </h4>
                      <Button
                        onClick={handleRevealMystery}
                        disabled={revealing}
                        className="w-full"
                      >
                        {revealing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        Reveal Mystery Deal
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Stats & Claims */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <Card className="bg-black/30 backdrop-blur border-purple-500/30">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300">Total Claims</span>
                    <span className="text-2xl font-bold text-white">
                      {claims.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300">Per User Limit</span>
                    <span className="text-white font-medium">
                      {deal.per_user_limit}
                    </span>
                  </div>
                  {deal.bonus_points_per_purchase > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300">Points Bonus</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        +{deal.bonus_points_per_purchase} pts
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Claims */}
            <Card className="bg-black/30 backdrop-blur border-purple-500/30 h-[400px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Recent Claims
                  <Badge variant="outline" className="ml-2 text-purple-300">
                    {claims.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {claims.length === 0 ? (
                    <div className="text-center py-8 text-purple-300">
                      <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No claims yet</p>
                    </div>
                  ) : (
                    claims.map((claim, idx) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {claim.users?.full_name || "Anonymous"}
                          </p>
                          <p className="text-xs text-purple-300">
                            {new Date(claim.claimed_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline">x{claim.quantity}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
