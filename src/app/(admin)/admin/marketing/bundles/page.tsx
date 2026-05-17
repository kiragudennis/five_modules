// app/admin/bundles/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { BundleService } from "@/lib/services/bundle-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ExternalLink,
  TrendingUp,
  RefreshCw,
  Star,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { Bundle, BundleFormData } from "@/types/bundles";
import { ProductSearch } from "@/components/admin/product-search";
import { formatPrice } from "@/lib/utils";

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
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Partial<BundleFormData>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [livePreview, setLivePreview] = useState<string | null>(null);

  const bundleService = new BundleService(supabase);

  // Fetch bundles
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

  // Fetch products for selection
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

      // Validate required fields
      if (!editingBundle.name || !editingBundle.bundle_type) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Build products JSON based on bundle type
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
        productsJson = {
          type: "build_own",
          categories: editingBundle.eligible_categories,
          product_pool: editingBundle.eligible_product_ids,
          min_items: editingBundle.min_items_to_select || 1,
          max_items: editingBundle.max_items_to_select || 5,
        };
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
        productsJson = {
          type: "mystery",
          min_value: editingBundle.mystery_products?.min_value || 0,
          max_value: editingBundle.mystery_products?.max_value || 0,
          product_pool: editingBundle.eligible_product_ids || [],
          quantity: editingBundle.mystery_products?.quantity || 3,
        };
      }

      const bundleData = {
        ...editingBundle,
        slug: editingBundle.slug || generateSlug(editingBundle.name),
        products: productsJson,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingBundle.id) {
        // Update existing bundle
        const { error: updateError } = await supabase
          .from("bundles")
          .update(bundleData)
          .eq("id", editingBundle.id);
        error = updateError;
      } else {
        // Create new bundle
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
    if (!confirm("Are you sure you want to delete this bundle?")) return;

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

  const toggleProductSelection = (product: any) => {
    const exists = selectedProducts.find((p) => p.id === product.id);
    if (exists) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, quantity } : p)),
    );
  };

  const addTier = () => {
    const tiers = editingBundle.tier_config || [];
    setEditingBundle({
      ...editingBundle,
      tier_config: [...tiers, { min_items: tiers.length + 2, discount: 5 }],
    });
  };

  const removeTier = (index: number) => {
    const tiers = [...(editingBundle.tier_config || [])];
    tiers.splice(index, 1);
    setEditingBundle({ ...editingBundle, tier_config: tiers });
  };

  const openLivePreview = (bundleId: string) => {
    setLivePreview(bundleId);
    window.open(`/bundles/live/${bundleId}`, "_blank");
  };

  const getBundleTypeIcon = (type: string) => {
    const found = BUNDLE_TYPES.find((t) => t.value === type);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Package className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
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

              {/* Products Selection - Enhanced with Search */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Products
                </h3>

                {/* Product Search Component */}
                {editingBundle.bundle_type !== "mystery" && (
                  <ProductSearch
                    onProductSelect={(product) => {
                      setSelectedProducts((prev) => [...prev, product]);
                    }}
                    selectedProductIds={selectedProducts.map((p) => p.id)}
                    bundleType={editingBundle.bundle_type}
                  />
                )}

                {/* Selected Products List */}
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
                                onChange={(e) =>
                                  updateProductQuantity(
                                    product.id,
                                    parseInt(e.target.value),
                                  )
                                }
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
                            (productId) => {
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
                                            (id) => id !== productId,
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
                    {(editingBundle.tier_config || []).map((tier, idx) => (
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
                              newTiers[idx].discount = parseInt(e.target.value);
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
                          onClick={() => removeTier(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addTier}>
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

      {/* Bundles Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : bundles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No bundles created yet. Click "Create Bundle" to get
                    started.
                  </TableCell>
                </TableRow>
              ) : (
                bundles.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {bundle.name}
                        {bundle.featured && (
                          <Badge variant="default" className="bg-yellow-500">
                            Featured
                          </Badge>
                        )}
                        {bundle.badge_text && (
                          <Badge
                            style={{
                              backgroundColor:
                                bundle.badge_color?.split(" ")[0],
                            }}
                          >
                            {bundle.badge_text}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getBundleTypeIcon(bundle.bundle_type)}
                        <span className="capitalize">
                          {bundle.bundle_type.replace("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      KSH {bundle.base_price.toLocaleString()}
                      {bundle.discounted_price && (
                        <span className="text-xs text-muted-foreground line-through ml-1">
                          {bundle.discounted_price.toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {bundle.remaining_count !== null ? (
                        <span
                          className={
                            bundle.remaining_count <= 10
                              ? "text-orange-500"
                              : ""
                          }
                        >
                          {bundle.remaining_count} / {bundle.total_available}
                        </span>
                      ) : (
                        "Unlimited"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          bundle.status === "active"
                            ? "default"
                            : bundle.status === "draft"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {bundle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{bundle.current_purchases || 0}</TableCell>
                    <TableCell className="text-sm">
                      {bundle.starts_at ? (
                        <div>
                          {format(new Date(bundle.starts_at), "MMM d")}
                          {bundle.ends_at &&
                            ` → ${format(new Date(bundle.ends_at), "MMM d")}`}
                        </div>
                      ) : (
                        "Always"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLivePreview(bundle.id)}
                          title="Live Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const { data } = await supabase
                              .from("bundles")
                              .select("*")
                              .eq("id", bundle.id)
                              .single();
                            setEditingBundle(data);
                            if (data.products?.items) {
                              // Load selected products
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
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBundle(bundle.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Live Preview Modal */}
      {livePreview && (
        <Dialog open={!!livePreview} onOpenChange={() => setLivePreview(null)}>
          <DialogContent className="max-w-6xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Live Bundle Preview</DialogTitle>
              <DialogDescription>
                This is how the bundle appears on the live stream display
              </DialogDescription>
            </DialogHeader>
            <iframe
              src={`/bundles/live/${livePreview}`}
              className="w-full h-full rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
