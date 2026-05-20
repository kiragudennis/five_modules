// app/(admin)/admin/marketing/deals/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { DealsService } from "@/lib/services/deals-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Zap,
  Gift,
  Package,
  Ticket,
  TrendingUp,
  Clock,
  Users,
  Coins,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  name: string;
  slug: string;
  description: string;
  deal_type: string;
  product_id: string | null;
  discount_type: string | null;
  discount_value: number | null;
  deal_price: number | null;
  bogo_config: any;
  free_gift_config: any;
  mystery_config: any;
  total_quantity: number | null;
  remaining_quantity: number | null;
  per_user_limit: number;
  starts_at: string;
  ends_at: string;
  status: string;
  featured_image_url: string | null;
  banner_color: string;
  bonus_points_per_purchase: number;
  points_required_for_early_access: number | null;
  points_to_revive: number | null;
  revive_duration_minutes: number;
  show_countdown: boolean;
  show_stock_counter: boolean;
  show_claim_ticker: boolean;
  urgency_levels: any[];
  created_at: string;
}

const DEAL_TYPES = [
  {
    value: "discount",
    label: "Discount",
    icon: TrendingDown,
    color: "from-green-500 to-emerald-500",
    description: "Percentage or fixed amount off",
  },
  {
    value: "bogo",
    label: "BOGO",
    icon: Package,
    color: "from-blue-500 to-cyan-500",
    description: "Buy One Get One",
  },
  {
    value: "free_gift",
    label: "Free Gift",
    icon: Gift,
    color: "from-purple-500 to-pink-500",
    description: "Free gift with purchase",
  },
  {
    value: "mystery",
    label: "Mystery Deal",
    icon: Ticket,
    color: "from-orange-500 to-red-500",
    description: "Hidden product and price",
  },
  {
    value: "flash_sale",
    label: "Flash Sale",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    description: "Limited time high-urgency",
  },
  {
    value: "daily_deal",
    label: "Daily Deal",
    icon: Calendar,
    color: "from-indigo-500 to-purple-500",
    description: "Rotating daily offer",
  },
];

