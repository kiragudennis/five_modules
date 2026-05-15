"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, DollarSign, Package, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { Order } from "./orders/page";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0, // Actual sales from completed orders
    totalRevenue: 0, // All order amounts
    todaySales: 0,
    totalOrders: 0,
    todayOrders: 0,
    paidOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pageViews: 0,
    avgOrderValue: 0,
  });

  const { supabase } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // loading data
  useEffect(() => {
    const fecthData = async () => {
      const { data, error } = await supabase.rpc("get_dashboard_data");

      if (error) console.error(error);
      else {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
      }
    };
    fecthData();
  }, []);

  return (
    <div className="px-2 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold truncate">Dashboard</h1>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/admin/products/new">Add New Product</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Sales (Actual completed sales) */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Sales
              </p>
              <h3 className="text-2xl font-bold mt-1">
                KES{stats?.totalSales?.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Completed orders only
              </p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Total Revenue (All orders) */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold mt-1">
                KES{stats?.totalRevenue?.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">All orders</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Today's Sales
              </p>
              <h3 className="text-2xl font-bold mt-1">
                KES{stats?.todaySales?.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.todayOrders} orders
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Completed:</span>
              <span className="font-medium">{stats.completedOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid:</span>
              <span className="font-medium">{stats.paidOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending:</span>
              <span className="font-medium">{stats.pendingOrders}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Total Orders:</span>
              <span className="font-bold">{stats.totalOrders}</span>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg Order Value
              </p>
              <h3 className="text-2xl font-bold mt-1">
                KES{stats?.avgOrderValue?.toLocaleString()}
              </h3>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Customers
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats.totalCustomers}
              </h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-background rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
        </div>

        {recentOrders.length === 0 ? (
          // Show message when no orders
          <div className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No recent orders
            </p>
            <p className="text-sm text-muted-foreground">
              Orders will appear here once they are placed.
            </p>
          </div>
        ) : (
          // Show table when there are orders
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(order.date), "yyyy-MM-dd")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        KES{order.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "shipped"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "paid"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "pending"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t text-center">
              <Button variant="ghost" asChild>
                <Link href="/admin/orders">View All Orders</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
