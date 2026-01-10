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
import { format } from "date-fns";

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  date: string; // ISO date
  total: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  tracking: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: OrderItem[];
  payment: Payment;
}

export interface OrderItem {
  id: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
}

export interface Payment {
  method: string;
  transaction_id: string;
  status: "pending" | "completed" | "failed";
}

// Status options
const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

// Get status badge class
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "paid":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const param = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const { supabase } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .rpc("get_order_details", { order_uuid: param.id })
          .single();

        if (error) throw error;

        if (!data) {
          toast.error("Order not found");
          router.push("/admin/orders");
          return;
        }

        setOrder(data);
        setStatus(data.status);
        setTracking(data.tracking || "");
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

  const updateOrder = async () => {
    if (!order) return;
    setIsUpdating(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ status, tracking_number: tracking })
        .eq("id", order.id)
        .select("tracking_number, status")
        .single();

      if (error) throw error;

      setStatus(data.status);
      setTracking(data.tracking_number || "");
      toast.success("Order updated successfully ✅");
    } catch (err: any) {
      console.error("Error updating order:", err);
      toast.error(err.message || "Failed to update order ❌");
    } finally {
      setIsUpdating(false);
    }
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

  // Calculate order.items.price total;
  const itemsTotal = order.items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  // Calculate shipping as order.total - itemsTotal
  const shipping = order.total - itemsTotal;

  // Calculate subtotals as order.total - shipping
  const subtotal = order.total - shipping;

  return (
    <div className="py-6 px-2 container mx-auto max-w-6xl">
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

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold line-clamp-1">Order #{order.id}</h1>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <div className="bg-background rounded-lg border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Order Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Order Details
                  </h3>

                  <p className="mb-1">
                    <span className="font-medium">Order ID:</span> {order.id}
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">Date:</span>{" "}
                    {format(new Date(order.date), "yyyy-MM-dd HH:mm")}
                  </p>

                  {order.payment ? (
                    <>
                      <p className="mb-1">
                        <span className="font-medium">Payment Method:</span>{" "}
                        {order.payment.method}
                      </p>
                      <p className="mb-1">
                        <span className="font-medium">Transaction ID:</span>{" "}
                        {order.payment.transaction_id}
                      </p>
                      <p className="mb-1">
                        <span className="font-medium">Amount:</span>{" "}
                        {order.payment.amount}
                      </p>
                      <p className="mb-1">
                        <span className="font-medium">Phone:</span>{" "}
                        {order.payment.phone}
                      </p>
                      <p className="mb-1">
                        <span className="font-medium">Status:</span>{" "}
                        {order.payment.status}
                      </p>
                    </>
                  ) : (
                    <p className="text-red-500 italic items-center flex">
                      <ClipboardX className="h-4 w-4 ml-1" /> &nbsp; No
                      transaction found for this order
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Customer Information
                  </h3>
                  <p className="mb-1">
                    <span className="font-medium">Name:</span>{" "}
                    {order.customer.name}
                  </p>
                  <div className="flex items-center mb-1">
                    <span className="font-medium mr-1">Email:</span>
                    <a
                      href={`mailto:${order.customer.email}`}
                      className="text-primary hover:underline flex items-center"
                    >
                      {order.customer.email}
                      <Mail className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                  <div className="flex items-center mb-1">
                    <span className="font-medium mr-1">Phone:</span>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="text-primary hover:underline flex items-center"
                    >
                      {order.customer.phone}
                      <Phone className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Shipping Address
                </h3>
                <address className="not-italic">
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.city},{" "}
                    {order.shipping_address.state}{" "}
                    {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country}</p>
                </address>
              </div>

              {order.tracking && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Tracking Information
                  </h3>
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-primary" />
                    <p>{order.tracking}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-background rounded-lg border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Order Items</h2>
            </div>
            <div className="p-6">
              <ul className="divide-y">
                {order.items.map((item: any) => (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center shrink-0 mr-4">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              SKU: {item.sku}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <p className="text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-lg pt-2 border-t mt-2">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Actions */}
        <div>
          <div className="bg-background rounded-lg border overflow-hidden sticky top-20">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Order Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Order Status
                  </label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Enter tracking number"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <Button
                  onClick={updateOrder}
                  disabled={
                    isUpdating ||
                    (status === order.status && tracking === order.tracking)
                  }
                  className="w-full"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Order"
                  )}
                </Button>

                <div className="pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => window.print()}
                  >
                    Print Order
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const subject = `Order ${order.id} Update`;
                      const body = `Hi ${order.customer.name},\n\nThank you for your order! You can view your order details, track your shipment, or complete payment (if still pending) using the link below:\n\n${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderId=${order.id}\n\nIf you have any questions, just reply to this email and we'll be happy to help.\n\nBest regards,\nThe Support Team`;

                      window.location.href = `mailto:${
                        order.customer.email
                      }?subject=${encodeURIComponent(
                        subject
                      )}&body=${encodeURIComponent(body)}`;
                    }}
                  >
                    Email Customer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
