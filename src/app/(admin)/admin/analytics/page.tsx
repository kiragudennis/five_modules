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

  const [salesData, setSalesData] = useState<any[]>([]);
  const [visitsData, setVisitsData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pageViews: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data, error } = await supabase.rpc("get_analytics", {
        time_period: "30d",
      });

      if (error) {
        toast.error(error.message);
      } else {
        setSalesData(data.salesData);
        setVisitsData(data.visitsData);
        setCategoryData(data.categoryData);
        setStats(data.stats);
      }
    };

    fetchAnalytics();
  }, [supabase]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Sales
              </p>
              <h3 className="text-2xl font-bold mt-1">
                KES{stats.totalSales.toLocaleString()}
              </h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Orders
              </p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalOrders}</h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

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

        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Page Views
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats.pageViews.toLocaleString()}
              </h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Eye className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats.conversionRate}%
              </h3>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Time Period
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {timePeriods.find((p) => p.value === timePeriod)?.label}
              </h3>
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
                  formatter={(value) => [`KES${value}`, "Sales"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" name="Sales (KES)" />
              </BarChart>
            </ResponsiveContainer>
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
        <div className="bg-background rounded-lg shadow-sm p-6 border">
          <h2 className="text-xl font-semibold mb-4">Top Products</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Premium Karate Gi</p>
                <p className="text-sm text-muted-foreground">42 units sold</p>
              </div>
              <p className="font-semibold">KES 3,779</p>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Competition Sparring Gear Set</p>
                <p className="text-sm text-muted-foreground">38 units sold</p>
              </div>
              <p className="font-semibold">KES 4,939</p>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Black Belt - Premium Cotton</p>
                <p className="text-sm text-muted-foreground">35 units sold</p>
              </div>
              <p className="font-semibold">KES 1,224</p>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Training Gloves</p>
                <p className="text-sm text-muted-foreground">30 units sold</p>
              </div>
              <p className="font-semibold">KES 1,499</p>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Focus Pads</p>
                <p className="text-sm text-muted-foreground">28 units sold</p>
              </div>
              <p className="font-semibold">KES 839</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-background rounded-lg shadow-sm p-6 border">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium">New order #ORD-001 from John Doe</p>
              <p className="text-sm text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">New customer registered: Jane Smith</p>
              <p className="text-sm text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">
                Order #ORD-002 status updated to "shipped"
              </p>
              <p className="text-sm text-muted-foreground">6 hours ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3 mt-1">
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium">Payment received for order #ORD-003</p>
              <p className="text-sm text-muted-foreground">8 hours ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-3 mt-1">
              <Eye className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium">
                Product "Premium Karate Gi" viewed 25 times
              </p>
              <p className="text-sm text-muted-foreground">12 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
