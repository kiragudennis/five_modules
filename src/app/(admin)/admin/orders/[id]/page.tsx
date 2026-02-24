// Admin Order Detail Page
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Loader2,
  Truck,
  Package,
  Mail,
  Phone,
  ClipboardX,
  CreditCard,
  MapPin,
  Calendar,
  User,
  Hash,
  DollarSign,
  ShoppingBag,
  Settings,
  CheckCircle,
  RefreshCw,
  Home,
  Truck as TruckIcon,
  Check,
  X,
  ExternalLink,
  Download,
  Printer,
  Copy,
  Edit,
  MessageSquare,
  PhoneCall,
  BarChart,
  Award,
  Shield,
  Star,
  Tag,
  Percent,
  Package as PackageIcon,
  Building,
  Navigation,
  Globe,
  Smartphone,
  CreditCard as CreditCardIcon,
  Wallet,
  Truck as ShippingIcon,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { format, formatDate, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Status options
const statusOptions = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "processing",
    label: "Processing",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "shipped",
    label: "Shipped",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "delivered",
    label: "Delivered",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

const paymentStatusOptions = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "processing",
    label: "Processing",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
  { value: "refunded", label: "Refunded", color: "bg-gray-100 text-gray-800" },
];

const shippingMethodOptions = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "pickup", label: "Pickup" },
];

