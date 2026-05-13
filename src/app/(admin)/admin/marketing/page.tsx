// app/admin/marketing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Target,
  RefreshCw,
  Crown,
  Coins,
  Users,
  TrendingUp,
  ShoppingBag,
  Award,
  Sparkles,
  Clock,
  ArrowRight,
  MonitorPlay,
  Ticket,
  Flame,
  Settings2,
  Zap,
  Trophy,
  Palette,
  LayoutDashboard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { MarketingStats } from "@/types/customer";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
];

export default function AdminMarketingPage() {
  const { supabase, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MarketingStats>({
    bundles: { total: 0, active: 0, purchases: 0, revenue: 0, topBundles: [] },
    spins: {
      totalGames: 0,
      activeGames: 0,
      totalSpins: 0,
      todaySpins: 0,
      prizesAwarded: { points: 0, discounts: 0, products: 0 },
      topWinners: [],
    },
    challenges: {
      total: 0,
      active: 0,
      completed: 0,
      referrals: { total: 0, completed: 0, pending: 0 },
      pointsAwarded: 0,
    },
    rewards: { total: 0, active: 0, awarded: 0, upcoming: [] },
    loyalty: {
      totalPoints: 0,
      pointsEarned: 0,
      pointsRedeemed: 0,
      tierDistribution: [],
    },
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    if (profile?.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchMarketingStats();
  }, [profile, timeRange]);

  const fetchMarketingStats = async () => {
    try {
      setLoading(true);

      // Fetch bundles stats
      const { data: bundles, error: bundlesError } = await supabase
        .from("mistry_bundles")
        .select("*");

      if (!bundlesError && bundles) {
        const activeBundles = bundles.filter((b: any) => b.status === "active");
        const { data: purchases, error: purchasesError } = await supabase
          .from("bundle_purchases")
          .select(
            `
            *,
            bundle:bundle_id (name)
          `,
          )
          .gte("created_at", getTimeRangeDate());

        if (!purchasesError && purchases) {
          const bundleRevenue = purchases.reduce(
            (sum: number, p: any) => sum + (p.price_paid || 0),
            0,
          );

          const bundleMap = new Map();
          purchases.forEach((p: any) => {
            if (!bundleMap.has(p.bundle_id)) {
              bundleMap.set(p.bundle_id, {
                name: p.bundle?.name || "Unknown",
                purchases: 0,
                revenue: 0,
              });
            }
            const bundle = bundleMap.get(p.bundle_id);
            bundle.purchases++;
            bundle.revenue += p.price_paid || 0;
          });

          const topBundles = Array.from(bundleMap.values())
            .sort((a, b) => b.purchases - a.purchases)
            .slice(0, 5);

          setStats((prev) => ({
            ...prev,
            bundles: {
              total: bundles.length,
              active: activeBundles.length,
              purchases: purchases.length,
              revenue: bundleRevenue,
              topBundles,
            },
          }));
        }
      }

      // Fetch spin games stats
      const { data: spinGames, error: spinError } = await supabase
        .from("spin_games")
        .select("*");

      if (!spinError && spinGames) {
        const activeGames = spinGames.filter((g: any) => g.is_active);

        const { data: spins, error: spinsError } = await supabase
          .from("spin_attempts")
          .select("*")
          .gte("created_at", getTimeRangeDate());

        if (!spinsError && spins) {
          const today = new Date().toISOString().split("T")[0];
          const todaySpins = spins.filter((s: any) =>
            s.created_at.startsWith(today),
          ).length;

          const { data: results, error: resultsError } = await supabase
            .from("spin_attempts")
            .select(
              `
              *,
              profiles:user_id (full_name, email)
            `,
            )
            .gte("created_at", getTimeRangeDate())
            .order("created_at", { ascending: false })
            .limit(10);

          if (!resultsError && results) {
            const prizes = {
              points: results.filter((r: any) => r.prize_type === "points")
                .length,
              discounts: results.filter((r: any) => r.prize_type === "discount")
                .length,
              products: results.filter((r: any) => r.prize_type === "product")
                .length,
            };

            const topWinners = results
              .filter((r: any) => r.prize_type !== "nothing")
              .slice(0, 5)
              .map((r: any) => ({
                user: r.profiles?.full_name || "Anonymous",
                prize: `${r.prize_type}${r.prize_value ? `: ${r.prize_value}` : ""}`,
                date: r.created_at,
              }));

            setStats((prev) => ({
              ...prev,
              spins: {
                totalGames: spinGames.length,
                activeGames: activeGames.length,
                totalSpins: spins.length,
                todaySpins: todaySpins,
                prizesAwarded: prizes,
                topWinners,
              },
            }));
          }
        }
      }

      // Fetch challenges stats
      const { data: challenges, error: challengesError } = await supabase
        .from("challenges")
        .select("*");

      if (!challengesError && challenges) {
        const activeChallenges = challenges.filter(
          (c: any) => c.status === "active",
        );

        const { data: userChallenges, error: ucError } = await supabase
          .from("challenge_participants")
          .select("*")
          .gte("joined_at", getTimeRangeDate());

        if (!ucError && userChallenges) {
          const completed = userChallenges.filter(
            (uc: any) => uc.current_score > 0,
          ).length;
          const pointsAwarded = userChallenges.reduce(
            (sum: number, uc: any) => sum + (uc.current_score || 0),
            0,
          );

          const { data: referrals, error: refError } = await supabase
            .from("challenge_actions")
            .select("*")
            .eq("action_type", "referral_completed")
            .gte("created_at", getTimeRangeDate());

          if (!refError && referrals) {
            setStats((prev) => ({
              ...prev,
              challenges: {
                total: challenges.length,
                active: activeChallenges.length,
                completed,
                referrals: {
                  total: referrals.length,
                  completed: referrals.length,
                  pending: 0,
                },
                pointsAwarded,
              },
            }));
          }
        }
      }

      // Fetch loyalty stats
      const { data: loyalty, error: loyaltyError } = await supabase
        .from("loyalty_points")
        .select("points, points_earned, points_redeemed, tier");

      if (!loyaltyError && loyalty) {
        const totalPoints = loyalty.reduce(
          (sum: number, l: any) => sum + (l.points || 0),
          0,
        );
        const pointsEarned = loyalty.reduce(
          (sum: number, l: any) => sum + (l.points_earned || 0),
          0,
        );
        const pointsRedeemed = loyalty.reduce(
          (sum: number, l: any) => sum + (l.points_redeemed || 0),
          0,
        );

        const tierCount = new Map();
        loyalty.forEach((l: any) => {
          tierCount.set(l.tier, (tierCount.get(l.tier) || 0) + 1);
        });

        const tierDistribution = Array.from(tierCount.entries()).map(
          ([tier, count], index) => ({
            tier,
            count,
            color: COLORS[index % COLORS.length],
          }),
        );

        setStats((prev) => ({
          ...prev,
          loyalty: {
            totalPoints,
            pointsEarned,
            pointsRedeemed,
            tierDistribution,
          },
        }));
      }

      // Fetch recent orders activity
      const { data: recentOrders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          total_amount,
          created_at,
          customer_name
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (!ordersError && recentOrders) {
        const activity = recentOrders.map((order: any) => ({
          type: "order",
          description: `New order #${order.order_number} from ${order.customer_name}`,
          amount: order.total_amount,
          time: order.created_at,
        }));
        setRecentActivity(activity);
      }
    } catch (error: any) {
      console.error("Error fetching marketing stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeDate = () => {
    const date = new Date();
    switch (timeRange) {
      case "week":
        date.setDate(date.getDate() - 7);
        break;
      case "month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "year":
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date.toISOString();
  };

  const ModuleCard = ({
    title,
    description,
    icon: Icon,
    href,
    stats: moduleStats,
    color,
    progress,
  }: any) => (
    <Link href={href} className="block group">
      <Card
        className={`hover:shadow-lg transition-all duration-300 border-l-4 border-l-${color}-500 overflow-hidden h-full`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className={`p-3 bg-${color}-100 dark:bg-${color}-950/30 rounded-lg group-hover:scale-110 transition-transform`}
            >
              <Icon
                className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`}
              />
            </div>
            {progress !== undefined && (
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-950/30"
              >
                {progress}% conversion
              </Badge>
            )}
          </div>

          <h3 className="text-xl font-bold mb-1 group-hover:text-${color}-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>

          <div className="space-y-2">
            {moduleStats.map((stat: any, i: number) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-muted-foreground">{stat.label}</span>
                <span className="font-semibold">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Manage →</span>
            <ArrowRight
              className={`h-4 w-4 text-${color}-500 group-hover:translate-x-1 transition-transform`}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">
            Loading marketing dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage customer engagement campaigns, loyalty programs, and track
          performance metrics
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Bundle Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.bundles.revenue, "KES")}
                </p>
              </div>
              <div className="p-3 bg-green-200 dark:bg-green-900 rounded-full">
                <ShoppingBag className="h-5 w-5 text-green-700 dark:text-green-300" />
              </div>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              from {stats.bundles.purchases} bundle sales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Total Engagement
                </p>
                <p className="text-2xl font-bold">
                  {(
                    stats.spins.totalSpins + stats.challenges.completed
                  ).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-900 rounded-full">
                <Users className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {stats.spins.todaySpins} spins today •{" "}
              {stats.challenges.completed} challenges
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  Loyalty Points
                </p>
                <p className="text-2xl font-bold">
                  {stats.loyalty.totalPoints.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-200 dark:bg-purple-900 rounded-full">
                <Coins className="h-5 w-5 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              {stats.loyalty.pointsEarned.toLocaleString()} earned
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Active Campaigns
                </p>
                <p className="text-2xl font-bold">
                  {stats.bundles.active +
                    stats.spins.activeGames +
                    stats.challenges.active}
                </p>
              </div>
              <div className="p-3 bg-amber-200 dark:bg-amber-900 rounded-full">
                <Zap className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              {stats.bundles.active} bundles • {stats.spins.activeGames} spin
              games
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ModuleCard
          title="Mystery Bundles"
          description="Create product bundles with special discounts"
          icon={Gift}
          href="/admin/marketing/bundles"
          color="purple"
          progress={
            stats.bundles.active > 0
              ? Math.round(
                  (stats.bundles.purchases / stats.bundles.active) * 100,
                )
              : 0
          }
          stats={[
            { label: "Active Bundles", value: stats.bundles.active },
            { label: "Total Sales", value: stats.bundles.purchases },
            {
              label: "Revenue",
              value: formatCurrency(stats.bundles.revenue, "KES"),
            },
          ]}
        />

        <ModuleCard
          title="Spin Games"
          description="Engage customers with daily spin wheels"
          icon={RefreshCw}
          href="/admin/marketing/spin"
          color="green"
          progress={
            stats.spins.totalSpins > 0
              ? Math.round(
                  (stats.spins.todaySpins / stats.spins.totalSpins) * 100,
                )
              : 0
          }
          stats={[
            { label: "Active Games", value: stats.spins.activeGames },
            {
              label: "Total Spins",
              value: stats.spins.totalSpins.toLocaleString(),
            },
            { label: "Today's Spins", value: stats.spins.todaySpins },
          ]}
        />

        <ModuleCard
          title="Challenges"
          description="Drive actions with competitive challenges"
          icon={Trophy}
          href="/admin/marketing/challenges"
          color="orange"
          progress={
            stats.challenges.active > 0
              ? Math.round(
                  (stats.challenges.completed / stats.challenges.active) * 100,
                )
              : 0
          }
          stats={[
            { label: "Active Challenges", value: stats.challenges.active },
            { label: "Completed", value: stats.challenges.completed },
            { label: "Referrals", value: stats.challenges.referrals.total },
          ]}
        />

        <ModuleCard
          title="Lucky Draws"
          description="Run time-limited giveaways"
          icon={Ticket}
          href="/admin/marketing/draws"
          color="blue"
          stats={[
            { label: "Active Draws", value: 0 },
            { label: "Total Entries", value: 0 },
            { label: "Winners", value: 0 },
          ]}
        />

        <ModuleCard
          title="Flash Deals"
          description="Create urgency with limited-time offers"
          icon={Flame}
          href="/admin/marketing/deals"
          color="red"
          stats={[
            { label: "Active Deals", value: 0 },
            { label: "Units Sold", value: 0 },
            { label: "Revenue", value: formatCurrency(0, "KES") },
          ]}
        />

        <ModuleCard
          title="Rewards"
          description="Automatic customer rewards"
          icon={Award}
          href="/admin/marketing/rewards"
          color="amber"
          stats={[
            { label: "Active Rewards", value: stats.rewards.active },
            { label: "Awarded", value: stats.rewards.awarded },
            {
              label: "Points Distributed",
              value: stats.challenges.pointsAwarded.toLocaleString(),
            },
          ]}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Customer Tier Distribution
            </CardTitle>
            <CardDescription>
              Loyalty program membership by tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.loyalty.tierDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="count"
                    label={({ payload, percent }) =>
                      `${payload?.tier} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {stats.loyalty.tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {stats.loyalty.tierDistribution.map((tier, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="capitalize">{tier.tier}:</span>
                  <span className="font-medium">{tier.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prize Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Spin Prizes Awarded
            </CardTitle>
            <CardDescription>
              Distribution of prizes from spin games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Points</span>
                  <span className="font-medium">
                    {stats.spins.prizesAwarded.points}
                  </span>
                </div>
                <Progress
                  value={
                    (stats.spins.prizesAwarded.points /
                      (stats.spins.totalSpins || 1)) *
                    100
                  }
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Discounts</span>
                  <span className="font-medium">
                    {stats.spins.prizesAwarded.discounts}
                  </span>
                </div>
                <Progress
                  value={
                    (stats.spins.prizesAwarded.discounts /
                      (stats.spins.totalSpins || 1)) *
                    100
                  }
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Products</span>
                  <span className="font-medium">
                    {stats.spins.prizesAwarded.products}
                  </span>
                </div>
                <Progress
                  value={
                    (stats.spins.prizesAwarded.products /
                      (stats.spins.totalSpins || 1)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Winners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Winners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Recent Spin Winners
            </CardTitle>
            <CardDescription>Latest lucky customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.spins.topWinners.map((winner, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{winner.user}</p>
                    <p className="text-sm text-muted-foreground">
                      Won: {winner.prize}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatDistanceToNow(new Date(winner.date), {
                      addSuffix: true,
                    })}
                  </Badge>
                </div>
              ))}
              {stats.spins.topWinners.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No winners yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest customer interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-full">
                    <ShoppingBag className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.time), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatCurrency(activity.amount, "KES")}
                  </Badge>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Link href="/admin/marketing/bundles?create=true">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Gift className="h-5 w-5" />
              <span className="text-xs">New Bundle</span>
            </Button>
          </Link>
          <Link href="/admin/marketing/spin?create=true">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-xs">New Spin Game</span>
            </Button>
          </Link>
          <Link href="/admin/marketing/challenges?create=true">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs">New Challenge</span>
            </Button>
          </Link>
          <Link href="/admin/marketing/draws?create=true">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Ticket className="h-5 w-5" />
              <span className="text-xs">New Draw</span>
            </Button>
          </Link>
          <Link href="/admin/marketing/deals?create=true">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Flame className="h-5 w-5" />
              <span className="text-xs">New Deal</span>
            </Button>
          </Link>
          <Link href="/admin/marketing/rewards?create=true">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Award className="h-5 w-5" />
              <span className="text-xs">New Reward</span>
            </Button>
          </Link>
          <Link href="/admin/live">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <MonitorPlay className="h-5 w-5" />
              <span className="text-xs">Live Control</span>
            </Button>
          </Link>
          <Link href="/admin/points">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Settings2 className="h-5 w-5" />
              <span className="text-xs">Points</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
