// app/admin/bundles/page.tsx - Complete redesigned version

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
  Gift,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  Crown,
  Coins,
  TrendingUp,
  RefreshCw,
  Star,
  Eye,
  Loader2,
  Zap,
  Calendar,
  Users,
  ShoppingBag,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProductSearch } from "@/components/admin/product-search";

const BUNDLE_TYPES = [
  {
    value: "curated",
    label: "Curated Bundle",
    icon: Crown,
    color: "from-amber-500 to-yellow-500",
  },
  {
    value: "build_own",
    label: "Build Your Own",
    icon: Package,
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "tiered",
    label: "Tiered Bundle",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
  },
  {
    value: "subscription",
    label: "Subscription",
    icon: RefreshCw,
    color: "from-indigo-500 to-purple-500",
  },
  {
    value: "bonus_points",
    label: "Bonus Points",
    icon: Star,
    color: "from-yellow-500 to-orange-500",
  },
  {
    value: "mystery",
    label: "Mystery Bundle",
    icon: Gift,
    color: "from-purple-500 to-pink-500",
  },
];

export default function AdminBundlesPage() {
  const { supabase, profile } = useAuth();
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBundles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bundles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (error: any) {
      console.error("Error fetching bundles:", error);
      toast.error("Could not load bundles");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, images, category, stock")
      .eq("status", "active")
      .limit(100);

    if (error) {
      console.error("Error fetching products:", error);
      return;
    }
    setProducts(data || []);
  }, [supabase]);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    fetchBundles();
    fetchProducts();
  }, [profile, fetchBundles, fetchProducts]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSaveBundle = async () => {
    try {
      setSaving(true);

      if (!editingBundle.name || !editingBundle.bundle_type) {
        toast.error("Please fill in all required fields");
        return;
      }

      let productsJson = {};

      if (editingBundle.bundle_type === "curated") {
        productsJson = {
          type: "curated",
          items: selectedProducts.map((p, idx) => ({
            product_id: p.id,
            quantity: p.quantity || 1,
            display_order: idx,
            required: true,
          })),
        };
      } else if (editingBundle.bundle_type === "build_own") {
        // FIX: For Build-Your-Own, we need to collect the selected product IDs
        const productIds = selectedProducts.map((p) => p.id);

        productsJson = {
          type: "build_own",
          categories: editingBundle.eligible_categories,
          product_pool: productIds, // Save selected product IDs here
          min_items: editingBundle.min_items_to_select || 1,
          max_items: editingBundle.max_items_to_select || 5,
        };

        // Also update eligible_product_ids for the database
        editingBundle.eligible_product_ids = productIds;
      } else if (editingBundle.bundle_type === "tiered") {
        productsJson = {
          type: "tiered",
          items: selectedProducts.map((p) => ({
            product_id: p.id,
            quantity: p.quantity || 1,
          })),
          tiers: editingBundle.tier_config || [],
        };
      } else if (editingBundle.bundle_type === "subscription") {
        productsJson = {
          type: "subscription",
          items: selectedProducts.map((p) => ({
            product_id: p.id,
            quantity: p.quantity || 1,
          })),
          interval: editingBundle.subscription_interval,
          commitment_months: editingBundle.subscription_duration_months,
        };
      } else if (editingBundle.bundle_type === "bonus_points") {
        productsJson = {
          type: "bonus_points",
          items: selectedProducts.map((p) => ({
            product_id: p.id,
            quantity: p.quantity || 1,
          })),
          points_per_bundle: editingBundle.bonus_points,
        };
      } else if (editingBundle.bundle_type === "mystery") {
        // For mystery bundles, collect product pool
        const productIds = selectedProducts.map((p) => p.id);

        productsJson = {
          type: "mystery",
          min_value: editingBundle.mystery_products?.min_value || 0,
          max_value: editingBundle.mystery_products?.max_value || 0,
          product_pool: productIds,
          quantity: editingBundle.mystery_products?.quantity || 3,
        };

        editingBundle.eligible_product_ids = productIds;
      }

      const bundleData = {
        ...editingBundle,
        slug: editingBundle.slug || generateSlug(editingBundle.name),
        products: productsJson,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingBundle.id) {
        const { error: updateError } = await supabase
          .from("bundles")
          .update(bundleData)
          .eq("id", editingBundle.id);
        error = updateError;
      } else {
        bundleData.created_by = profile?.id;
        bundleData.current_purchases = 0;
        const { error: insertError } = await supabase
          .from("bundles")
          .insert([bundleData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(
        `Bundle ${editingBundle.id ? "updated" : "created"} successfully`,
      );
      setDialogOpen(false);
      setEditingBundle({});
      setSelectedProducts([]);
      fetchBundles();
    } catch (error: any) {
      console.error("Error saving bundle:", error);
      toast.error("Could not save bundle");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBundle = async (id: string) => {
    if (!confirm("Delete this bundle? This action cannot be undone.")) return;

    try {
      const { error } = await supabase.from("bundles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bundle deleted successfully");
      fetchBundles();
    } catch (error: any) {
      console.error("Error deleting bundle:", error);
      toast.error("Could not delete bundle");
    }
  };

  const copyBundleId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Bundle ID copied");
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      draft: { label: "Draft", variant: "secondary" },
      active: { label: "Active", variant: "default" },
      inactive: { label: "Inactive", variant: "outline" },
      expired: { label: "Expired", variant: "destructive" },
      archived: { label: "Archived", variant: "secondary" },
    };
    const c = config[status] || config.draft;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
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
          <h1 className="text-3xl font-bold">Bundles Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage product bundles, mystery boxes, and subscription
            deals
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingBundle({
                  bundle_type: "curated",
                  status: "draft",
                  max_per_customer: 1,
                  bonus_points: 0,
                  points_required: 0,
                  eligible_tiers: [],
                  min_items_to_select: 1,
                  max_items_to_select: 5,
                  mystery_reveal_mode: "manual",
                });
                setSelectedProducts([]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBundle.id ? "Edit Bundle" : "Create New Bundle"}
              </DialogTitle>
              <DialogDescription>
                Configure your bundle details, pricing, and availability
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bundle Type *</Label>
                    <Select
                      value={editingBundle.bundle_type}
                      onValueChange={(value) =>
                        setEditingBundle({
                          ...editingBundle,
                          bundle_type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bundle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUNDLE_TYPES.map((type) => (
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
                  <div className="space-y-2">
                    <Label>Bundle Name *</Label>
                    <Input
                      value={editingBundle.name || ""}
                      onChange={(e) => {
                        const name = e.target.value;
                        setEditingBundle({
                          ...editingBundle,
                          name,
                          slug: generateSlug(name),
                        });
                      }}
                      placeholder="e.g., Solar Starter Kit"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={editingBundle.slug || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          slug: e.target.value,
                        })
                      }
                      placeholder="auto-generated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editingBundle.status || "draft"}
                      onValueChange={(value) =>
                        setEditingBundle({ ...editingBundle, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingBundle.description || ""}
                    onChange={(e) =>
                      setEditingBundle({
                        ...editingBundle,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Describe the bundle and its benefits..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Badge Text</Label>
                    <Input
                      value={editingBundle.badge_text || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          badge_text: e.target.value,
                        })
                      }
                      placeholder="e.g., Best Seller, Limited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Badge Color</Label>
                    <Input
                      value={editingBundle.badge_color || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          badge_color: e.target.value,
                        })
                      }
                      placeholder="bg-green-500 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Price (KSH) *</Label>
                    <Input
                      type="number"
                      value={editingBundle.base_price || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          base_price: parseFloat(e.target.value),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discounted Price</Label>
                    <Input
                      type="number"
                      value={editingBundle.discounted_price || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          discounted_price: parseFloat(e.target.value) || null,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bonus Points</Label>
                    <Input
                      type="number"
                      value={editingBundle.bonus_points || 0}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          bonus_points: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points Required</Label>
                    <Input
                      type="number"
                      value={editingBundle.points_required || 0}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          points_required: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Products Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Products
                </h3>

                {editingBundle.bundle_type !== "mystery" && (
                  <ProductSearch
                    onProductSelect={(product) => {
                      setSelectedProducts((prev) => [...prev, product]);
                    }}
                    selectedProductIds={selectedProducts.map((p) => p.id)}
                    bundleType={editingBundle.bundle_type}
                  />
                )}

                {selectedProducts.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 text-sm font-medium">
                      Selected Products ({selectedProducts.length})
                    </div>
                    <div className="divide-y max-h-60 overflow-y-auto">
                      {selectedProducts.map((product, idx) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-3"
                        >
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {product.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(product.price)} • Stock:{" "}
                              {product.stock}
                            </p>
                          </div>
                          {editingBundle.bundle_type !== "tiered" && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value);
                                  setSelectedProducts((prev) =>
                                    prev.map((p) =>
                                      p.id === product.id
                                        ? { ...p, quantity: newQuantity }
                                        : p,
                                    ),
                                  );
                                }}
                                className="w-20"
                              />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedProducts((prev) =>
                                prev.filter((p) => p.id !== product.id),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProducts.length === 0 &&
                  editingBundle.bundle_type !== "mystery" && (
                    <div className="text-center p-8 border rounded-lg bg-muted/20">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Search and select products to add to this bundle
                      </p>
                    </div>
                  )}

                {/* Mystery bundle product pool selection */}
                {editingBundle.bundle_type === "mystery" && (
                  <div className="space-y-4">
                    <ProductSearch
                      onProductSelect={(product) => {
                        const currentPool =
                          editingBundle.eligible_product_ids || [];
                        setEditingBundle({
                          ...editingBundle,
                          eligible_product_ids: [...currentPool, product.id],
                        });
                      }}
                      selectedProductIds={
                        editingBundle.eligible_product_ids || []
                      }
                      bundleType="mystery"
                    />

                    {(editingBundle.eligible_product_ids || []).length > 0 && (
                      <div className="border rounded-lg p-3">
                        <p className="text-sm font-medium mb-2">
                          Product Pool (
                          {editingBundle.eligible_product_ids?.length} products)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {editingBundle.eligible_product_ids?.map(
                            (productId: string) => {
                              const product = products.find(
                                (p) => p.id === productId,
                              );
                              return product ? (
                                <Badge
                                  key={productId}
                                  variant="secondary"
                                  className="gap-1"
                                >
                                  {product.name}
                                  <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={() =>
                                      setEditingBundle({
                                        ...editingBundle,
                                        eligible_product_ids:
                                          editingBundle.eligible_product_ids?.filter(
                                            (id: string) => id !== productId,
                                          ),
                                      })
                                    }
                                  />
                                </Badge>
                              ) : null;
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type-Specific Configurations */}
              {editingBundle.bundle_type === "tiered" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Tiered Discounts
                  </h3>
                  <div className="space-y-3">
                    {(editingBundle.tier_config || []).map(
                      (tier: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <Label className="text-xs">Min Items</Label>
                            <Input
                              type="number"
                              value={tier.min_items}
                              onChange={(e) => {
                                const newTiers = [
                                  ...(editingBundle.tier_config || []),
                                ];
                                newTiers[idx].min_items = parseInt(
                                  e.target.value,
                                );
                                setEditingBundle({
                                  ...editingBundle,
                                  tier_config: newTiers,
                                });
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Discount (%)</Label>
                            <Input
                              type="number"
                              value={tier.discount}
                              onChange={(e) => {
                                const newTiers = [
                                  ...(editingBundle.tier_config || []),
                                ];
                                newTiers[idx].discount = parseInt(
                                  e.target.value,
                                );
                                setEditingBundle({
                                  ...editingBundle,
                                  tier_config: newTiers,
                                });
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newTiers = [
                                ...(editingBundle.tier_config || []),
                              ];
                              newTiers.splice(idx, 1);
                              setEditingBundle({
                                ...editingBundle,
                                tier_config: newTiers,
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tiers = editingBundle.tier_config || [];
                        setEditingBundle({
                          ...editingBundle,
                          tier_config: [
                            ...tiers,
                            { min_items: tiers.length + 2, discount: 5 },
                          ],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Tier
                    </Button>
                  </div>
                </div>
              )}

              {editingBundle.bundle_type === "build_own" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Build Your Own Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Items to Select</Label>
                      <Input
                        type="number"
                        value={editingBundle.min_items_to_select || 1}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            min_items_to_select: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Items to Select</Label>
                      <Input
                        type="number"
                        value={editingBundle.max_items_to_select || 5}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            max_items_to_select: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Eligible Categories (comma-separated)</Label>
                    <Input
                      value={
                        editingBundle.eligible_categories?.join(", ") || ""
                      }
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          eligible_categories: e.target.value
                            .split(",")
                            .map((c) => c.trim()),
                        })
                      }
                      placeholder="electronics, clothing, accessories"
                    />
                  </div>
                </div>
              )}

              {editingBundle.bundle_type === "subscription" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Subscription Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Interval</Label>
                      <Select
                        value={editingBundle.subscription_interval || "monthly"}
                        onValueChange={(value) =>
                          setEditingBundle({
                            ...editingBundle,
                            subscription_interval: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Commitment (months)</Label>
                      <Input
                        type="number"
                        value={editingBundle.subscription_duration_months || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            subscription_duration_months:
                              parseInt(e.target.value) || null,
                          })
                        }
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory & Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Inventory & Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Available</Label>
                    <Input
                      type="number"
                      value={editingBundle.total_available || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          total_available: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Per Customer</Label>
                    <Input
                      type="number"
                      value={editingBundle.max_per_customer || 1}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          max_per_customer: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={editingBundle.starts_at?.slice(0, 16) || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          starts_at: e.target.value || null,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="datetime-local"
                      value={editingBundle.ends_at?.slice(0, 16) || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          ends_at: e.target.value || null,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Live Stream Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Live Stream Settings
                </h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0">
                    <Label>Live Stream Exclusive</Label>
                    <p className="text-xs text-muted-foreground">
                      Only available during live streams
                    </p>
                  </div>
                  <Switch
                    checked={editingBundle.is_live_exclusive || false}
                    onCheckedChange={(checked) =>
                      setEditingBundle({
                        ...editingBundle,
                        is_live_exclusive: checked,
                      })
                    }
                  />
                </div>
                {editingBundle.is_live_exclusive && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0">
                      <Label>Stream Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Currently live on stream
                      </p>
                    </div>
                    <Switch
                      checked={editingBundle.is_stream_active || false}
                      onCheckedChange={(checked) =>
                        setEditingBundle({
                          ...editingBundle,
                          is_stream_active: checked,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Mystery Bundle Settings */}
              {editingBundle.bundle_type === "mystery" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Mystery Bundle Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Value (KSH)</Label>
                      <Input
                        type="number"
                        value={editingBundle.mystery_products?.min_value || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            mystery_products: {
                              ...editingBundle.mystery_products,
                              min_value: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Value (KSH)</Label>
                      <Input
                        type="number"
                        value={editingBundle.mystery_products?.max_value || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            mystery_products: {
                              ...editingBundle.mystery_products,
                              max_value: parseInt(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reveal Mode</Label>
                    <Select
                      value={editingBundle.mystery_reveal_mode || "manual"}
                      onValueChange={(value) =>
                        setEditingBundle({
                          ...editingBundle,
                          mystery_reveal_mode: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">
                          Manual (Live Stream)
                        </SelectItem>
                        <SelectItem value="after_purchase">
                          After Purchase
                        </SelectItem>
                        <SelectItem value="immediate">Immediate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Display Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Display Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={editingBundle.image_url || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          image_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Image URL</Label>
                    <Input
                      value={editingBundle.cover_image_url || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          cover_image_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0">
                    <Label>Featured Bundle</Label>
                    <p className="text-xs text-muted-foreground">
                      Show on homepage
                    </p>
                  </div>
                  <Switch
                    checked={editingBundle.featured || false}
                    onCheckedChange={(checked) =>
                      setEditingBundle({ ...editingBundle, featured: checked })
                    }
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={editingBundle.terms_conditions || ""}
                  onChange={(e) =>
                    setEditingBundle({
                      ...editingBundle,
                      terms_conditions: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveBundle} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingBundle.id ? "Update" : "Create"} Bundle
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bundles Grid - Card Layout */}
      {bundles.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bundles yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first bundle to get started
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Bundle
              </Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => {
            const typeConfig = BUNDLE_TYPES.find(
              (t) => t.value === bundle.bundle_type,
            );
            const Icon = typeConfig?.icon || Package;
            const isLowStock =
              bundle.remaining_count !== null && bundle.remaining_count <= 10;

            return (
              <Card
                key={bundle.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                {/* Header with gradient */}
                <div
                  className={cn(
                    "h-32 bg-gradient-to-r p-4 text-white relative",
                    typeConfig?.color || "from-purple-500 to-pink-500",
                  )}
                >
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(bundle.status)}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm opacity-90 capitalize">
                      {typeConfig?.label ||
                        bundle.bundle_type.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold line-clamp-1">
                    {bundle.name}
                  </h3>
                  {bundle.badge_text && (
                    <Badge className="absolute bottom-4 right-4 bg-white/20 text-white border-0">
                      {bundle.badge_text}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bundle.description || "No description provided"}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2">
                    {bundle.discounted_price ? (
                      <>
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(bundle.discounted_price)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(bundle.base_price)}
                        </span>
                        <Badge className="bg-green-500 text-white text-xs">
                          Save{" "}
                          {Math.round(
                            ((bundle.base_price - bundle.discounted_price) /
                              bundle.base_price) *
                              100,
                          )}
                          %
                        </Badge>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(bundle.base_price)}
                      </span>
                    )}
                  </div>

                  {/* Bundle Features */}
                  <div className="flex flex-wrap gap-2">
                    {bundle.bonus_points > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3" />+{bundle.bonus_points} pts
                      </Badge>
                    )}
                    {bundle.points_required > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <Coins className="h-3 w-3" />
                        {bundle.points_required} pts
                      </Badge>
                    )}
                    {bundle.is_live_exclusive && (
                      <Badge
                        variant="outline"
                        className="gap-1 bg-red-500/10 text-red-500 border-red-500/30"
                      >
                        <Zap className="h-3 w-3" />
                        Live Exclusive
                      </Badge>
                    )}
                    {bundle.min_items_to_select > 1 && (
                      <Badge variant="outline" className="gap-1">
                        <Package className="h-3 w-3" />
                        Choose {bundle.min_items_to_select}-
                        {bundle.max_items_to_select}
                      </Badge>
                    )}
                  </div>

                  {/* Stock Status */}
                  {bundle.total_available !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Stock:</span>
                      <span
                        className={cn(
                          isLowStock ? "text-orange-500 font-medium" : "",
                        )}
                      >
                        {bundle.remaining_count ?? bundle.total_available} /{" "}
                        {bundle.total_available}
                      </span>
                    </div>
                  )}

                  {/* Schedule */}
                  {bundle.starts_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(bundle.starts_at), "MMM d")}
                        {bundle.ends_at &&
                          ` → ${format(new Date(bundle.ends_at), "MMM d")}`}
                      </span>
                    </div>
                  )}

                  {/* Sales Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                      <span>{bundle.current_purchases || 0} sold</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>Limit {bundle.max_per_customer}</span>
                    </div>
                  </div>

                  {/* Bundle ID */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono truncate">
                      ID: {bundle.id.slice(0, 8)}...
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyBundleId(bundle.id)}
                    >
                      {copiedId === bundle.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        window.open(`/bundles/live/${bundle.id}`, "_blank")
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Live View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const { data } = await supabase
                          .from("bundles")
                          .select("*")
                          .eq("id", bundle.id)
                          .single();
                        setEditingBundle(data);
                        if (data.products?.items) {
                          const productIds = data.products.items.map(
                            (i: any) => i.product_id,
                          );
                          const { data: productsData } = await supabase
                            .from("products")
                            .select("*")
                            .in("id", productIds);
                          if (productsData) {
                            setSelectedProducts(
                              productsData.map((p) => ({
                                ...p,
                                quantity:
                                  data.products.items.find(
                                    (i: any) => i.product_id === p.id,
                                  )?.quantity || 1,
                              })),
                            );
                          }
                        }
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBundle(bundle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