const installationTimeOptions = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const param = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const { supabase } = useAuth();
  const newDate = formatDate(new Date(), "yyyy/MM/dd");
  const [showFullMetadata, setShowFullMetadata] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    status: "",
    payment_status: "",
    tracking_number: "",
    shipping_method: "",
    shipping_cost: 0,
    estimated_delivery: "",
    installation_date: newDate,
    installation_time: "",
    special_instructions: "",
  });

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const { data: orderData, error } = await supabase
          .from("orders")
          .select(
            `
            *,
            items:order_items(
              id,
              product_id,
              product_name,
              product_title,
              product_sku,
              product_category,
              product_image,
              unit_price,
              wholesale_price,
              wholesale_min_quantity,
              has_wholesale,
              applied_price,
              quantity,
              total_price,
              metadata,
              created_at
            )
          `,
          )
          .eq("id", param.id)
          .single();

        if (error) throw error;

        // Fetch transactions separately
        const { data: transactions, error: txError } = await supabase
          .from("transactions")
          .select("*")
          .eq("order_id", param.id)
          .order("created_at", { ascending: false });

        if (txError) {
          console.error("Error fetching transactions:", txError);
          // Continue without transactions
        }

        // Combine the data
        const data = {
          ...orderData,
          transactions: transactions || [],
        };

        if (!data) {
          toast.error("Order not found");
          router.push("/admin/orders");
          return;
        }

        setOrder(data);
        setNotes(data.notes || "");

        // Initialize form data
        setFormData({
          status: data.status,
          payment_status: data.payment_status,
          tracking_number: data.tracking_number || "",
          shipping_method: data.shipping_method,
          shipping_cost: data.shipping_cost || 0,
          estimated_delivery: data.estimated_delivery || "",
          installation_date: data.installation_date,
          installation_time: data.installation_time,
          special_instructions: data.special_instructions || "",
        });
      } catch (err: any) {
        console.error("Error fetching order:", err);
        toast.error(err.message || "Failed to fetch order");
        router.push("/admin/orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [param.id, router, supabase]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return (
      <Badge className={option?.color || "bg-gray-100 text-gray-800"}>
        {option?.label || status}
      </Badge>
    );
  };

  // Get payment status badge
  const getPaymentBadge = (status: string) => {
    const option = paymentStatusOptions.find((opt) => opt.value === status);
    return (
      <Badge className={option?.color || "bg-gray-100 text-gray-800"}>
        {option?.label || status}
      </Badge>
    );
  };

  const handleUpdateOrder = async () => {
    if (!order) return;
    setIsUpdating(true);

    try {
      const updateData: any = {
        status: formData.status,
        payment_status: formData.payment_status,
        tracking_number: formData.tracking_number,
        shipping_method: formData.shipping_method,
        shipping_cost: formData.shipping_cost,
        estimated_delivery: formData.estimated_delivery,
        installation_date: formData.installation_date,
        installation_time: formData.installation_time,
        special_instructions: formData.special_instructions,
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      // Update timestamps based on status changes
      if (formData.status === "shipped" && order.status !== "shipped") {
        updateData.shipped_at = new Date().toISOString();
      }
      if (formData.status === "delivered" && order.status !== "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }
      if (
        formData.payment_status === "completed" &&
        order.payment_status !== "completed"
      ) {
        updateData.paid_at = new Date().toISOString();
      }

      const { data: updatedOrder, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order.id)
        .select()
        .single();

      if (error) throw error;

      setOrder(updatedOrder);
      toast.success("Order updated successfully ✅");

      // Send notification if status changed
      if (
        order.status !== formData.status ||
        order.payment_status !== formData.payment_status
      ) {
        await sendOrderUpdateNotification(order, updatedOrder);
      }
    } catch (err: any) {
      console.error("Error updating order:", err);
      toast.error(err.message || "Failed to update order ❌");
    } finally {
      setIsUpdating(false);
    }
  };

  const sendOrderUpdateNotification = async (oldOrder: any, newOrder: any) => {
    try {
      const response = await fetch("/api/notifications/order-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: newOrder.id,
          orderNumber: newOrder.order_number,
          customerEmail: newOrder.customer_email,
          customerName: newOrder.customer_name,
          customerPhone: newOrder.customer_phone,
          oldStatus: oldOrder.status,
          newStatus: newOrder.status,
          oldPaymentStatus: oldOrder.payment_status,
          newPaymentStatus: newOrder.payment_status,
          trackingNumber: newOrder.tracking_number,
          orderTotal: newOrder.total_amount,
          orderCurrency: newOrder.currency,
          orderDate: newOrder.created_at,
          orderItems: newOrder.items,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast.success("Customer notified");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    }
  };

  const handleCancelOrder = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this order? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          payment_status: "refunded",
          updated_at: new Date().toISOString(),
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (error) throw error;

      toast.success("Order cancelled successfully");
      router.refresh();
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      toast.error(err.message || "Failed to cancel order");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The order you are looking for does not exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  // Calculate totals
  const itemsTotal =
    order.items?.reduce(
      (sum: number, item: any) =>
        sum + (item.total_price || item.applied_price * item.quantity),
      0,
    ) || 0;

  return (
    <div className="py-6 px-2 container mx-auto max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          href="/admin/orders"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
            {getStatusBadge(order.status)}
            {getPaymentBadge(order.payment_status)}
          </div>
          <p className="text-muted-foreground">
            Created{" "}
            {formatDistanceToNow(new Date(order.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" asChild>
            <a
              href={`/api/orders/${order.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4 mr-2" />
              Invoice
            </a>
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelOrder}
            disabled={order.status === "cancelled"}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Order Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Order Information
                        </h3>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Order Number:
                            </span>
                            <span className="font-medium">
                              {order.order_number}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span>
                              {format(new Date(order.created_at), "PPpp")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Status:
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Payment:
                            </span>
                            {getPaymentBadge(order.payment_status)}
                          </div>
                        </div>
                      </div>

                      {/* Payment Information */}
                      {order.payment_method && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Payment Information
                          </h3>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Method:
                              </span>
                              <span className="font-medium capitalize">
                                {order.payment_method}
                              </span>
                            </div>
                            {order.payment_reference && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Reference:
                                </span>
                                <span className="font-mono text-sm">
                                  {order.payment_reference}
                                </span>
                              </div>
                            )}
                            {order.paid_at && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Paid At:
                                </span>
                                <span>
                                  {format(new Date(order.paid_at), "PPpp")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Financial Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Subtotal:
                          </span>
                          <span>
                            {formatCurrency(order.subtotal, order.currency)}
                          </span>
                        </div>

                        {order.wholesale_savings > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="text-muted-foreground">
                              Wholesale Savings:
                            </span>
                            <span>
                              -
                              {formatCurrency(
                                order.wholesale_savings,
                                order.currency,
                              )}
                            </span>
                          </div>
                        )}

                        {order.coupon_discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="text-muted-foreground">
                              Coupon Discount:
                            </span>
                            <span>
                              -
                              {formatCurrency(
                                order.coupon_discount,
                                order.currency,
                              )}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Shipping:
                          </span>
                          <span>
                            {formatCurrency(
                              order.shipping_total,
                              order.currency,
                            )}
                          </span>
                        </div>

                        {order.installation_cost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Installation:
                            </span>
                            <span>
                              {formatCurrency(
                                order.installation_cost,
                                order.currency,
                              )}
                            </span>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>
                            {formatCurrency(order.total_amount, order.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping & Delivery Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5" />
                    Shipping & Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Shipping Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Method:</span>
                          <span className="capitalize">
                            {order.shipping_method}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost:</span>
                          <span>
                            {formatCurrency(
                              order.shipping_total,
                              order.currency,
                            )}
                          </span>
                        </div>
                        {order.estimated_delivery && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Est. Delivery:
                            </span>
                            <span>{order.estimated_delivery}</span>
                          </div>
                        )}
                        {order.tracking_number && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Tracking:
                            </span>
                            <span className="font-mono">
                              {order.tracking_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.installation_required && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Installation Service
                        </h3>
                        <div className="space-y-2">
                          {order.installation_service?.name && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Service:
                              </span>
                              <span>{order.installation_service.name}</span>
                            </div>
                          )}
                          {order.installation_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Date:
                              </span>
                              <span>
                                {format(
                                  new Date(order.installation_date),
                                  "PPP",
                                )}
                              </span>
                            </div>
                          )}
                          {order.installation_time && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Time:
                              </span>
                              <span className="capitalize">
                                {order.installation_time}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-6">
              <EnhancedOrderItems
                items={order.items}
                currency={order.currency}
                metadata={order.metadata}
              />
            </TabsContent>

            {/* Customer Tab */}
            <TabsContent value="customer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Contact Details
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {order.customer_name}
                              </p>
                              {order.user_id && (
                                <p className="text-sm text-muted-foreground">
                                  User ID: {order.user_id.substring(0, 8)}...
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(order.customer_name, "Name")
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <a
                              href={`mailto:${order.customer_email}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Mail className="h-4 w-4" />
                              {order.customer_email}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(order.customer_email, "Email")
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Phone className="h-4 w-4" />
                              {order.customer_phone}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(order.customer_phone, "Phone")
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Previous Orders */}
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Customer History
                        </h3>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/admin/customers?email=${order.customer_email}`}
                          >
                            View Customer Profile
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Shipping Address
                      </h3>
                      <div className="space-y-1">
                        <p className="font-medium">{order.customer_name}</p>
                        <p>{order.shipping_address}</p>
                        <p>
                          {order.shipping_city}, {order.shipping_county}
                        </p>
                        <p>{order.shipping_country}</p>
                        {order.shipping_postal_code && (
                          <p className="text-muted-foreground">
                            Postal: {order.shipping_postal_code}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Communication Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Communication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`mailto:${order.customer_email}?subject=Order ${order.order_number} Update`}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`sms:${order.customer_phone}`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send SMS
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${order.customer_phone}`}>
                          <PhoneCall className="h-4 w-4 mr-2" />
                          Call Customer
                        </a>
                      </Button>
                    </div>

                    {/* Notes */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Internal Notes
                      </h4>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add internal notes about this order..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Bundle and Referral Info in Customer Tab */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {order.metadata?.bundle && (
                  <BundleDetailsCard bundle={order.metadata.bundle} />
                )}
                {order.metadata?.referral && (
                  <ReferralDetailsCard referral={order.metadata.referral} />
                )}
                {order.metadata?.loyaltyCode && (
                  <LoyaltyCodeCard code={order.metadata.loyaltyCode} />
                )}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <TimelineItem
                      title="Order Created"
                      description="Order was placed by customer"
                      date={order.created_at}
                      icon={CheckCircle}
                      color="bg-green-500"
                    />

                    {order.paid_at && (
                      <TimelineItem
                        title="Payment Completed"
                        description={`Payment via ${order.payment_method}`}
                        date={order.paid_at}
                        icon={CreditCard}
                        color="bg-blue-500"
                      />
                    )}

                    {order.shipped_at && (
                      <TimelineItem
                        title="Order Shipped"
                        description={`Tracking: ${
                          order.tracking_number || "No tracking"
                        }`}
                        date={order.shipped_at}
                        icon={Truck}
                        color="bg-purple-500"
                      />
                    )}

                    {order.delivered_at && (
                      <TimelineItem
                        title="Order Delivered"
                        description="Order was delivered to customer"
                        date={order.delivered_at}
                        icon={Package}
                        color="bg-green-500"
                      />
                    )}

                    {order.updated_at !== order.created_at && (
                      <TimelineItem
                        title="Last Updated"
                        description="Order details were updated"
                        date={order.updated_at}
                        icon={Edit}
                        color="bg-gray-500"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions & Updates */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Update Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Status</label>
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
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              option.color.split(" ")[0]
                            }`}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              option.color.split(" ")[0]
                            }`}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tracking Number</label>
                <Input
                  value={formData.tracking_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tracking_number: e.target.value,
                    })
                  }
                  placeholder="Enter tracking number"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Shipping Method</label>
                <Select
                  value={formData.shipping_method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, shipping_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Shipping Cost</label>
                <Input
                  type="number"
                  value={formData.shipping_cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shipping_cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="0.01"
                />
              </div>

              {order.installation_required && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Installation Date
                    </label>
                    <Input
                      type="date"
                      value={formData.installation_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installation_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Installation Time
                    </label>
                    <Select
                      value={formData.installation_time}
                      onValueChange={(value) =>
                        setFormData({ ...formData, installation_time: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {installationTimeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button
                onClick={handleUpdateOrder}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Order"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Metadata & Additional Info */}
          {order.metadata && Object.keys(order.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Additional Information
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullMetadata(!showFullMetadata)}
                    className="ml-auto"
                  >
                    {showFullMetadata ? "Show Less" : "Show All"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Key Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {order.metadata.cart_count && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          Cart Items
                        </p>
                        <p className="text-lg font-semibold">
                          {order.metadata.cart_count}
                        </p>
                      </div>
                    )}
                    {order.metadata.wholesale_applied && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600">Wholesale</p>
                        <p className="text-lg font-semibold text-blue-700">
                          Applied ✓
                        </p>
                      </div>
                    )}
                    {order.metadata.original_currency &&
                      order.metadata.original_currency !== "KES" && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-purple-600">
                            Original Currency
                          </p>
                          <p className="text-lg font-semibold text-purple-700">
                            {order.metadata.original_currency}
                          </p>
                        </div>
                      )}
                    {order.referral_source && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-green-600">
                          Referral Source
                        </p>
                        <p className="text-lg font-semibold text-green-700 capitalize">
                          {order.referral_source}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Full Metadata JSON (toggleable) */}
                  {showFullMetadata && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Raw Metadata</h4>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                        {JSON.stringify(order.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* System Info */}
                  {(order.metadata.user_agent || order.metadata.ip_address) && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-2">
                        System Information
                      </h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {order.metadata.ip_address && (
                          <p>IP Address: {order.metadata.ip_address}</p>
                        )}
                        {order.metadata.user_agent && (
                          <p className="truncate">
                            User Agent: {order.metadata.user_agent}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Order Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Count</span>
                <span className="font-medium">{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Quantity</span>
                <span className="font-medium">
                  {order.items?.reduce(
                    (sum: number, item: any) => sum + item.quantity,
                    0,
                  ) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wholesale Savings</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(order.wholesale_savings, order.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coupon Discount</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(order.coupon_discount, order.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Since Order</span>
                <span className="font-medium">
                  {Math.floor(
                    (Date.now() - new Date(order.created_at).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  days
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/admin/orders`}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  All Orders
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={`tel:${order.customer_phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Customer
                </a>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={`mailto:${order.customer_email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Customer
                </a>
              </Button>
              {order.tracking_number && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link
                    href={`/tracking/${order.tracking_number}`}
                    target="_blank"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Track Shipment
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ title, description, date, icon: Icon, color }: any) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-1 w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-medium">{title}</h4>
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), "PPpp")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

// Bundle Details Card Component
function BundleDetailsCard({ bundle }: { bundle: any }) {
  if (!bundle) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="bg-amber-50 dark:bg-amber-900/20">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <Award className="h-5 w-5" />
          Bundle Deal Applied
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Bundle Name:</span>
            <span className="font-medium">{bundle.bundle_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Discount Type:</span>
            <Badge variant="outline" className="border-amber-300">
              {bundle.discount_type === "percentage"
                ? `${bundle.discount_value}% Off`
                : `KES ${bundle.discount_value} Off`}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Original Price:</span>
            <span className="text-muted-foreground line-through">
              {formatCurrency(bundle.original_total, "KES")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Discounted Price:</span>
            <span className="font-bold text-green-600">
              {formatCurrency(bundle.discounted_total, "KES")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">You Save:</span>
            <span className="font-bold text-green-600">
              {formatCurrency(bundle.savings, "KES")}
            </span>
          </div>
          {bundle.points_required > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Points Required:</span>
              <Badge variant="secondary">{bundle.points_required} pts</Badge>
            </div>
          )}

          {/* Bundle Items */}
          {bundle.items && bundle.items.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Bundle Items:</h4>
              <div className="space-y-2">
                {bundle.items.map((item: any, index: number) => (
                  <div key={index} className="text-sm bg-muted/50 p-2 rounded">
                    <div className="flex justify-between">
                      <span>{item.product_title || item.name}</span>
                      <span className="text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.price, "KES")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Referral Details Card Component
function ReferralDetailsCard({ referral }: { referral: any }) {
  if (!referral) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Referral Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Referred By:</span>
          <span className="font-mono text-sm">{referral.referrerId}</span>
        </div>
        {referral.productId && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Product ID:</span>
            <span className="font-mono text-sm">{referral.productId}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Source:</span>
          <Badge variant="outline">{referral.source}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Timestamp:</span>
          <span className="text-sm">
            {format(new Date(referral.timestamp), "PPp")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Loyalty Code Card Component
function LoyaltyCodeCard({ code }: { code: string }) {
  if (!code) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Loyalty Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Redeemed Code:</span>
          <Badge variant="secondary" className="font-mono">
            {code}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Items Tab Component
function EnhancedOrderItems({ items, currency, metadata }: any) {
  // Group items by bundle if applicable
  const bundleItems = metadata?.bundle?.items || [];
  const regularItems = items.filter(
    (item: any) =>
      !bundleItems.some(
        (bItem: any) =>
          bItem.product_id === item.product_id || bItem.id === item.product_id,
      ),
  );

  return (
    <div className="space-y-6">
      {/* Bundle Items Section */}
      {metadata?.bundle && bundleItems.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="bg-amber-50/50">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Award className="h-5 w-5" />
              Bundle Items - {metadata.bundle.bundle_name}
              <Badge className="ml-2 bg-amber-500">Bundle Deal</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {bundleItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-amber-50/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {item.product_title || item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              SKU: {item.sku || "N/A"}
                            </Badge>
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatCurrency(
                              item.price * item.quantity,
                              currency,
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.price, currency)} ×{" "}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Bundle Savings Summary */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-green-700">Bundle Savings</p>
                    <p className="text-sm text-green-600">
                      {metadata.bundle.discount_type === "percentage"
                        ? `${metadata.bundle.discount_value}% off bundle`
                        : `KES ${metadata.bundle.discount_value} off bundle`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground line-through">
                      Original:{" "}
                      {formatCurrency(metadata.bundle.original_total, currency)}
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      Save {formatCurrency(metadata.bundle.savings, currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Items Section */}
      {regularItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5" />
              {metadata?.bundle ? "Additional Items" : "Order Items"} (
              {regularItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regularItems.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.product_title}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              SKU: {item.product_sku}
                            </Badge>
                            {item.product_category && (
                              <Badge variant="outline" className="text-xs">
                                {item.product_category}
                              </Badge>
                            )}
                            {item.has_wholesale &&
                              item.applied_price === item.wholesale_price && (
                                <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                  Wholesale
                                </Badge>
                              )}
                            {/* Show variety info if available */}
                            {item.metadata?.variety && (
                              <Badge variant="secondary" className="text-xs">
                                {item.metadata.variety.type}:{" "}
                                {item.metadata.variety.value}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatCurrency(item.total_price, currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.applied_price, currency)} ×{" "}
                            {item.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Price breakdown for wholesale items */}
                      {item.has_wholesale &&
                        item.unit_price !== item.applied_price && (
                          <div className="mt-2 text-sm bg-blue-50 p-2 rounded">
                            <span className="text-blue-700">
                              Wholesale discount applied
                            </span>
                            <span className="text-muted-foreground ml-2">
                              (Regular:{" "}
                              {formatCurrency(item.unit_price, currency)} →
                              Wholesale:{" "}
                              {formatCurrency(item.applied_price, currency)})
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
