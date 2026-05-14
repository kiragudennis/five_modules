// app/admin/marketing/page.tsx (cleaned and complete)

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Gift,
  RefreshCw,
  Coins,
  Users,
  TrendingUp,
  ShoppingBag,
  Award,
  MonitorPlay,
  Ticket,
  Flame,
  Settings2,
  Zap,
  Trophy,
  LayoutDashboard,
  Radio,
  Facebook,
  Instagram,
  Twitter,
  Mic,
  Eye,
  Share2,
  MessageCircle,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  LinkIcon,
  Send,
  History,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { useLiveBroadcast } from "@/hooks/useLiveBroadcast";
import { toast } from "sonner";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#F7DC6F",
  "#BB8FCE",
];

// Types
interface MarketingStats {
  bundles: {
    total: number;
    active: number;
    purchases: number;
    revenue: number;
    topBundles: Array<{ name: string; purchases: number; revenue: number }>;
  };
  spins: {
    total_games: number;
    active_games: number;
    total_spins: number;
    today_spins: number;
    prizes_awarded: { points: number; discounts: number; products: number };
    top_winners: Array<{ user: string; prize: string; date: string }>;
  };
  challenges: {
    total: number;
    active: number;
    completed: number;
    referrals: { total: number; completed: number; pending: number };
    points_awarded: number;
  };
  draws: {
    total: number;
    active: number;
    entries: number;
    winners: number;
    pending_draws: number;
  };
  deals: {
    total: number;
    active: number;
    units_sold: number;
    revenue: number;
    expiring_soon: number;
  };
  loyalty: {
    total_points: number;
    points_earned: number;
    points_redeemed: number;
    tier_distribution: Array<{ tier: string; count: number; color: string }>;
  };
  referrals: {
    user_referrals: {
      total: number;
      pending: number;
      completed: number;
      points_awarded: number;
      top_referrers: Array<{
        user_id: string;
        referrals_count: number;
        points_earned: number;
      }>;
    };
    traffic_sources: Array<{
      source: string;
      type: string;
      clicks: number;
      conversions: number;
      revenue: number;
      conversion_rate: number;
    }>;
  };
}

