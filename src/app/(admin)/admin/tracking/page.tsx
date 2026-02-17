// app/admin/tracking/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Truck,
  Package,
  CheckCircle,
  Clock,
  Mail,
  Download,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Tag,
  Filter,
  RefreshCw,
  DollarSign,
  Percent,
  Wrench,
  Calendar,
  MapPin,
  Phone,
  ShoppingBag,
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatCurrency } from "@/lib/utils";
import { TrackingOrder } from "@/types/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminTrackingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [isTrackingBulkOpen, setIsTrackingBulkOpen] = useState(false);
  const [isEmailBulkOpen, setIsEmailBulkOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const { supabase } = useAuth();
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Bulk update state
  const [bulkTracking, setBulkTracking] = useState("");
  const [bulkStatus, setBulkStatus] = useState("shipped");
  const [bulkShippingMethod, setBulkShippingMethod] = useState("standard");
  const [bulkEstimatedDelivery, setBulkEstimatedDelivery] = useState(
    format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 3 days from now
  );

  // Bulk email state
  const [emailSubject, setEmailSubject] = useState(
    "Your Order Has Shipped! 🚚",
  );
  const [emailTemplate, setEmailTemplate] = useState(
    `
Hi {customer_name},

Great news! Your order {order_number} has been shipped.

Tracking Number: {tracking_number}
Shipping Method: {shipping_method}
Estimated Delivery: {estimated_delivery}

You can track your shipment here: {tracking_url}

Thank you for shopping with Blessed Two Electronics!

Best regards,
The Blessed Two Team
  `.trim(),
  );

  // Fetch orders
  const fetchTrackingOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/orders/tracking");

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.message || "Failed to fetch orders");
      }

      setOrders(body || []);
      toast.success("Orders refreshed");
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingOrders();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.tracking_number &&
        order.tracking_number
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (order.shipping_address.city &&
        order.shipping_address.city
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && order.status === "pending") ||
      (statusFilter === "processing" && order.status === "processing") ||
      (statusFilter === "shipped" && order.status === "shipped") ||
      (statusFilter === "delivered" && order.status === "delivered") ||
      (statusFilter === "completed" && order.status === "completed") ||
      (statusFilter === "cancelled" && order.status === "cancelled");

    const matchesPayment =
      paymentFilter === "all" || order.payment_status === paymentFilter;

    const matchesShipping =
      shippingFilter === "all" || order.shipping_method === shippingFilter;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "needs-shipping" &&
        order.status === "processing" &&
        !order.tracking_number) ||
      (activeTab === "shipped" && order.status === "shipped") ||
      (activeTab === "delivered" && order.status === "delivered") ||
      (activeTab === "with-installation" && order.installation_required);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesShipping &&
      matchesTab
    );
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map((order) => order.id));
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  // Bulk update tracking numbers
  const handleBulkTrackingUpdate = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to update");
      return;
    }

    if (!bulkTracking) {
      toast.error("Please enter a tracking number");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("bulk_update_tracking", {
        order_ids: selectedOrders,
        tracking_number: bulkTracking,
        status: bulkStatus,
        shipping_method: bulkShippingMethod,
        estimated_delivery: bulkEstimatedDelivery,
      });

      if (error) throw error;

      toast.success(`Updated ${selectedOrders.length} orders`);
      setIsTrackingBulkOpen(false);
      setSelectedOrders([]);
      setBulkTracking("");
      fetchTrackingOrders();
    } catch (error: any) {
      console.error("Error bulk updating:", error);
      toast.error(error.message || "Failed to update orders");
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to update");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("bulk_update_order_status", {
        order_ids: selectedOrders,
        new_status: bulkStatus,
      });

      if (error) throw error;

      toast.success(`Updated ${selectedOrders.length} orders to ${bulkStatus}`);
      setIsBulkUpdateOpen(false);
      setSelectedOrders([]);
      fetchTrackingOrders();
    } catch (error: any) {
      console.error("Error bulk updating:", error);
      toast.error(error.message || "Failed to update orders");
    }
  };

  // Send bulk email notifications
  const handleBulkEmail = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders to notify");
      return;
    }

    try {
      const response = await fetch("/api/notifications/bulk-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrders,
          subject: emailSubject,
          template: emailTemplate,
        }),
      });

      if (!response.ok) throw new Error("Failed to send emails");

      const data = await response.json();

      // Update notification sent status
      await supabase.rpc("update_notification_sent", {
        order_ids: selectedOrders,
        notification_type: "shipping_update",
      });

      toast.success(`Sent ${data.sent} email notifications`);
      setIsEmailBulkOpen(false);
      setSelectedOrders([]);
    } catch (error: any) {
      console.error("Error sending emails:", error);
      toast.error(error.message || "Failed to send emails");
    }
  };

  // Generate tracking numbers
  const generateTrackingNumber = () => {
    const prefix = "BTE";
    const date = format(new Date(), "yyMMdd");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${prefix}${date}${random}`;
  };

  // Copy tracking numbers
  const copyTrackingNumbers = () => {
    const trackingNumbers = selectedOrders
      .map((id) => {
        const order = orders.find((o) => o.id === id);
        return order?.tracking_number;
      })
      .filter(Boolean)
      .join("\n");

    if (trackingNumbers) {
      navigator.clipboard.writeText(trackingNumbers);
      toast.success("Copied tracking numbers to clipboard");
    } else {
      toast.error("No tracking numbers to copy");
    }
  };

  // Download CSV
  const downloadTrackingCSV = () => {
    const selected = orders.filter((o) => selectedOrders.includes(o.id));
    const headers = [
      "Order Number",
      "Customer Name",
      "Email",
      "Phone",
      "Total",
      "Currency",
      "Status",
      "Payment Status",
      "Payment Method",
      "Tracking Number",
      "Shipping Method",
      "Shipping Cost",
      "Estimated Delivery",
      "City",
      "County",
      "Country",
      "Items Count",
      "Items Quantity",
      "Wholesale Applied",
      "Installation Required",
      "Coupon Applied",
      "Order Date",
    ];

    const csvContent = [
      headers.join(","),
      ...selected.map((order) =>
        [
          order.order_number,
          `"${order.customer.name}"`,
          order.customer.email,
          order.customer.phone,
          order.total,
          order.currency,
          order.status,
          order.payment_status,
          order.payment_method,
          order.tracking_number || "",
          order.shipping_method,
          order.shipping_cost,
          order.estimated_delivery || "",
          order.shipping_address.city,
          order.shipping_address.county,
          order.shipping_address.country,
          order.items_count,
          order.items_quantity,
          order.wholesale_applied ? "Yes" : "No",
          order.installation_required ? "Yes" : "No",
          order.coupon_applied ? "Yes" : "No",
          format(new Date(order.created_at), "yyyy-MM-dd HH:mm:ss"),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tracking-orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Status badge
  const getStatusBadge = (order: TrackingOrder) => {
    const badges = {
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      processing: {
        className: "bg-blue-100 text-blue-800",
        label: "Processing",
      },
      shipped: {
        className: "bg-purple-100 text-purple-800",
        label: order.tracking_number ? "Shipped" : "Needs Tracking",
      },
      delivered: {
        className: "bg-green-100 text-green-800",
        label: "Delivered",
      },
      completed: {
        className: "bg-green-100 text-green-800",
        label: "Completed",
      },
      cancelled: { className: "bg-red-100 text-red-800", label: "Cancelled" },
    };

    const badge = badges[order.status as keyof typeof badges] || badges.pending;
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  // Payment status badge
  const getPaymentBadge = (status: string) => {
    const badges = {
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      processing: {
        className: "bg-blue-100 text-blue-800",
        label: "Processing",
      },
      completed: { className: "bg-green-100 text-green-800", label: "Paid" },
      failed: { className: "bg-red-100 text-red-800", label: "Failed" },
      refunded: { className: "bg-gray-100 text-gray-800", label: "Refunded" },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge>
    );
  };

  // Calculate statistics
  const stats = {
    total: orders.length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    needsTracking: orders.filter(
      (o) => o.status === "processing" && !o.tracking_number,
    ).length,
    completed: orders.filter((o) => o.status === "completed").length,
    withInstallation: orders.filter((o) => o.installation_required).length,
    wholesaleOrders: orders.filter((o) => o.wholesale_applied).length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
  };

  return (
    <div className="py-6 px-2">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
            Shipping & Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage order shipments, tracking numbers, and customer notifications
          </p>
        </div>
        <Button onClick={fetchTrackingOrders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Orders
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        {/* Container with horizontal scroll */}
        <div className="relative mb-6">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex min-w-max bg-amber-50 dark:bg-amber-950/20 px-1">
              <TabsTrigger value="all" className="whitespace-nowrap">
                All Orders
              </TabsTrigger>
              <TabsTrigger value="needs-shipping" className="whitespace-nowrap">
                Needs Shipping
              </TabsTrigger>
              <TabsTrigger value="shipped" className="whitespace-nowrap">
                Shipped
              </TabsTrigger>
              <TabsTrigger value="delivered" className="whitespace-nowrap">
                Delivered
              </TabsTrigger>
              <TabsTrigger
                value="with-installation"
                className="whitespace-nowrap"
              >
                With Installation
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Gradient fade on mobile for scroll indication */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-gray-900 pointer-events-none sm:hidden" />
        </div>
      </Tabs>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>
              <h3 className="text-2xl font-bold">{stats.processing}</h3>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Transit</p>
              <h3 className="text-2xl font-bold text-purple-600">
                {stats.shipped}
              </h3>
            </div>
            <Truck className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Needs Tracking</p>
              <h3 className="text-2xl font-bold text-orange-600">
                {stats.needsTracking}
              </h3>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">With Installation</p>
              <h3 className="text-2xl font-bold text-green-600">
                {stats.withInstallation}
              </h3>
            </div>
            <Wrench className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                {selectedOrders.length} order
                {selectedOrders.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyTrackingNumbers}
                  disabled={
                    !selectedOrders.some(
                      (id) => orders.find((o) => o.id === id)?.tracking_number,
                    )
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Tracking
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTrackingCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTrackingBulkOpen(true)}
              >
                <Truck className="h-4 w-4 mr-2" />
                Add Tracking
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkUpdateOpen(true)}
              >
                <Tag className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <Button size="sm" onClick={() => setIsEmailBulkOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Notify Customers
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by order number, customer name, email, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <SelectValue placeholder="Payment" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Payment Pending</SelectItem>
              <SelectItem value="processing">Payment Processing</SelectItem>
              <SelectItem value="completed">Payment Completed</SelectItem>
              <SelectItem value="failed">Payment Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={shippingFilter} onValueChange={setShippingFilter}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <SelectValue placeholder="Shipping" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="express">Express</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
            </SelectContent>
          </Select>

          {(statusFilter !== "all" ||
            paymentFilter !== "all" ||
            shippingFilter !== "all" ||
            searchQuery) && (
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter("all");
                setPaymentFilter("all");
                setShippingFilter("all");
                setSearchQuery("");
              }}
              className="text-muted-foreground"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedOrders.length === paginatedOrders.length &&
                      paginatedOrders.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Order Details</TableHead>
                <TableHead>Customer & Shipping</TableHead>
                <TableHead>Payment & Status</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No orders found</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setStatusFilter("all");
                        setPaymentFilter("all");
                        setShippingFilter("all");
                        setSearchQuery("");
                        setActiveTab("all");
                      }}
                      className="mt-2"
                    >
                      Clear all filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order.order_number}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              navigator.clipboard.writeText(order.order_number)
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(order.created_at),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-3 w-3" />
                          <span className="text-xs">
                            {order.items_count} items
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs">
                            {order.items_quantity} units
                          </span>
                        </div>
                        <div className="font-bold">
                          {formatCurrency(order.total, order.currency)}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.wholesale_applied && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700"
                            >
                              <Percent className="h-2 w-2 mr-1" /> Wholesale
                            </Badge>
                          )}
                          {order.installation_required && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700"
                            >
                              <Wrench className="h-2 w-2 mr-1" /> Installation
                            </Badge>
                          )}
                          {order.coupon_applied && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-purple-50 text-purple-700"
                            >
                              <Tag className="h-2 w-2 mr-1" /> Coupon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>
                          <p className="font-medium">{order.customer.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{order.customer.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{order.customer.phone}</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            <span className="font-medium">
                              {order.shipping_address.city}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {order.shipping_address.county},{" "}
                            {order.shipping_address.country}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.shipping_method} •{" "}
                            {formatCurrency(
                              order.shipping_cost,
                              order.currency,
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getStatusBadge(order)}
                        {getPaymentBadge(order.payment_status)}
                        <div className="text-xs">
                          <span className="text-muted-foreground">Method:</span>{" "}
                          <span className="font-medium capitalize">
                            {order.payment_method}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {order.tracking_number ? (
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {order.tracking_number}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  order.tracking_number!,
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">
                            Not assigned
                          </span>
                        )}
                        {order.estimated_delivery && (
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            <span>Est: {order.estimated_delivery}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/admin/orders/${order.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={`mailto:${order.customer.email}?subject=Order ${order.order_number} Update`}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
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
        {filteredOrders.length > 0 && (
          <div className="px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
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
                  ),
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

      {/* Bulk Tracking Dialog */}
      <Dialog open={isTrackingBulkOpen} onOpenChange={setIsTrackingBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tracking Numbers</DialogTitle>
            <DialogDescription>
              Add tracking information to {selectedOrders.length} selected
              orders
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <div className="flex gap-2">
                <Input
                  id="tracking"
                  value={bulkTracking}
                  onChange={(e) => setBulkTracking(e.target.value)}
                  placeholder="Enter tracking number"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkTracking(generateTrackingNumber())}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping-method">Shipping Method</Label>
              <Select
                value={bulkShippingMethod}
                onValueChange={setBulkShippingMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (3-5 days)</SelectItem>
                  <SelectItem value="express">Express (1-2 days)</SelectItem>
                  <SelectItem value="pickup">Store Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-delivery">Estimated Delivery</Label>
              <Input
                id="estimated-delivery"
                type="date"
                value={bulkEstimatedDelivery}
                onChange={(e) => setBulkEstimatedDelivery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Update Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipped">Mark as Shipped</SelectItem>
                  <SelectItem value="delivered">Mark as Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTrackingBulkOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkTrackingUpdate}>
              Update {selectedOrders.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Status Update</DialogTitle>
            <DialogDescription>
              Update status for {selectedOrders.length} selected orders
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processing">Mark as Processing</SelectItem>
                  <SelectItem value="shipped">Mark as Shipped</SelectItem>
                  <SelectItem value="delivered">Mark as Delivered</SelectItem>
                  <SelectItem value="completed">Mark as Completed</SelectItem>
                  <SelectItem value="cancelled">Mark as Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Orders:</p>
              <ul className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                {selectedOrders.slice(0, 10).map((id) => {
                  const order = orders.find((o) => o.id === id);
                  return (
                    <li key={id} className="truncate">
                      {order?.order_number} - {order?.customer.name}
                    </li>
                  );
                })}
                {selectedOrders.length > 10 && (
                  <li className="text-muted-foreground">
                    ...and {selectedOrders.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkUpdateOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkStatusUpdate}>
              Update {selectedOrders.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={isEmailBulkOpen} onOpenChange={setIsEmailBulkOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Bulk Email Notifications</DialogTitle>
            <DialogDescription>
              Send shipping notifications to {selectedOrders.length} customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-template">
                Email Template{" "}
                <span className="text-muted-foreground text-sm">
                  (Use placeholders below)
                </span>
              </Label>
              <Textarea
                id="email-template"
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium mb-2">Available Placeholders:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <code className="bg-background px-2 py-1 rounded">{`{customer_name}`}</code>
                <span>Customer's full name</span>
                <code className="bg-background px-2 py-1 rounded">{`{order_number}`}</code>
                <span>Order number</span>
                <code className="bg-background px-2 py-1 rounded">{`{tracking_number}`}</code>
                <span>Tracking number</span>
                <code className="bg-background px-2 py-1 rounded">{`{shipping_method}`}</code>
                <span>Shipping method</span>
                <code className="bg-background px-2 py-1 rounded">{`{estimated_delivery}`}</code>
                <span>Estimated delivery date</span>
                <code className="bg-background px-2 py-1 rounded">{`{order_date}`}</code>
                <span>Order date</span>
                <code className="bg-background px-2 py-1 rounded">{`{order_total}`}</code>
                <span>Order total amount</span>
                <code className="bg-background px-2 py-1 rounded">{`{currency}`}</code>
                <span>Currency (KES)</span>
                <code className="bg-background px-2 py-1 rounded">{`{tracking_url}`}</code>
                <span>Tracking page URL</span>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium mb-2">Preview:</p>
              <div className="bg-background p-4 rounded border">
                <p className="font-medium mb-2">{emailSubject}</p>
                <pre className="text-sm whitespace-pre-wrap">
                  {emailTemplate
                    .replace(/{customer_name}/g, "John Doe")
                    .replace(/{order_number}/g, "BTE-202401-000001")
                    .replace(/{tracking_number}/g, "BTE2401010001")
                    .replace(/{shipping_method}/g, "Standard")
                    .replace(/{estimated_delivery}/g, "Jan 5, 2024")
                    .replace(/{order_date}/g, "Jan 1, 2024")
                    .replace(/{order_total}/g, "KES 15,000")
                    .replace(/{currency}/g, "KES")
                    .replace(
                      /{tracking_url}/g,
                      "https://www.blessedtwoelectronics.com/tracking/BTE2401010001",
                    )}
                </pre>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkEmail}>
              Send to {selectedOrders.length} Customers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
