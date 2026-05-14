// app/admin/marketing/referrals/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Gift,
  Copy,
  Check,
  Settings2,
  Trophy,
  TrendingUp,
  Search,
  Download,
  RefreshCw,
  UserPlus,
  Crown,
  Medal,
  Star,
  TrendingDown,
  Calendar,
  Mail,
  Share2,
  Filter,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  referred_user_id: string | null;
  referral_code: string;
  status: "pending" | "joined" | "completed" | "expired";
  reward_points: number;
  reward_tier: string | null;
  completed_at: string | null;
  created_at: string;
  referrer: {
    full_name: string;
    email: string;
  };
  referred: {
    full_name: string;
    email: string;
  } | null;
}

interface ReferralSettings {
  points_per_referral: number;
  bonus_points_for_first_referral: number;
  referrals_for_tier_upgrade: number;
  auto_approve_days: number;
  tier_upgrade: string | null;
}

export default function AdminReferralsPage() {
  const { supabase, profile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [settings, setSettings] = useState<ReferralSettings>({
    points_per_referral: 100,
    bonus_points_for_first_referral: 50,
    referrals_for_tier_upgrade: 5,
    auto_approve_days: 7,
    tier_upgrade: null,
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    joined: 0,
    expired: 0,
    pointsAwarded: 0,
    conversionRate: 0,
  });
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferrals();
    fetchSettings();
  }, []);

  // Filter referrals when search or filter changes
  useEffect(() => {
    let filtered = [...referrals];

    if (searchTerm) {
      filtered = filtered.filter(
        (ref) =>
          ref.referrer?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ref.referrer?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ref.referred_email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ref.referral_code?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ref) => ref.status === statusFilter);
    }

    if (dateRange.from) {
      filtered = filtered.filter(
        (ref) => new Date(ref.created_at) >= new Date(dateRange.from),
      );
    }
    if (dateRange.to) {
      filtered = filtered.filter(
        (ref) => new Date(ref.created_at) <= new Date(dateRange.to),
      );
    }

    setFilteredReferrals(filtered);
  }, [referrals, searchTerm, statusFilter, dateRange]);

  const fetchReferrals = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);

      const { data } = await supabase
        .from("referrals")
        .select(
          "*, referrer:referrer_id(full_name, email), referred:referred_user_id(full_name, email)",
        )
        .order("created_at", { ascending: false });

      setReferrals(data || []);

      const completed =
        data?.filter((r: Referral) => r.status === "completed") || [];
      const pending =
        data?.filter((r: Referral) => r.status === "pending") || [];
      const joined = data?.filter((r: Referral) => r.status === "joined") || [];
      const expired =
        data?.filter((r: Referral) => r.status === "expired") || [];

      setStats({
        total: data?.length || 0,
        completed: completed.length,
        pending: pending.length,
        joined: joined.length,
        expired: expired.length,
        pointsAwarded: completed.reduce(
          (sum, r) => sum + (r.reward_points || 0),
          0,
        ),
        conversionRate: data?.length
          ? (completed.length / data.length) * 100
          : 0,
      });

      setLoading(false);
      setRefreshing(false);
    },
    [supabase],
  );

  const fetchSettings = async () => {
    const { data, error } = await supabase.rpc("get_referral_settings");

    if (!error && data) {
      setSettings(data);
    }
  };

  const saveSettings = async () => {
    if (!profile?.id) return;

    setSaving(true);
    const { error } = await supabase.rpc("update_referral_settings", {
      p_settings: settings,
      p_updated_by: profile.id,
    });

    if (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } else {
      toast.success("Referral settings saved");
    }
    setSaving(false);
  };

  const exportReferrals = () => {
    const headers = [
      "Date",
      "Referrer",
      "Referred",
      "Status",
      "Points",
      "Code",
    ];
    const rows = filteredReferrals.map((ref) => [
      format(new Date(ref.created_at), "yyyy-MM-dd HH:mm"),
      ref.referrer?.full_name || ref.referrer?.email || "Unknown",
      ref.referred?.full_name || ref.referred_email || "Pending",
      ref.status,
      ref.reward_points,
      ref.referral_code,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Referrals exported");
  };

  const generateShareLink = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const code = `REF${data.user.id.slice(0, 8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setShareLink(`${window.location.origin}/?ref=${code}`);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-500 border-yellow-500"
          >
            Pending
          </Badge>
        );
      case "joined":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
            Joined
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-4 w-4 text-blue-500" />;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange({ from: "", to: "" });
  };

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || dateRange.from || dateRange.to;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            Referral Program
          </h1>
          <p className="text-muted-foreground">
            Track customer referrals, manage rewards, and analyze performance
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={generateShareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Referral Program</DialogTitle>
                <DialogDescription>
                  Share this link with customers to invite them to the referral
                  program
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 mt-4">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button onClick={copyShareLink}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Customers earn {settings.points_per_referral} points per
                successful referral
              </p>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => fetchReferrals()}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportReferrals}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <Check className="h-6 w-6 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Trophy className="h-6 w-6 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.joined}
                </p>
              </div>
              <UserPlus className="h-6 w-6 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Points Awarded</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.pointsAwarded.toLocaleString()}
                </p>
              </div>
              <Gift className="h-6 w-6 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Referrals List Tab */}
        <TabsContent value="referrals" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="joined">Joined</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="From"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                  className="w-full md:w-36"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                  className="w-full md:w-36"
                />
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referrals Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Referrals</CardTitle>
              <CardDescription>
                Showing {filteredReferrals.length} of {referrals.length}{" "}
                referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No referrals found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                ) : (
                  filteredReferrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {ref.referrer?.full_name ||
                              ref.referrer?.email?.split("@")[0] ||
                              "Unknown"}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span>
                            {ref.referred?.full_name ||
                              ref.referred?.email?.split("@")[0] ||
                              ref.referred_email?.split("@")[0] ||
                              "Pending"}
                          </span>
                          {getStatusBadge(ref.status)}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Code: {ref.referral_code}</span>
                          <span>
                            Date:{" "}
                            {format(new Date(ref.created_at), "MMM d, yyyy")}
                          </span>
                          {ref.completed_at && (
                            <span>
                              Completed:{" "}
                              {format(
                                new Date(ref.completed_at),
                                "MMM d, yyyy",
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 md:mt-0">
                        <span className="text-sm font-medium text-amber-600">
                          +{ref.reward_points} pts
                        </span>
                        {ref.reward_tier && (
                          <Badge variant="outline" className="capitalize">
                            {ref.reward_tier} upgrade
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Referral Reward Settings</CardTitle>
              <CardDescription>
                Configure how referrals are rewarded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Points per successful referral</Label>
                  <Input
                    type="number"
                    value={settings.points_per_referral}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        points_per_referral: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Customers earn this many points when their referral makes a
                    purchase
                  </p>
                </div>

                <div>
                  <Label>Bonus points for first referral</Label>
                  <Input
                    type="number"
                    value={settings.bonus_points_for_first_referral}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bonus_points_for_first_referral:
                          parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Extra points for a customer's first successful referral
                  </p>
                </div>

                <div>
                  <Label>Automatic Tier Upgrade</Label>
                  <select
                    className="w-full rounded-md border p-2 mt-1"
                    value={settings.tier_upgrade || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        tier_upgrade: e.target.value || null,
                      })
                    }
                  >
                    <option value="">No tier upgrade</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically upgrade referrer's loyalty tier
                  </p>
                </div>

                <div>
                  <Label>Referrals needed for tier upgrade</Label>
                  <Input
                    type="number"
                    value={settings.referrals_for_tier_upgrade}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        referrals_for_tier_upgrade:
                          parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Auto-approve after days</Label>
                  <Input
                    type="number"
                    value={settings.auto_approve_days}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        auto_approve_days: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically mark pending referrals as completed after this
                    many days
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={saveSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Referral Funnel</CardTitle>
                <CardDescription>
                  Conversion stages from invite to purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Invited</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Joined</span>
                      <span className="font-medium">{stats.joined}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{
                          width: `${(stats.joined / (stats.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((stats.joined / (stats.total || 1)) * 100).toFixed(1)}%
                      conversion rate
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completed Purchase</span>
                      <span className="font-medium">{stats.completed}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${(stats.completed / (stats.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((stats.completed / (stats.total || 1)) * 100).toFixed(
                        1,
                      )}
                      % overall conversion
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Customers who refer the most</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {referrals
                    .reduce(
                      (acc, ref) => {
                        const existing = acc.find(
                          (r) => r.referrer_id === ref.referrer_id,
                        );
                        if (existing) {
                          existing.count++;
                          existing.points += ref.reward_points;
                        } else if (ref.referrer_id) {
                          acc.push({
                            referrer_id: ref.referrer_id,
                            name:
                              ref.referrer?.full_name ||
                              ref.referrer?.email?.split("@")[0],
                            count: 1,
                            points: ref.reward_points,
                          });
                        }
                        return acc;
                      },
                      [] as Array<{
                        referrer_id: string;
                        name: string;
                        count: number;
                        points: number;
                      }>,
                    )
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((referrer, i) => (
                      <div
                        key={referrer.referrer_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900">
                            {getRankIcon(i)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {referrer.name ||
                                `User ${referrer.referrer_id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {referrer.count} referrals
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-amber-600">
                            +{referrer.points} pts
                          </p>
                          <p className="text-xs text-muted-foreground">
                            earned
                          </p>
                        </div>
                      </div>
                    ))}
                  {referrals.filter((r) => r.referrer_id).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No referrers yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Referral activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const month = new Date();
                    month.setMonth(month.getMonth() - i);
                    const monthReferrals = referrals.filter(
                      (r) =>
                        new Date(r.created_at).getMonth() ===
                          month.getMonth() &&
                        new Date(r.created_at).getFullYear() ===
                          month.getFullYear(),
                    );
                    const monthCompleted = monthReferrals.filter(
                      (r) => r.status === "completed",
                    );

                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium">
                          {format(month, "MMM yyyy")}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{
                                    width: `${(monthReferrals.length / (stats.total || 1)) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium w-16 text-right">
                              {monthReferrals.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{
                                    width: `${(monthCompleted.length / (stats.total || 1)) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground w-16 text-right">
                              {monthCompleted.length} completed
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