export default function AdminMarketingPage() {
  const { supabase, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week" | "month">(
    "day",
  );
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [engagementHistory, setEngagementHistory] = useState<any[]>([]);
  const [liveEngagement, setLiveEngagement] = useState<any[]>([]);
  const [socialMentions, setSocialMentions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isMentionDialogOpen, setIsMentionDialogOpen] = useState(false);
  const [newMention, setNewMention] = useState({
    platform: "twitter",
    username: "",
    content: "",
    sentiment: "positive",
  });

  const { isConnected } = useLiveBroadcast({
    channels: ["admin", "marketing-stats", "social-mentions"],
    isAdmin: true,
    onMessage: (msg) => {
      if (msg.type === "engagement_update") {
        setLiveEngagement((prev) =>
          prev.map((eng) =>
            eng.module === msg.data.module ? { ...eng, ...msg.data } : eng,
          ),
        );
      } else if (msg.type === "social_mention") {
        setSocialMentions((prev) => [msg.data, ...prev].slice(0, 20));
        toast.info(`New mention from @${msg.data.username}`);
      }
    },
  });

  const fetchMarketingStats = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const { data: statsData, error: statsError } = await supabase.rpc(
          "get_marketing_stats",
          {
            p_time_range_start: getTimeRangeDate(),
            p_time_range_end: new Date().toISOString(),
          },
        );
        if (statsError) throw statsError;
        setStats(statsData);

        const { data: historyData } = await supabase.rpc(
          "get_engagement_history",
          {
            p_hours_back: 24,
          },
        );
        if (historyData) setEngagementHistory(historyData);

        const { data: liveData } = await supabase.rpc(
          "get_live_engagement_stats",
        );
        if (liveData) setLiveEngagement(liveData);

        const { data: mentionsData } = await supabase
          .from("social_mentions")
          .select("*")
          .order("posted_at", { ascending: false })
          .limit(20);
        if (mentionsData) setSocialMentions(mentionsData);

        const { data: ordersData } = await supabase
          .from("orders")
          .select("id, order_number, total_amount, created_at, customer_name")
          .order("created_at", { ascending: false })
          .limit(10);
        if (ordersData) {
          setRecentActivity(
            ordersData.map((order: any) => ({
              id: order.id,
              type: "order",
              description: `Order #${order.order_number}`,
              customer: order.customer_name,
              amount: order.total_amount,
              time: order.created_at,
              icon: <ShoppingBag className="h-4 w-4" />,
            })),
          );
        }

        // Also fetch recent spin winners for activity
        const { data: spinWinners } = await supabase
          .from("spin_attempts")
          .select("*, profiles(full_name)")
          .eq("prize_type", "product")
          .not("prize_value", "is", null)
          .order("created_at", { ascending: false })
          .limit(5);

        if (spinWinners && spinWinners.length > 0) {
          const winnerActivities = spinWinners.map((winner: any) => ({
            id: winner.id,
            type: "spin_winner",
            description: `${winner.profiles?.full_name || "Someone"} won ${winner.prize_value}`,
            customer: winner.profiles?.full_name,
            time: winner.created_at,
            icon: <Trophy className="h-4 w-4 text-yellow-500" />,
          }));
          setRecentActivity((prev) =>
            [...winnerActivities, ...prev].slice(0, 15),
          );
        }

        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching marketing stats:", error);
        toast.error("Failed to fetch marketing stats");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase, timeRange],
  );

  const getTimeRangeDate = () => {
    const date = new Date();
    switch (timeRange) {
      case "hour":
        date.setHours(date.getHours() - 1);
        break;
      case "day":
        date.setDate(date.getDate() - 1);
        break;
      case "week":
        date.setDate(date.getDate() - 7);
        break;
      case "month":
        date.setMonth(date.getMonth() - 1);
        break;
    }
    return date.toISOString();
  };

  const addSocialMention = async () => {
    const { error } = await supabase.rpc("add_social_mention", {
      p_platform: newMention.platform,
      p_username: newMention.username,
      p_content: newMention.content,
      p_sentiment: newMention.sentiment,
      p_posted_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Failed to add mention");
    } else {
      toast.success("Social mention added");
      setIsMentionDialogOpen(false);
      setNewMention({
        platform: "twitter",
        username: "",
        content: "",
        sentiment: "positive",
      });
      await fetchMarketingStats(true);
    }
  };

  useEffect(() => {
    if (profile?.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchMarketingStats();
    const interval = setInterval(() => fetchMarketingStats(true), 30000);
    return () => clearInterval(interval);
  }, [profile, timeRange]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "negative":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "tiktok":
        return <Mic className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
          <p className="text-muted-foreground">
            Loading marketing dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Marketing Command Center</h1>
            {isConnected && (
              <Badge variant="default" className="bg-green-500">
                <Radio className="h-3 w-3 mr-1 animate-pulse" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Real-time analytics for customer engagement campaigns and social
            media performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog
            open={isMentionDialogOpen}
            onOpenChange={setIsMentionDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Add Mention
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Social Mention</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Platform</Label>
                  <select
                    className="w-full rounded-md border p-2"
                    value={newMention.platform}
                    onChange={(e) =>
                      setNewMention({ ...newMention, platform: e.target.value })
                    }
                  >
                    <option value="twitter">Twitter/X</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div>
                  <Label>Username</Label>
                  <Input
                    value={newMention.username}
                    onChange={(e) =>
                      setNewMention({ ...newMention, username: e.target.value })
                    }
                    placeholder="@username"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <textarea
                    className="w-full rounded-md border p-2 min-h-[100px]"
                    value={newMention.content}
                    onChange={(e) =>
                      setNewMention({ ...newMention, content: e.target.value })
                    }
                    placeholder="What are people saying?"
                  />
                </div>
                <div>
                  <Label>Sentiment</Label>
                  <select
                    className="w-full rounded-md border p-2"
                    value={newMention.sentiment}
                    onChange={(e) =>
                      setNewMention({
                        ...newMention,
                        sentiment: e.target.value,
                      })
                    }
                  >
                    <option value="positive">Positive 😊</option>
                    <option value="neutral">Neutral 😐</option>
                    <option value="negative">Negative 😞</option>
                  </select>
                </div>
                <Button onClick={addSocialMention} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Add Mention
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last updated</p>
            <p className="text-sm font-medium">
              {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMarketingStats()}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {["hour", "day", "week", "month"].map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range as any)}
            className="capitalize"
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Live Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {liveEngagement.map((eng) => (
          <Card key={eng.module} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{eng.module}</h3>
                <Badge variant="secondary" className="text-xs">
                  {eng.interactions_per_minute}/min
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-xl font-bold">{eng.active_users}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <Share2 className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <p className="text-xl font-bold">{eng.social_shares}</p>
                  <p className="text-xs text-muted-foreground">Shares</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <Eye className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                  <p className="text-xl font-bold">{eng.live_viewers}</p>
                  <p className="text-xs text-muted-foreground">Viewers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        (stats?.bundles?.revenue || 0) +
                          (stats?.deals?.revenue || 0),
                        "KES",
                      )}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Total Engagements
                    </p>
                    <p className="text-2xl font-bold">
                      {(
                        (stats?.spins?.total_spins || 0) +
                        (stats?.challenges?.completed || 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  {stats?.spins?.today_spins || 0} spins today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Active Campaigns
                    </p>
                    <p className="text-2xl font-bold">
                      {(stats?.bundles?.active || 0) +
                        (stats?.spins?.active_games || 0) +
                        (stats?.challenges?.active || 0) +
                        (stats?.draws?.active || 0) +
                        (stats?.deals?.active || 0)}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  {stats?.deals?.expiring_soon || 0} deals expiring soon
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-amber-600 font-medium">
                      Loyalty Points
                    </p>
                    <p className="text-2xl font-bold">
                      {stats?.loyalty?.total_points?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Coins className="h-8 w-8 text-amber-500 opacity-50" />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Progress
                    value={
                      ((stats?.loyalty?.points_redeemed || 0) /
                        (stats?.loyalty?.total_points || 1)) *
                      100
                    }
                    className="h-1 flex-1"
                  />
                  <span className="text-muted-foreground">
                    {Math.round(
                      ((stats?.loyalty?.points_redeemed || 0) /
                        (stats?.loyalty?.total_points || 1)) *
                        100,
                    )}
                    % redeemed
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Trends (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="spins"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Spins"
                    />
                    <Area
                      type="monotone"
                      dataKey="purchases"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Purchases"
                    />
                    <Area
                      type="monotone"
                      dataKey="shares"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                      name="Shares"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Module Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/marketing/bundles" className="group">
              <Card className="hover:shadow-lg transition-all hover:border-purple-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Gift className="h-5 w-5 text-purple-600" />
                    </div>
                    <Badge variant="outline">
                      {stats?.bundles?.active || 0} Active
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">Mystery Bundles</CardTitle>
                  <CardDescription>
                    {stats?.bundles?.purchases || 0} purchases •{" "}
                    {formatCurrency(stats?.bundles?.revenue || 0, "KES")}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/marketing/spin" className="group">
              <Card className="hover:shadow-lg transition-all hover:border-green-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                      <RefreshCw className="h-5 w-5 text-green-600" />
                    </div>
                    <Badge variant="outline">
                      {stats?.spins?.today_spins || 0} Today
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">Spin Games</CardTitle>
                  <CardDescription>
                    {stats?.spins?.total_spins?.toLocaleString() || 0} spins •{" "}
                    {stats?.spins?.active_games || 0} active
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/marketing/challenges" className="group">
              <Card className="hover:shadow-lg transition-all hover:border-orange-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Trophy className="h-5 w-5 text-orange-600" />
                    </div>
                    <Badge variant="outline">
                      {stats?.challenges?.active || 0} Active
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">Challenges</CardTitle>
                  <CardDescription>
                    {stats?.challenges?.completed || 0} completed •{" "}
                    {stats?.challenges?.referrals?.total || 0} referrals
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/marketing/draws" className="group">
              <Card className="hover:shadow-lg transition-all hover:border-blue-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Ticket className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="outline">
                      {stats?.draws?.active || 0} Active
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">Lucky Draws</CardTitle>
                  <CardDescription>
                    {stats?.draws?.entries?.toLocaleString() || 0} entries •{" "}
                    {stats?.draws?.winners || 0} winners
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/marketing/deals" className="group">
              <Card className="hover:shadow-lg transition-all hover:border-red-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Flame className="h-5 w-5 text-red-600" />
                    </div>
                    {stats?.deals?.expiring_soon ? (
                      <Badge variant="destructive">
                        {stats.deals.expiring_soon} Expiring
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="mt-3">Flash Deals</CardTitle>
                  <CardDescription>
                    {stats?.deals?.units_sold || 0} units •{" "}
                    {formatCurrency(stats?.deals?.revenue || 0, "KES")}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/marketing/points" className="group">
              <Card className="hover:shadow-lg transition-all hover:border-amber-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-amber-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Coins className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <CardTitle className="mt-3">Points Economy</CardTitle>
                  <CardDescription>
                    {stats?.loyalty?.total_points?.toLocaleString() || 0} points
                    in circulation
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Track the success of your marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Flash Sale - Electronics",
                    impressions: 15420,
                    clicks: 3420,
                    conversions: 892,
                    revenue: 445000,
                  },
                  {
                    name: "Weekend Spin Challenge",
                    impressions: 8900,
                    clicks: 5670,
                    conversions: 234,
                    revenue: 117000,
                  },
                  {
                    name: "Referral Program Launch",
                    impressions: 5600,
                    clicks: 2100,
                    conversions: 445,
                    revenue: 222500,
                  },
                ].map((camp, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{camp.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Last 30 days
                        </p>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        Active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Impressions
                        </p>
                        <p className="text-xl font-bold">
                          {camp.impressions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Clicks</p>
                        <p className="text-xl font-bold">
                          {camp.clicks.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Conversions
                        </p>
                        <p className="text-xl font-bold">{camp.conversions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(camp.revenue, "KES")}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={(camp.conversions / camp.clicks) * 100}
                      className="h-1 mt-3"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Customer Referrals
                </CardTitle>
                <CardDescription>
                  Customers referring friends to your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.referrals?.user_referrals?.completed || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats?.referrals?.user_referrals?.pending || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Top Referrers</p>
                  {stats?.referrals?.user_referrals?.top_referrers &&
                  stats?.referrals?.user_referrals?.top_referrers?.length >
                    0 ? (
                    stats.referrals.user_referrals.top_referrers.map(
                      (referrer, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold">
                              #{i + 1}
                            </div>
                            <span className="text-sm font-medium">
                              User {referrer.user_id?.slice(0, 8)}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span>{referrer.referrals_count} referrals</span>
                            <span className="text-amber-600">
                              {referrer.points_earned} points
                            </span>
                          </div>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No referrals yet
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/admin/marketing/referrals">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Referral Program
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-blue-500" />
                  Traffic Sources
                </CardTitle>
                <CardDescription>
                  Where your visitors are coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.referrals?.traffic_sources || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="clicks"
                        label={({ payload, percent }) =>
                          `${payload} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                      >
                        {(stats?.referrals?.traffic_sources || []).map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats?.referrals?.traffic_sources?.map((source, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {source.source}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {source.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {source.clicks.toLocaleString()} clicks
                        </p>
                        <p className="text-xs text-green-600">
                          {source.conversion_rate}% conv.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Mentions Tab - NEW */}
        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sentiment Overview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Social Sentiment
                </CardTitle>
                <CardDescription>
                  Brand mentions across platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold mb-2">
                    {socialMentions.length > 0
                      ? Math.round(
                          (socialMentions.filter(
                            (m) => m.sentiment === "positive",
                          ).length /
                            socialMentions.length) *
                            100,
                        )
                      : 0}
                    %
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Positive Sentiment
                  </Badge>
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />{" "}
                        Positive
                      </span>
                      <span className="font-bold">
                        {
                          socialMentions.filter(
                            (m) => m.sentiment === "positive",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />{" "}
                        Neutral
                      </span>
                      <span className="font-bold">
                        {
                          socialMentions.filter(
                            (m) => m.sentiment === "neutral",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" /> Negative
                      </span>
                      <span className="font-bold">
                        {
                          socialMentions.filter(
                            (m) => m.sentiment === "negative",
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Mentions List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Social Mentions</CardTitle>
                <CardDescription>
                  Real-time monitoring from social platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {socialMentions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No social mentions detected yet</p>
                      <p className="text-sm">
                        Click "Add Mention" to manually add one
                      </p>
                    </div>
                  ) : (
                    socialMentions.map((mention, i) => (
                      <div
                        key={mention.id || i}
                        className="flex gap-3 p-3 border rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {getPlatformIcon(mention.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              @{mention.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(
                                  mention.posted_at || mention.timestamp,
                                ),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </span>
                            {getSentimentIcon(mention.sentiment)}
                          </div>
                          <p className="text-sm line-clamp-2">
                            {mention.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab - NEW with recentActivity */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest customer interactions and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="p-2 bg-muted rounded-full">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.customer && `By ${activity.customer} • `}
                          {formatDistanceToNow(new Date(activity.time), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {activity.amount && (
                        <Badge variant="outline">
                          {formatCurrency(activity.amount, "KES")}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
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
              <span className="text-xs">New Spin</span>
            </Button>
          </Link>
          <Link href="/admin/marketing/challenges?create=true">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs">Challenge</span>
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
          <Link href="/admin/marketing/live">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <MonitorPlay className="h-5 w-5" />
              <span className="text-xs">Live Control</span>
            </Button>
          </Link>
          <Link href="/admin/marketing/points">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Settings2 className="h-5 w-5" />
              <span className="text-xs">Points</span>
            </Button>
          </Link>
          <Link href="/admin/marketing/rewards?create=true">
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex flex-col items-center gap-2"
            >
              <Award className="h-5 w-5" />
              <span className="text-xs">Reward</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
