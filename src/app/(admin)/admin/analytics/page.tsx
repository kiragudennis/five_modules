"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// Time period options
const timePeriods = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "1y", label: "Last Year" },
  { value: "all", label: "All Time" },
];

export default function AnalyticsPage() {
  const { supabase } = useAuth();
  const [timePeriod, setTimePeriod] = useState("30d");
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0, // Actual sales from completed orders
    totalRevenue: 0, // All order amounts
    totalOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pageViews: 0,
    conversionRate: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);

      const { data, error } = await supabase.rpc("get_analytics", {
        time_period: timePeriod === "all" ? "all" : timePeriod,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
      } else {
        setSalesData(data.salesData || []);
        setVisitsData(data.visitsData || []);
        setCategoryData(data.categoryData || []);
        setTopProducts(data.topProducts || []);
        setRecentActivity(data.recentActivity || []);

        // Update to handle new stats structure
        setStats(
          data.stats || {
            totalSales: 0,
            totalRevenue: 0,
            totalOrders: 0,
            completedOrders: 0,
            totalCustomers: 0,
            totalProducts: 0,
            pageViews: 0,
            conversionRate: 0,
            avgOrderValue: 0,
          }
        );
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [supabase, timePeriod]);

  // In render
  if (isLoading) {
    return (
      <div className="px-2 pt-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const ActivityIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "ShoppingBag":
        return <ShoppingBag className="h-4 w-4" />;
      case "Users":
        return <Users className="h-4 w-4" />;
      case "TrendingUp":
        return <TrendingUp className="h-4 w-4" />;
      case "DollarSign":
        return <DollarSign className="h-4 w-4" />;
      case "Eye":
        return <Eye className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="px-2 pt-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>

        <div className="flex flex-wrap gap-2">
          {timePeriods.map((period) => (
            <Button
              key={period.value}
              variant={timePeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod(period.value)}
              className="flex-1 min-w-[80px] sm:flex-none" // Responsive sizing
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Sales (Completed Orders) */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Sales
              </p>
              <h3 className="text-2xl font-bold mt-1">
                KES{stats.totalSales.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedOrders} completed orders
              </p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Total Revenue (All Orders) */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold mt-1">
                KES{stats.totalRevenue.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalOrders} total orders
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
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
                KES{stats.avgOrderValue.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Per completed order
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Total Orders:
              </span>
              <span className="font-medium">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Completed:</span>
              <span className="font-medium">{stats.completedOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Completion Rate:
              </span>
              <span className="font-medium">
                {stats.totalOrders > 0
                  ? Math.round(
                      (stats.completedOrders / stats.totalOrders) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Page Views & Conversion */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Page Views
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats.pageViews.toLocaleString()}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Conversion: {stats.conversionRate}%
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Time Period */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Time Period
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {timePeriods.find((p) => p.value === timePeriod)?.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Data filtered by period
              </p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Chart */}
        {/* Sales Chart */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={500}
                height={300}
                data={salesData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    `KES${value}`,
                    name === "sales" ? "Actual Sales" : "Total Revenue",
                  ]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" name="Actual Sales" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Total Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8884d8]"></div>
              <span>Actual Sales: Completed & paid orders</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#82ca9d]"></div>
              <span>Total Revenue: All orders including pending</span>
            </div>
          </div>
        </div>

        {/* Visits Chart */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <h2 className="text-xl font-semibold mb-4">Website Traffic</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                width={500}
                height={300}
                data={visitsData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value}`, "Visits"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#82ca9d"
                  name="Page Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <h2 className="text-xl font-semibold mb-4">Sales by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart width={400} height={400}>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent ?? 0 * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        {/* Top Products */}
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <h2 className="text-xl font-semibold mb-4">Top Products</h2>
          <div className="space-y-4">
            {topProducts.map((product: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.units} units sold
                  </p>
                </div>
                <p className="font-semibold">
                  KES {product.revenue.toLocaleString()}
                </p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No products sold in this period
              </p>
            )}
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-start">
                <div
                  className={`h-8 w-8 rounded-full ${
                    activity.type === "order"
                      ? "bg-green-100"
                      : activity.type === "user"
                        ? "bg-blue-100"
                        : activity.type === "status"
                          ? "bg-purple-100"
                          : activity.type === "payment"
                            ? "bg-yellow-100"
                            : "bg-red-100"
                  } flex items-center justify-center mr-3 mt-1`}
                >
                  {/* You'll need to import the icons */}
                  <ActivityIcon type={activity.icon} />
                </div>
                <div>
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
