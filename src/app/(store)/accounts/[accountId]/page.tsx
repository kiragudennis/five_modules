// app/accounts/[accountId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  ShoppingBag,
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Save,
  X,
  Shield,
  Bell,
  Globe,
  Tag,
  Crown,
  Wrench,
  LogOut,
  Trophy,
  Target,
  RefreshCw,
  Gift,
  Sparkles,
  Coins,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { EngagementSummary, Order } from "@/types/customer";

export default function AccountPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { supabase, profile: currentUser, signOut } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const showTab = searchParams.get("tab") || "overview";

  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [engagement, setEngagement] = useState<EngagementSummary | null>(null);

  const isOwnProfile =
    currentUser?.id === accountId || currentUser?.role === "admin";

  useEffect(() => {
    if (!currentUser || !accountId) {
      router.push("/login");
      return;
    }

    fetchAccountData();
  }, [accountId, supabase, currentUser]);

  const fetchAccountData = async () => {
    try {
      setLoading(true);

      if (currentUser?.id === accountId) {
        setProfile(currentUser);
        setFormData(currentUser);
      } else {
        // Fetch user profile for other users (admin view)
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", accountId)
          .single();

        if (userError) throw userError;
        setProfile(userData);
        setFormData(userData);
      }

      // ALWAYS fetch orders and stats regardless of who's viewing
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
        *,
        order_items (
          product_id,
          quantity,
          unit_price,
          product_name,
          product_image
        )
      `,
        )
        .eq("user_id", accountId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const totalSpent =
        ordersData?.reduce(
          (sum: number, order: Order) => sum + (order.total_amount || 0),
          0,
        ) || 0;
      const pendingOrders =
        ordersData?.filter(
          (o: Order) => o.status === "pending" || o.status === "processing",
        ).length || 0;
      const completedOrders =
        ordersData?.filter(
          (o: Order) => o.status === "completed" || o.status === "delivered",
        ).length || 0;

      setStats({
        total_orders: totalOrders,
        total_spent: totalSpent,
        pending_orders: pendingOrders,
        completed_orders: completedOrders,
        average_order_value: totalOrders > 0 ? totalSpent / totalOrders : 0,
      });

      // Fetch engagement summary
      const { data: engagementData, error: engagementError } =
        await supabase.rpc("get_user_engagement_summary", {
          p_user_id: accountId,
        });

      console.log(
        "Engagement Data:",
        engagementData,
        "Error:",
        engagementError,
      );

      if (engagementError) throw engagementError;

      if (engagementData?.success) {
        setEngagement(engagementData);
      }
    } catch (error: any) {
      console.error("Error fetching account data:", error);
      toast.error("Could not load account information");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("users")
        .update({
          ...formData,
        })
        .eq("id", accountId);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setEditing(false);
      fetchAccountData(); // Refresh data
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(profile);
    setEditing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      pending: { variant: "outline", label: "Pending" },
      processing: { variant: "secondary", label: "Processing" },
      shipped: { variant: "default", label: "Shipped" },
      delivered: { variant: "default", label: "Delivered" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const config = statusConfig[status] || {
      variant: "outline",
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      pending: { variant: "outline", label: "Pending" },
      processing: { variant: "secondary", label: "Processing" },
      completed: { variant: "default", label: "Paid" },
      failed: { variant: "destructive", label: "Failed" },
      refunded: { variant: "secondary", label: "Refunded" },
    };

    const config = statusConfig[status] || {
      variant: "outline",
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-2 py-8">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-2 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Profile not found</h3>
              <p className="text-muted-foreground mb-6">
                The user profile you're looking for doesn't exist or you don't
                have permission to view it.
              </p>
              <Button onClick={() => router.push("/")}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center md:items-center gap-4 mb-8">
          <div className="flex items-center w-full gap-4">
            <h1 className="text-3xl font-bold mb-2 truncate">
              Customer Profile
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant={profile.role === "admin" ? "default" : "secondary"}
              >
                {profile.role}
              </Badge>
              {profile.email_verified && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {engagement?.user_tier && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  {engagement.user_tier}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex justify-between sm:justify-end w-full gap-4">
            {isOwnProfile && !editing && (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            <Button
              variant={"destructive"}
              onClick={() => {
                signOut();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue={showTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 sm:gap-2 gap-6">
              <Card>
                <CardContent className="sm:pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Orders
                      </p>
                      <p className="text-2xl font-bold">
                        {stats?.total_orders || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="sm:pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Spent
                      </p>
                      <p className="text-xl font-bold">
                        KES {(stats?.total_spent || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="sm:pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Pending Orders
                      </p>
                      <p className="text-2xl font-bold">
                        {stats?.pending_orders || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="sm:pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Completed Orders
                      </p>
                      <p className="text-2xl font-bold">
                        {stats?.completed_orders || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="sm:pt-6 relative">
                  <Link
                    href={`/accounts/${accountId}/loyalty`}
                    className="absolute top-[-2] right-2 text-xs text-primary hover:underline"
                  >
                    View My Points
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Loyalty Points
                      </p>
                      <p className="text-2xl font-bold">
                        {engagement?.loyalty_points?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NEW: Engagement Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your Rewards & Activities
                </CardTitle>
                <CardDescription>
                  Special offers, challenges, and games waiting for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Mistry Bundles */}
                  <Link href={`/accounts/${accountId}/bundles`}>
                    <div className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Gift className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold">Mystery Bundles</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Special discounted bundles just for you
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {engagement?.bundle_count || 0} bundles available
                        </Badge>
                        {engagement?.user_tier && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            {engagement.user_tier}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Spin Game */}
                  <Link href={`/accounts/${accountId}/spin`}>
                    <div className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <RefreshCw className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold">Daily Spin</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Spin daily to win points & discounts
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {engagement?.spins_today || 0}/
                          {engagement?.spin_game?.free_spins_per_day || 1} used
                          today
                        </Badge>
                        {engagement?.spin_game?.points_per_spin && (
                          <span className="text-xs text-muted-foreground">
                            <Coins className="h-3 w-3 inline mr-1" />
                            {engagement.spin_game.points_per_spin} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Challenges */}
                  <Link href={`/accounts/${accountId}/challenges`}>
                    <div className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Target className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="font-semibold">Challenges</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Complete challenges & earn rewards
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {engagement?.active_challenges || 0} active challenges
                      </Badge>
                    </div>
                  </Link>

                  {/* Rewards */}
                  <Link href={`/accounts/${accountId}/rewards`}>
                    <div className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Trophy className="h-5 w-5 text-amber-600" />
                        </div>
                        <h3 className="font-semibold">Rewards</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Anniversary & milestone rewards
                      </p>
                      {engagement?.birthday_reward_available && (
                        <Badge
                          variant="default"
                          className="text-xs bg-amber-500"
                        >
                          Birthday reward available!
                        </Badge>
                      )}
                      {!engagement?.birthday_reward_available &&
                        engagement?.anniversary_days && (
                          <Badge variant="outline" className="text-xs">
                            {engagement.anniversary_days} days with us
                          </Badge>
                        )}
                    </div>
                  </Link>
                </div>

                {/* Featured Bundles Preview */}
                {engagement?.available_bundles &&
                  engagement.available_bundles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">
                        Featured Bundles
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {engagement.available_bundles
                          .slice(0, 3)
                          .map((bundle) => (
                            <Link
                              key={bundle.id}
                              href={`/products?bundle=${bundle.slug}`}
                              className="block"
                            >
                              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                {bundle.image_url && (
                                  <img
                                    src={bundle.image_url}
                                    alt={bundle.name}
                                    className="h-12 w-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {bundle.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {bundle.discount_type === "percentage"
                                      ? `${bundle.discount_value}% off`
                                      : `KES ${bundle.discount_value} off`}
                                    {bundle.points_required > 0 && (
                                      <span className="ml-2 inline-flex items-center">
                                        <Coins className="h-3 w-3 mr-1" />
                                        {bundle.points_required}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Recent Spin Wins */}
            {engagement?.recent_spin_results &&
              engagement.recent_spin_results.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Recent Spin Wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {engagement?.recent_spin_results
                        .slice(0, 3)
                        .map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {result.prize_type === "points" && (
                                <Coins className="h-4 w-4 text-green-600" />
                              )}
                              {result.prize_type === "discount" && (
                                <Ticket className="h-4 w-4 text-blue-600" />
                              )}
                              {result.prize_type === "coupon" && (
                                <Tag className="h-4 w-4 text-purple-600" />
                              )}
                              <div>
                                <p className="font-medium capitalize">
                                  {result.prize_type}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {result.prize_type === "points" &&
                                    `${result.loyalty_points_awarded} pts`}
                                  {result.prize_type === "discount" &&
                                    result.prize_value}
                                  {result.prize_type === "coupon" &&
                                    `Code: ${result.coupon?.code}`}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(result.created_at),
                                    "MMM d, h:mm a",
                                  )}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                result.is_claimed ? "default" : "outline"
                              }
                            >
                              {result.is_claimed ? "Claimed" : "Available"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="link"
                      className="mt-4 w-full"
                      onClick={() => router.push(`/accounts/${accountId}/spin`)}
                    >
                      View All Spins
                    </Button>
                  </CardContent>
                </Card>
              )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                full_name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, city: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal_code">Postal Code</Label>
                          <Input
                            id="postal_code"
                            value={formData.postal_code || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                postal_code: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                country: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-semibold">
                            {profile.full_name || "Not provided"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Full Name
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-semibold">{profile.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Email Address
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-semibold">
                            {profile.phone || "Not provided"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Phone Number
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-semibold">
                            {profile.address || "Not provided"}
                            {profile.city && `, ${profile.city}`}
                            {profile.postal_code && `, ${profile.postal_code}`}
                            {profile.country && `, ${profile.country}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Address
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Member Since
                    </p>
                    <p className="font-semibold">
                      {format(new Date(profile.created_at), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-semibold">
                      {profile.last_login
                        ? format(
                            new Date(profile.last_login),
                            "MMM d, yyyy HH:mm",
                          )
                        : "Never logged in"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Account Status
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {profile.email_verified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="font-semibold text-amber-600">
                            Not Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Separator />
                  {profile.business_name && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          Business Name
                        </p>
                        <p className="font-semibold">{profile.business_name}</p>
                      </div>
                      {profile.business_type && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Business Type
                            </p>
                            <p className="font-semibold">
                              {profile.business_type}
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order History
                  </div>
                  <div>
                    <Link href={`/accounts/${profile.id}/loyalty`} passHref>
                      <Button variant="outline" size="sm">
                        View My Points
                      </Button>
                    </Link>
                  </div>
                </CardTitle>
                <CardDescription>{orders.length} total orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders found</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/products")}
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => {
                      const orderItems = order.order_items || [];
                      const itemsCount = orderItems.length; // Number of distinct products
                      const unitsCount = orderItems.reduce(
                        (sum: number, item: any) => sum + (item.quantity || 0),
                        0,
                      ); // Total quantity of all items

                      return (
                        <Card key={order.id} className="overflow-hidden">
                          <CardContent>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">
                                    Order #{order.order_number}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(order.created_at),
                                    "MMMM d, yyyy 'at' h:mm a",
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                {getStatusBadge(order.status)}
                                {getPaymentStatusBadge(order.payment_status)}
                                <span className="font-bold text-lg">
                                  KES {order.total_amount.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <Separator className="mb-4" />

                            {/* Order Items Preview */}
                            {orderItems.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-medium mb-2">
                                  Order Items:
                                </p>
                                <div className="space-y-2">
                                  {orderItems
                                    .slice(0, 2)
                                    .map((item: any, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-3 p-2 bg-muted/50 rounded"
                                      >
                                        <img
                                          src={item.product_image}
                                          className="h-8 w-8"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">
                                            {item.product_name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Qty: {item.quantity} × KES{" "}
                                            {item.unit_price?.toLocaleString()}
                                          </p>
                                        </div>
                                        <div className="font-semibold">
                                          KES{" "}
                                          {(
                                            item.quantity * item.unit_price
                                          )?.toLocaleString()}
                                        </div>
                                      </div>
                                    ))}

                                  {orderItems.length > 2 && (
                                    <p className="text-sm text-muted-foreground text-center pt-2">
                                      + {orderItems.length - 2} more item
                                      {orderItems.length - 2 > 1 ? "s" : ""}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">
                                  Payment Method
                                </p>
                                <p className="font-medium capitalize">
                                  {order.payment_method}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Shipping Method
                                </p>
                                <p className="font-medium capitalize">
                                  {order.shipping_method}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Products
                                </p>
                                <div className="space-y-1">
                                  <p className="flex items-center font-medium">
                                    {itemsCount} item
                                    {itemsCount !== 1 ? "s" : ""} (
                                    <span className="text-xs text-muted-foreground">
                                      {unitsCount} unit
                                      {unitsCount !== 1 ? "s" : ""} total
                                    </span>
                                    )
                                  </p>
                                </div>
                              </div>
                              <div className="text-right md:text-left space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/tracking/${order.tracking_number}`,
                                    )
                                  }
                                  disabled={!order.tracking_number}
                                >
                                  Track Order
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/checkout/success?orderId=${order.id}`,
                                    )
                                  }
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>

                            {/* Installation Service (if applicable) */}
                            {order.installation_required &&
                              order.installation_service && (
                                <div className="mt-4 pt-4 border-t">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Wrench className="h-4 w-4 text-blue-600" />
                                    <p className="text-sm font-medium text-blue-700">
                                      Includes Installation:
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      {order.installation_service.name}
                                    </span>
                                    <span className="font-semibold">
                                      KES{" "}
                                      {order.installation_cost?.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              )}

                            {/* Loyalty Points (if applicable) */}
                            {(order.loyalty_points_earned > 0 ||
                              order.loyalty_discount > 0) && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                  <Crown className="h-4 w-4 text-amber-600" />
                                  <p className="text-sm font-medium text-amber-700">
                                    Loyalty Points:
                                  </p>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  {order.loyalty_points_earned > 0 && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Earned
                                      </span>
                                      <span className="ml-2 font-semibold text-green-600">
                                        +{order.loyalty_points_earned} pts
                                      </span>
                                    </div>
                                  )}
                                  {order.loyalty_discount > 0 && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Discount Applied
                                      </span>
                                      <span className="ml-2 font-semibold text-green-600">
                                        -KES{" "}
                                        {order.loyalty_discount.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Coupon Applied (if applicable) */}
                            {order.coupon_discount > 0 && order.coupon_code && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                  <Tag className="h-4 w-4 text-green-600" />
                                  <p className="text-sm font-medium text-green-700">
                                    Coupon Applied:
                                  </p>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Code:
                                    </span>
                                    <code className="ml-2 font-mono bg-green-100 px-2 py-1 rounded text-green-800">
                                      {order.coupon_code}
                                    </code>
                                  </div>
                                  <span className="font-semibold text-green-600">
                                    -KES{" "}
                                    {order.coupon_discount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {editing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label
                          htmlFor="receive_offers"
                          className="font-semibold"
                        >
                          Special Offers & Promotions
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails about special offers and promotions
                        </p>
                      </div>
                      <Switch
                        id="receive_offers"
                        checked={formData.receive_offers}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, receive_offers: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label
                          htmlFor="receive_newsletter"
                          className="font-semibold"
                        >
                          Newsletter
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive our monthly newsletter with tips and updates
                        </p>
                      </div>
                      <Switch
                        id="receive_newsletter"
                        checked={formData.receive_newsletter}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            receive_newsletter: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          Special Offers & Promotions
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Receive emails about special offers and promotions
                        </p>
                      </div>
                      <Badge
                        variant={profile.receive_offers ? "default" : "outline"}
                      >
                        {profile.receive_offers ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Newsletter</p>
                        <p className="text-sm text-muted-foreground">
                          Receive our monthly newsletter with tips and updates
                        </p>
                      </div>
                      <Badge
                        variant={
                          profile.receive_newsletter ? "default" : "outline"
                        }
                      >
                        {profile.receive_newsletter ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Preferred Currency</Label>
                      <Input
                        id="currency"
                        value={formData.currency || "KES"}
                        onChange={(e) =>
                          setFormData({ ...formData, currency: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Country</p>
                      <p className="font-semibold">
                        {profile.country || "Not specified"}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Preferred Currency
                      </p>
                      <p className="font-semibold">
                        {profile.currency || "KES"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Actions */}
        {editing && (
          <div className="fixed bottom-6 right-6 bg-background border rounded-lg shadow-lg p-4 flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