export default function DealsAdminPage() {
  const { supabase, profile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const dealsService = new DealsService(supabase);

  const fetchDeals = useCallback(async () => {
    const { data } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });
    setDeals(data || []);
    setLoading(false);
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, images")
      .eq("status", "active")
      .limit(200);
    setProducts(data || []);
  }, [supabase]);

  useEffect(() => {
    fetchDeals();
    fetchProducts();
  }, [fetchDeals, fetchProducts]);

  const updateDealStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("deals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Deal ${status}`);
      fetchDeals();
    }
  };

  const deleteDeal = async (id: string) => {
    if (confirm("Delete this deal? This action cannot be undone.")) {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete deal");
      } else {
        toast.success("Deal deleted");
        fetchDeals();
      }
    }
  };

  const triggerFlashSale = async (id: string) => {
    try {
      await dealsService.triggerFlashSale(id);
      toast.success("Flash sale activated!");
      fetchDeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string, deal: Deal) => {
    const now = new Date();
    const start = new Date(deal.starts_at);
    const end = new Date(deal.ends_at);

    if (status === "active") {
      if (now < start)
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
            Scheduled
          </Badge>
        );
      if (now > end) return <Badge variant="secondary">Expired</Badge>;
      return <Badge className="bg-green-500 text-white">Active</Badge>;
    }

    const config: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      draft: { label: "Draft", variant: "secondary" },
      scheduled: { label: "Scheduled", variant: "outline" },
      paused: { label: "Paused", variant: "destructive" },
      ended: { label: "Ended", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };
    const c = config[status] || config.draft;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getDealTypeIcon = (type: string) => {
    const found = DEAL_TYPES.find((t) => t.value === type);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <TrendingDown className="h-4 w-4" />;
  };

  const getStockStatus = (deal: Deal) => {
    if (deal.total_quantity === null) return null;
    const remaining = deal.remaining_quantity ?? deal.total_quantity;
    const percentage = (remaining / deal.total_quantity) * 100;

    if (percentage <= 10)
      return { color: "text-red-500", label: "Critical", icon: AlertCircle };
    if (percentage <= 30)
      return { color: "text-orange-500", label: "Low", icon: AlertCircle };
    return { color: "text-green-500", label: "In Stock", icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Deals & Giveaways</h1>
          <p className="text-muted-foreground mt-1">
            Manage flash sales, BOGO offers, daily deals, and more
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedDeal(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDeal ? "Edit Deal" : "Create New Deal"}
              </DialogTitle>
              <DialogDescription>
                Configure your deal details, pricing, and schedule
              </DialogDescription>
            </DialogHeader>
            <DealForm
              initialDeal={selectedDeal}
              products={products}
              onSave={() => {
                fetchDeals();
                setDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal) => {
          const stockStatus = getStockStatus(deal);
          const isExpiring =
            new Date(deal.ends_at).getTime() - Date.now() < 60 * 60 * 1000;
          const StockIcon = stockStatus?.icon;

          return (
            <Card
              key={deal.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Header with gradient */}
              <div
                className={cn(
                  "h-32 bg-gradient-to-r p-4 text-white relative",
                  DEAL_TYPES.find((t) => t.value === deal.deal_type)?.color ||
                    "from-purple-500 to-pink-500",
                )}
              >
                {deal.featured_image_url ? (
                  <img
                    src={deal.featured_image_url}
                    alt={deal.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                ) : null}
                <div className="absolute top-4 right-4">
                  {getStatusBadge(deal.status, deal)}
                </div>
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  {getDealTypeIcon(deal.deal_type)}
                  <span className="text-sm opacity-90 capitalize">
                    {deal.deal_type.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-xl font-bold relative z-10 line-clamp-1">
                  {deal.name}
                </h3>
              </div>

              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {deal.description}
                </p>

                {/* Deal-specific info */}
                {deal.deal_type === "discount" && deal.discount_value && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                    <span className="text-sm">Discount:</span>
                    <Badge className="bg-green-500 text-white">
                      {deal.discount_type === "percentage"
                        ? `${deal.discount_value}% OFF`
                        : `KES ${deal.discount_value.toLocaleString()} OFF`}
                    </Badge>
                  </div>
                )}

                {deal.deal_type === "bogo" && deal.bogo_config && (
                  <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                    <p className="text-sm font-medium">
                      Buy {deal.bogo_config.buy_quantity}, Get{" "}
                      {deal.bogo_config.get_quantity}{" "}
                      {deal.bogo_config.get_discount_percent === 100
                        ? "FREE"
                        : `at ${deal.bogo_config.get_discount_percent}% OFF`}
                    </p>
                  </div>
                )}

                {deal.deal_type === "free_gift" && deal.free_gift_config && (
                  <div className="p-2 rounded-lg bg-purple-500/10 text-center">
                    <Gift className="h-4 w-4 inline mr-1" />
                    <span className="text-sm">
                      Free gift on orders over KES{" "}
                      {deal.free_gift_config.min_purchase_amount?.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Stock Info */}
                {deal.total_quantity !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stock:</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", stockStatus?.color)}>
                        {deal.remaining_quantity ?? deal.total_quantity} /{" "}
                        {deal.total_quantity}
                      </span>
                      {StockIcon && (
                        <StockIcon
                          className={cn("h-4 w-4", stockStatus?.color)}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Timing */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starts:</span>
                    <span className="font-mono">
                      {format(new Date(deal.starts_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ends:</span>
                    <span
                      className={cn(
                        "font-mono",
                        isExpiring && "text-red-500 font-medium",
                      )}
                    >
                      {format(new Date(deal.ends_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>

                {/* Points Integration */}
                <div className="flex flex-wrap gap-2">
                  {deal.bonus_points_per_purchase > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Coins className="h-3 w-3" />+
                      {deal.bonus_points_per_purchase} pts
                    </Badge>
                  )}
                  {deal.points_required_for_early_access && (
                    <Badge variant="outline" className="gap-1">
                      Early access: {deal.points_required_for_early_access} pts
                    </Badge>
                  )}
                  {deal.points_to_revive && (
                    <Badge variant="outline" className="gap-1">
                      Revive: {deal.points_to_revive} pts
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/deals/live/${deal.id}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      Live View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDeal(deal);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDeal(deal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Actions */}
                {deal.status === "draft" && deal.deal_type === "flash_sale" && (
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    onClick={() => triggerFlashSale(deal.id)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Launch Flash Sale Now
                  </Button>
                )}

                {deal.status === "scheduled" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => updateDealStatus(deal.id, "active")}
                  >
                    Activate Early
                  </Button>
                )}

                {deal.status === "active" &&
                  new Date(deal.ends_at) > new Date() && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => updateDealStatus(deal.id, "paused")}
                    >
                      Pause Deal
                    </Button>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {deals.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No deals yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first deal to start driving sales
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      )}
    </div>
  );
}

// Deal Form Component
function DealForm({
  initialDeal,
  products,
  onSave,
}: {
  initialDeal: Deal | null;
  products: any[];
  onSave: () => void;
}) {
  const { supabase } = useAuth();
  const [dealType, setDealType] = useState(
    initialDeal?.deal_type || "discount",
  );
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>(() => {
    const now = new Date();
    return (
      initialDeal || {
        name: "",
        slug: "",
        description: "",
        deal_type: "discount",
        product_id: null,
        discount_type: "percentage",
        discount_value: 20,
        total_quantity: null,
        remaining_quantity: null,
        per_user_limit: 1,
        starts_at: new Date(now.setHours(now.getHours() + 1))
          .toISOString()
          .slice(0, 16),
        ends_at: new Date(now.setDate(now.getDate() + 7))
          .toISOString()
          .slice(0, 16),
        status: "draft",
        banner_color: "#3B82F6",
        bonus_points_per_purchase: 0,
        points_required_for_early_access: null,
        points_to_revive: null,
        revive_duration_minutes: 10,
        show_countdown: true,
        show_stock_counter: true,
        show_claim_ticker: true,
        bogo_config: {
          buy_quantity: 1,
          get_quantity: 1,
          get_discount_percent: 100,
        },
        free_gift_config: { gift_product_id: null, min_purchase_amount: 5000 },
        mystery_config: { hidden_product_id: null, hidden_price: 0 },
        urgency_levels: [
          { threshold_minutes: 5, color: "green", message: "Plenty of time" },
          {
            threshold_minutes: 2,
            color: "yellow",
            message: "Hurry! Ending soon",
          },
          { threshold_minutes: 0, color: "red", message: "FINAL MINUTE!" },
        ],
      }
    );
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const slug = formData.slug || generateSlug(formData.name);
      const { error } = await supabase
        .from("deals")
        .upsert({
          ...formData,
          slug,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      toast.success(initialDeal ? "Deal updated" : "Deal created");
      onSave();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const typeConfig = DEAL_TYPES.find((t) => t.value === dealType);

  return (
    <div className="space-y-6 py-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Deal Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })
                }
                placeholder="e.g., Weekend Flash Sale"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="auto-generated"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              placeholder="Describe the deal..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Deal Type *</Label>
              <Select value={dealType} onValueChange={setDealType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Product</Label>
            <Select
              value={formData.product_id || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, product_id: value || null })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - KES {p.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Featured Image URL</Label>
            <Input
              value={formData.featured_image_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, featured_image_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div>
            <Label>Banner Color</Label>
            <Input
              type="color"
              value={formData.banner_color}
              onChange={(e) =>
                setFormData({ ...formData, banner_color: e.target.value })
              }
              className="w-20 h-10"
            />
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4 mt-4">
          {dealType === "discount" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (KES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_value: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          {dealType === "bogo" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Buy Quantity</Label>
                <Input
                  type="number"
                  value={formData.bogo_config?.buy_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bogo_config: {
                        ...formData.bogo_config,
                        buy_quantity: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Get Quantity</Label>
                <Input
                  type="number"
                  value={formData.bogo_config?.get_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bogo_config: {
                        ...formData.bogo_config,
                        get_quantity: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Discount % on Get</Label>
                <Input
                  type="number"
                  value={formData.bogo_config?.get_discount_percent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bogo_config: {
                        ...formData.bogo_config,
                        get_discount_percent: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {dealType === "free_gift" && (
            <div className="space-y-4">
              <div>
                <Label>Gift Product</Label>
                <Select
                  value={formData.free_gift_config?.gift_product_id || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      free_gift_config: {
                        ...formData.free_gift_config,
                        gift_product_id: value || null,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gift product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Minimum Purchase Amount (KES)</Label>
                <Input
                  type="number"
                  value={formData.free_gift_config?.min_purchase_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      free_gift_config: {
                        ...formData.free_gift_config,
                        min_purchase_amount: parseFloat(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {dealType === "mystery" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hidden Product</Label>
                <Select
                  value={formData.mystery_config?.hidden_product_id || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      mystery_config: {
                        ...formData.mystery_config,
                        hidden_product_id: value || null,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hidden Price (KES)</Label>
                <Input
                  type="number"
                  value={formData.mystery_config?.hidden_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mystery_config: {
                        ...formData.mystery_config,
                        hidden_price: parseFloat(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {dealType === "flash_sale" && (
            <div>
              <Label>Deal Price (KES)</Label>
              <Input
                type="number"
                value={formData.deal_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deal_price: parseFloat(e.target.value),
                  })
                }
                placeholder="Override product price"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Starts At</Label>
              <Input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) =>
                  setFormData({ ...formData, starts_at: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Ends At</Label>
              <Input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) =>
                  setFormData({ ...formData, ends_at: e.target.value })
                }
              />
            </div>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Total Quantity (optional)</Label>
              <Input
                type="number"
                value={formData.total_quantity || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_quantity: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                    remaining_quantity: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="Unlimited"
              />
            </div>
            <div>
              <Label>Per User Limit</Label>
              <Input
                type="number"
                value={formData.per_user_limit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    per_user_limit: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Countdown Timer</Label>
            <Switch
              checked={formData.show_countdown}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_countdown: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Stock Counter</Label>
            <Switch
              checked={formData.show_stock_counter}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_stock_counter: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Claim Ticker</Label>
            <Switch
              checked={formData.show_claim_ticker}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_claim_ticker: checked })
              }
            />
          </div>
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points" className="space-y-4 mt-4">
          <div>
            <Label>Bonus Points per Purchase</Label>
            <Input
              type="number"
              value={formData.bonus_points_per_purchase}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bonus_points_per_purchase: parseInt(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Points awarded to customers when they claim this deal
            </p>
          </div>

          <div>
            <Label>Early Access Cost (points)</Label>
            <Input
              type="number"
              value={formData.points_required_for_early_access || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  points_required_for_early_access: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              placeholder="Optional"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Points required for early access before public start
            </p>
          </div>

          <div>
            <Label>Revive Cost (points)</Label>
            <Input
              type="number"
              value={formData.points_to_revive || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  points_to_revive: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              placeholder="Optional"
            />
          </div>

          {formData.points_to_revive && (
            <div>
              <Label>Revive Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.revive_duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    revive_duration_minutes: parseInt(e.target.value),
                  })
                }
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Type Info Banner */}
      {typeConfig && (
        <div
          className={cn(
            "p-4 rounded-lg bg-gradient-to-r text-white",
            typeConfig.color,
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <typeConfig.icon className="h-5 w-5" />
            <span className="font-semibold">{typeConfig.label}</span>
          </div>
          <p className="text-sm opacity-90">{typeConfig.description}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => onSave()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {initialDeal ? "Update Deal" : "Create Deal"}
        </Button>
      </div>
    </div>
  );
}
