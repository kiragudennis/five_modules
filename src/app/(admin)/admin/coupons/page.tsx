// app/admin/coupons/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag,
  Users,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Coupon } from "@/types/store";
import { productCategories } from "@/lib/constants";

export default function AdminCouponsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const { supabase } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 0,
    valid_from: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    valid_until: format(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd'T'HH:mm"
    ), // 30 days from now
    usage_limit: 100,
    is_active: true,
    applicable_categories: [] as string[],
    excluded_products: [] as string[],
    single_use_per_customer: false,
    description: "",
  });

  // Fetch coupons
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("coupons")
        .select(
          `
          *,
          coupon_redemptions(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  // Filter coupons
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && coupon.is_active) ||
      (selectedStatus === "inactive" && !coupon.is_active) ||
      (selectedStatus === "expired" &&
        new Date(coupon.valid_until) < new Date());

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Create coupon
  const handleCreateCoupon = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .insert([
          {
            ...formData,
            used_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Coupon created successfully");
      setIsCreateDialogOpen(false);
      fetchCoupons();
      resetForm();
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      toast.error(error.message || "Failed to create coupon");
    }
  };

  // Update coupon
  const handleUpdateCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .update(formData)
        .eq("id", selectedCoupon.id);

      if (error) throw error;

      toast.success("Coupon updated successfully");
      setIsEditDialogOpen(false);
      fetchCoupons();
      resetForm();
    } catch (error: any) {
      console.error("Error updating coupon:", error);
      toast.error(error.message || "Failed to update coupon");
    }
  };

  // Delete coupon
  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", selectedCoupon.id);

      if (error) throw error;

      toast.success("Coupon deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      console.error("Error deleting coupon:", error);
      toast.error(error.message || "Failed to delete coupon");
    }
  };

  // Edit coupon (populate form)
  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount || 0,
      valid_from: format(new Date(coupon.valid_from), "yyyy-MM-dd'T'HH:mm"),
      valid_until: format(new Date(coupon.valid_until), "yyyy-MM-dd'T'HH:mm"),
      usage_limit: coupon.usage_limit || 100,
      is_active: coupon.is_active,
      applicable_categories: coupon.applicable_categories,
      excluded_products: coupon.excluded_products,
      single_use_per_customer: coupon.single_use_per_customer,
      description: coupon.description || "",
    });
    setIsEditDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: 0,
      valid_from: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      valid_until: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd'T'HH:mm"
      ),
      usage_limit: 100,
      is_active: true,
      applicable_categories: [],
      excluded_products: [],
      single_use_per_customer: false,
      description: "",
    });
  };

  // Calculate coupon stats
  const calculateStats = () => {
    const activeCoupons = coupons.filter((c) => c.is_active);
    const expiredCoupons = coupons.filter(
      (c) => new Date(c.valid_until) < new Date()
    );
    const totalRedemptions = coupons.reduce(
      (sum, c) => sum + (c.used_count || 0),
      0
    );

    return {
      total: coupons.length,
      active: activeCoupons.length,
      expired: expiredCoupons.length,
      redemptions: totalRedemptions,
    };
  };

  const stats = calculateStats();

  // Copy coupon code
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code} to clipboard`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm");
  };

  // Check if coupon is expiring soon (within 7 days)
  const isExpiringSoon = (validUntil: string) => {
    const daysUntil = Math.ceil(
      (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil > 0 && daysUntil <= 7;
  };

  return (
    <div className="py-6 px-2">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground mt-1">
            Manage discount coupons and promotional offers
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Coupons</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <Tag className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Coupons</p>
              <h3 className="text-2xl font-bold text-green-600">
                {stats.active}
              </h3>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Redemptions</p>
              <h3 className="text-2xl font-bold">{stats.redemptions}</h3>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired Coupons</p>
              <h3 className="text-2xl font-bold text-red-600">
                {stats.expired}
              </h3>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search coupons by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Filter coupon list</SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Status</h3>
                  <div className="space-y-2">
                    {[
                      { id: "all", name: "All Coupons" },
                      { id: "active", name: "Active" },
                      { id: "inactive", name: "Inactive" },
                      { id: "expired", name: "Expired" },
                    ].map((status) => (
                      <div key={status.id} className="flex items-center">
                        <input
                          type="radio"
                          id={`status-${status.id}`}
                          name="status"
                          checked={selectedStatus === status.id}
                          onChange={() => setSelectedStatus(status.id)}
                          className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`status-${status.id}`}
                          className="ml-2 text-sm"
                        >
                          {status.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      setSelectedStatus("all");
                      setIsFilterOpen(false);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {(selectedStatus !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedStatus("all");
                setSearchQuery("");
              }}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedCoupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No coupons found</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSelectedStatus("all");
                        setSearchQuery("");
                      }}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCoupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {coupon.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : `KES ${coupon.discount_value}`}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Min: KES {coupon.min_order_amount}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {formatDate(coupon.valid_from)}
                        </p>
                        <p className="text-sm">
                          {formatDate(coupon.valid_until)}
                        </p>
                        {isExpiringSoon(coupon.valid_until) && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Expiring soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {coupon.used_count || 0} / {coupon.usage_limit || "∞"}
                        </p>
                        {coupon.single_use_per_customer && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Single use
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            coupon.is_active ? "bg-green-500" : "bg-red-500"
                          )}
                        />
                        <span>{coupon.is_active ? "Active" : "Inactive"}</span>
                        {new Date(coupon.valid_until) < new Date() && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(coupon.created_at)}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </div>

        {/* Pagination */}
        {filteredCoupons.length > 0 && (
          <div className="px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredCoupons.length)}{" "}
                of {filteredCoupons.length} coupons
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8"
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Coupon Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a discount coupon for your customers
            </DialogDescription>
          </DialogHeader>

          <CouponForm
            formData={formData}
            setFormData={setFormData}
            productCategories={productCategories}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon}>Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update coupon details</DialogDescription>
          </DialogHeader>

          <CouponForm
            formData={formData}
            setFormData={setFormData}
            productCategories={productCategories}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateCoupon}>Update Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete coupon "{selectedCoupon?.code}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoupon}>
              Delete Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reusable Coupon Form Component
function CouponForm({
  formData,
  setFormData,
  productCategories,
}: {
  formData: any;
  setFormData: (data: any) => void;
  productCategories: string[];
}) {
  return (
    <div className="space-y-6 py-4">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g., WELCOME15"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., First order discount"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount_type">Discount Type *</Label>
            <Select
              value={formData.discount_type}
              onValueChange={(value: "percentage" | "fixed") =>
                setFormData({ ...formData, discount_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount (KES)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_value">
              Discount Value *{" "}
              {formData.discount_type === "percentage" ? "(%)" : "(KES)"}
            </Label>
            <Input
              id="discount_value"
              type="number"
              min="0"
              step={formData.discount_type === "percentage" ? "1" : "0.01"}
              value={formData.discount_value}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discount_value: parseFloat(e.target.value),
                })
              }
              required
            />
          </div>
        </div>
      </div>

      {/* Validity & Limits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Validity & Limits</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valid_from">Valid From *</Label>
            <Input
              id="valid_from"
              type="datetime-local"
              value={formData.valid_from}
              onChange={(e) =>
                setFormData({ ...formData, valid_from: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid_until">Valid Until *</Label>
            <Input
              id="valid_until"
              type="datetime-local"
              value={formData.valid_until}
              onChange={(e) =>
                setFormData({ ...formData, valid_until: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usage_limit">Usage Limit</Label>
            <Input
              id="usage_limit"
              type="number"
              min="0"
              value={formData.usage_limit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  usage_limit: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_order_amount">Minimum Order (KES)</Label>
            <Input
              id="min_order_amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.min_order_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_order_amount: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_discount_amount">Maximum Discount (KES)</Label>
            <Input
              id="max_discount_amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.max_discount_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_discount_amount: e.target.value
                    ? parseFloat(e.target.value)
                    : null,
                })
              }
              placeholder="Leave empty for no limit"
            />
          </div>
        </div>
      </div>

      {/* Restrictions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Restrictions</h3>

        <div className="space-y-2">
          <Label>Applicable Categories</Label>
          <div className="flex flex-wrap gap-2">
            {productCategories.map((category) => (
              <Badge
                key={category}
                variant={
                  formData.applicable_categories.includes(category)
                    ? "default"
                    : "outline"
                }
                className="cursor-pointer"
                onClick={() => {
                  const updated = formData.applicable_categories.includes(
                    category
                  )
                    ? formData.applicable_categories.filter(
                        (c: string) => c !== category
                      )
                    : [...formData.applicable_categories, category];
                  setFormData({ ...formData, applicable_categories: updated });
                }}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excluded_products">
            Excluded Product SKUs (comma-separated)
          </Label>
          <Input
            id="excluded_products"
            value={formData.excluded_products.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                excluded_products: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="SKU1, SKU2, SKU3"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Single Use Per Customer</Label>
            <p className="text-sm text-muted-foreground">
              Limit to one use per customer email/phone
            </p>
          </div>
          <Switch
            checked={formData.single_use_per_customer}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, single_use_per_customer: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Active Status</Label>
            <p className="text-sm text-muted-foreground">
              Coupon will be available for use
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked })
            }
          />
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <code className="text-lg font-mono font-bold">
              {formData.code || "COUPONCODE"}
            </code>
            <span className="font-bold">
              {formData.discount_type === "percentage"
                ? `${formData.discount_value}% OFF`
                : `KES ${formData.discount_value} OFF`}
            </span>
          </div>
          {formData.description && (
            <p className="text-sm text-muted-foreground">
              {formData.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            <p>Min order: KES {formData.min_order_amount}</p>
            <p>
              Valid: {format(new Date(formData.valid_from), "MMM dd, yyyy")} -{" "}
              {format(new Date(formData.valid_until), "MMM dd, yyyy")}
            </p>
            {formData.usage_limit && <p>Limit: {formData.usage_limit} uses</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
