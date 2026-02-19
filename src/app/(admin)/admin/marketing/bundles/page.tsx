// app/admin/marketing/bundles/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BundleProduct {
  product_id: string;
  quantity: number;
  required: boolean;
}

interface MistryBundle {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url: string | null;
  banner_url: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  bundle_price: number | null;
  products: BundleProduct[];
  min_tier_required: string | null;
  points_required: number;
  status: "draft" | "active" | "inactive" | "expired";
  start_date: string | null;
  end_date: string | null;
  max_purchases_per_user: number | null;
  total_purchases_allowed: number | null;
  current_purchases: number;
  featured: boolean;
  badge_text: string | null;
  badge_color: string | null;
  terms_conditions: string | null;
  created_by: string;
  created_at: string;
}

export default function AdminBundlesPage() {
  const { supabase, profile } = useAuth();
  const [bundles, setBundles] = useState<MistryBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBundle, setEditingBundle] = useState<Partial<MistryBundle>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    fetchBundles();
    fetchProducts();
    fetchTiers();
  }, [profile]);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("mistry_bundles")
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
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, category")
        .eq("status", "active");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from("loyalty_tiers")
        .select("tier, min_points, discount_percentage")
        .order("min_points");

      if (error) throw error;
      setTiers(data || []);
    } catch (error: any) {
      console.error("Error fetching tiers:", error);
    }
  };

  const handleSaveBundle = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (
        !editingBundle.name ||
        !editingBundle.slug ||
        !editingBundle.discount_type ||
        !editingBundle.discount_value
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!editingBundle.products || editingBundle.products.length === 0) {
        toast.error("Please select at least one product");
        return;
      }

      const bundleData = {
        ...editingBundle,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingBundle.id) {
        // Update existing bundle
        ({ error } = await supabase
          .from("mistry_bundles")
          .update(bundleData)
          .eq("id", editingBundle.id));
      } else {
        // Create new bundle
        bundleData.created_by = profile?.id;
        bundleData.current_purchases = 0;
        ({ error } = await supabase
          .from("mistry_bundles")
          .insert([bundleData]));
      }

      if (error) throw error;

      toast.success(
        `Bundle ${editingBundle.id ? "updated" : "created"} successfully`,
      );
      setDialogOpen(false);
      setEditingBundle({});
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
      const { error } = await supabase
        .from("mistry_bundles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Bundle deleted successfully");
      fetchBundles();
    } catch (error: any) {
      console.error("Error deleting bundle:", error);
      toast.error("Could not delete bundle");
    }
  };

  const toggleProductInBundle = (productId: string, checked: boolean) => {
    const currentProducts = editingBundle.products || [];

    if (checked) {
      // Add product
      setEditingBundle({
        ...editingBundle,
        products: [
          ...currentProducts,
          { product_id: productId, quantity: 1, required: true },
        ],
      });
    } else {
      // Remove product
      setEditingBundle({
        ...editingBundle,
        products: currentProducts.filter((p) => p.product_id !== productId),
      });
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    const currentProducts = editingBundle.products || [];
    setEditingBundle({
      ...editingBundle,
      products: currentProducts.map((p) =>
        p.product_id === productId ? { ...p, quantity } : p,
      ),
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mistry Bundles</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage product bundles with special discounts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBundle({ products: [] })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBundle.id ? "Edit Bundle" : "Create New Bundle"}
              </DialogTitle>
            </DialogHeader>

            {editingBundle && (
              <div className="space-y-6 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Bundle Name *</Label>
                      <Input
                        id="name"
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
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={editingBundle.slug || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            slug: e.target.value,
                          })
                        }
                        placeholder="solar-starter-kit"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingBundle.description || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what's included in this bundle"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="badge_text">Badge Text</Label>
                      <Input
                        id="badge_text"
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
                      <Label htmlFor="badge_color">Badge Color</Label>
                      <Input
                        id="badge_color"
                        value={editingBundle.badge_color || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            badge_color: e.target.value,
                          })
                        }
                        placeholder="bg-green-500, text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Discount Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Discount Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type *</Label>
                      <Select
                        value={editingBundle.discount_type}
                        onValueChange={(value: "percentage" | "fixed") =>
                          setEditingBundle({
                            ...editingBundle,
                            discount_type: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">
                            Percentage (%)
                          </SelectItem>
                          <SelectItem value="fixed">
                            Fixed Amount (KES)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Value *</Label>
                      <Input
                        type="number"
                        value={editingBundle.discount_value || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            discount_value: parseFloat(e.target.value),
                          })
                        }
                        placeholder={
                          editingBundle.discount_type === "percentage"
                            ? "20"
                            : "5000"
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bundle_price">
                      Custom Bundle Price (Optional)
                    </Label>
                    <Input
                      id="bundle_price"
                      type="number"
                      value={editingBundle.bundle_price || ""}
                      onChange={(e) =>
                        setEditingBundle({
                          ...editingBundle,
                          bundle_price: parseFloat(e.target.value) || null,
                        })
                      }
                      placeholder="Leave empty to auto-calculate"
                    />
                    <p className="text-xs text-muted-foreground">
                      If set, this price overrides the calculated price from
                      products
                    </p>
                  </div>
                </div>

                {/* Products Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Products in Bundle *
                  </h3>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {products.map((product) => {
                      const bundleProduct = editingBundle.products?.find(
                        (p) => p.product_id === product.id,
                      );

                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-muted/50"
                        >
                          <Switch
                            checked={!!bundleProduct}
                            onCheckedChange={(checked) =>
                              toggleProductInBundle(product.id, checked)
                            }
                          />
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-12 w-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              KES {product.price.toLocaleString()}
                            </p>
                          </div>
                          {bundleProduct && (
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`qty-${product.id}`}
                                className="text-sm"
                              >
                                Qty:
                              </Label>
                              <Input
                                id={`qty-${product.id}`}
                                type="number"
                                min="1"
                                value={bundleProduct.quantity}
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
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Access Restrictions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Access Restrictions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Tier Required</Label>
                      <Select
                        value={editingBundle.min_tier_required || ""}
                        onValueChange={(value) =>
                          setEditingBundle({
                            ...editingBundle,
                            min_tier_required: value || null,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No tier restriction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No restriction</SelectItem>
                          {tiers.map((tier) => (
                            <SelectItem key={tier.tier} value={tier.tier}>
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                {tier.tier.charAt(0).toUpperCase() +
                                  tier.tier.slice(1)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Points Required</Label>
                      <div className="relative">
                        <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={editingBundle.points_required || 0}
                          onChange={(e) =>
                            setEditingBundle({
                              ...editingBundle,
                              points_required: parseInt(e.target.value),
                            })
                          }
                          className="pl-9"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Limits */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Purchase Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Purchases Per User</Label>
                      <Input
                        type="number"
                        value={editingBundle.max_purchases_per_user || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            max_purchases_per_user:
                              parseInt(e.target.value) || null,
                          })
                        }
                        placeholder="Unlimited"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Purchases Allowed</Label>
                      <Input
                        type="number"
                        value={editingBundle.total_purchases_allowed || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            total_purchases_allowed:
                              parseInt(e.target.value) || null,
                          })
                        }
                        placeholder="Unlimited"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={editingBundle.start_date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            start_date: e.target.value || null,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={editingBundle.end_date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditingBundle({
                            ...editingBundle,
                            end_date: e.target.value || null,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Status and Featured */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editingBundle.status || "draft"}
                        onValueChange={(
                          value: "draft" | "active" | "inactive" | "expired",
                        ) =>
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
                    <div className="flex items-center space-x-2 pt-8">
                      <Switch
                        id="featured"
                        checked={editingBundle.featured || false}
                        onCheckedChange={(checked) =>
                          setEditingBundle({
                            ...editingBundle,
                            featured: checked,
                          })
                        }
                      />
                      <Label htmlFor="featured">Featured Bundle</Label>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveBundle} disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : bundles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No bundles found. Create your first bundle to get started.
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
                                bundle.badge_color?.split(" ")[0] || "#000",
                            }}
                          >
                            {bundle.badge_text}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{bundle.products?.length || 0} items</TableCell>
                    <TableCell>
                      {bundle.discount_type === "percentage"
                        ? `${bundle.discount_value}%`
                        : `KES ${bundle.discount_value?.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {bundle.min_tier_required && (
                          <Badge variant="outline" className="block w-fit">
                            <Crown className="h-3 w-3 inline mr-1" />
                            {bundle.min_tier_required}
                          </Badge>
                        )}
                        {bundle.points_required > 0 && (
                          <Badge variant="outline" className="block w-fit">
                            <Coins className="h-3 w-3 inline mr-1" />
                            {bundle.points_required} pts
                          </Badge>
                        )}
                      </div>
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
                    <TableCell>
                      {bundle.current_purchases || 0}
                      {bundle.total_purchases_allowed && (
                        <span className="text-muted-foreground text-sm">
                          {" "}
                          / {bundle.total_purchases_allowed}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {bundle.start_date ? (
                        <div className="text-sm">
                          {format(new Date(bundle.start_date), "MMM d, yyyy")}
                          {bundle.end_date && (
                            <>
                              {" "}
                              →{" "}
                              {format(new Date(bundle.end_date), "MMM d, yyyy")}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Always
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBundle(bundle);
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
