// app/admin/customers/[userId]/loyalty/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Award,
  Gift,
  TrendingUp,
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  Wallet,
  History,
  Send,
  Plus,
  Minus,
  Filter,
  Download,
  Copy,
  Sparkles,
  Shield,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { format } from "date-fns";

interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  metadata: any;
}

interface LoyaltyPoints {
  points: number;
  points_earned: number;
  points_redeemed: number;
  tier: string;
  last_updated: string;
}

interface LoyaltyTransaction {
  id: string;
  points_change: number;
  current_points: number;
  transaction_type:
    | "earned"
    | "redeemed"
    | "expired"
    | "adjusted"
    | "signup_bonus"
    | "refunded";
  description: string;
  created_at: string;
  metadata: any;
  order_id?: string;
}

interface TierInfo {
  tier: string;
  min_points: number;
  points_per_shilling: number;
  discount_percentage: number;
  free_shipping_threshold: number;
  priority_support: boolean;
  birthday_bonus_points: number;
}

export default function CustomerLoyaltyPage() {
  const params = useParams();
  const router = useRouter();
  const { supabase } = useAuth();

  const userId = params.userId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints | null>(
    null,
  );
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">(
    "add",
  );
  const [adjustmentPoints, setAdjustmentPoints] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (userId) {
      fetchCustomerData();
    }
  }, [userId, supabase, currentPage, transactionFilter]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Fetch customer info
      const { data: customerData, error: customerError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch loyalty points
      const { data: pointsData, error: pointsError } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (pointsError && pointsError.code !== "PGRST116") {
        // PGRST116 means no rows returned (user doesn't have loyalty record yet)
        throw pointsError;
      }
      setLoyaltyPoints(pointsData);

      // Fetch loyalty tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .order("min_points", { ascending: true });

      if (tiersError) throw tiersError;
      setTiers(tiersData);

      // Fetch transactions with filtering
      let transactionQuery = supabase
        .from("loyalty_transactions")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (transactionFilter !== "all") {
        transactionQuery = transactionQuery.eq(
          "transaction_type",
          transactionFilter,
        );
      }

      const {
        data: transactionsData,
        error: transactionsError,
        count,
      } = await transactionQuery.range(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage - 1,
      );

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
      setTotalTransactions(count || 0);
    } catch (error: any) {
      console.error("Error fetching customer data:", error);
      toast.error("Failed to load customer loyalty data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPoints = async () => {
    try {
      const points = parseInt(adjustmentPoints);
      if (!points || points <= 0) {
        toast.error("Please enter a valid number of points");
        return;
      }

      if (!adjustmentReason.trim()) {
        toast.error("Please provide a reason for the adjustment");
        return;
      }

      const finalPoints = adjustmentType === "add" ? points : -points;
      const description =
        adjustmentType === "add"
          ? `Manual addition: ${adjustmentReason}`
          : `Manual deduction: ${adjustmentReason}`;

      // Call RPC function to adjust points
      const { data, error } = await supabase.rpc("adjust_loyalty_points", {
        p_user_id: userId,
        p_points: finalPoints,
        p_description: description,
        p_admin_id: (await supabase.auth.getUser()).data.user?.id,
        p_notify_customer: sendNotification,
      });

      if (error) throw error;

      toast.success(
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          <span>
            {adjustmentType === "add" ? "Added" : "Deducted"} {points} points{" "}
            {adjustmentType === "add" ? "to" : "from"} customer
          </span>
        </div>,
      );

      // Reset form and refresh data
      setAdjustmentPoints("");
      setAdjustmentReason("");
      setShowAdjustDialog(false);
      fetchCustomerData();

      // Send email notification if requested
      if (sendNotification && customer) {
        await sendPointsNotification(customer, finalPoints, description);
      }
    } catch (error: any) {
      console.error("Error adjusting points:", error);
      toast.error("Failed to adjust points");
    }
  };

  const sendPointsNotification = async (
    customer: Customer,
    points: number,
    reason: string,
  ) => {
    try {
      const response = await fetch("/api/email/points-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customer.email,
          name: customer.full_name || "Valued Customer",
          points: Math.abs(points),
          isAddition: points > 0,
          reason,
          currentBalance: (loyaltyPoints?.points || 0) + points,
          tier: loyaltyPoints?.tier,
        }),
      });

      if (!response.ok) throw new Error("Failed to send notification");

      toast.success("Notification email sent to customer");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification email");
    }
  };

  const handleUpdateTier = async (newTier: string) => {
    try {
      const { error } = await supabase
        .from("loyalty_points")
        .update({ tier: newTier })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(`Customer tier updated to ${newTier}`);
      fetchCustomerData();

      // Send tier update notification
      if (customer) {
        await sendTierUpdateNotification(customer, newTier);
      }
    } catch (error) {
      console.error("Error updating tier:", error);
      toast.error("Failed to update tier");
    }
  };

  const sendTierUpdateNotification = async (
    customer: Customer,
    newTier: string,
  ) => {
    try {
      const response = await fetch("/api/email/tier-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customer.email,
          name: customer.full_name || "Valued Customer",
          oldTier: loyaltyPoints?.tier,
          newTier,
          benefits: tiers.find((t) => t.tier === newTier),
        }),
      });

      if (response.ok) {
        toast.success("Tier update notification sent");
      }
    } catch (error) {
      console.error("Error sending tier notification:", error);
    }
  };

  const copyCustomerId = () => {
    navigator.clipboard.writeText(userId);
    toast.success("Customer ID copied to clipboard");
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case "platinum":
        return "bg-gradient-to-r from-gray-600 to-gray-800";
      case "gold":
        return "bg-gradient-to-r from-yellow-600 to-amber-600";
      case "silver":
        return "bg-gradient-to-r from-gray-400 to-slate-500";
      default:
        return "bg-gradient-to-r from-amber-700 to-yellow-700";
    }
  };

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case "platinum":
        return <Shield className="h-5 w-5" />;
      case "gold":
        return <Award className="h-5 w-5" />;
      case "silver":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPpp");
  };

  const getNextTier = () => {
    if (!loyaltyPoints || tiers.length === 0) return null;

    const currentTier = tiers.find((t) => t.tier === loyaltyPoints.tier);
    if (!currentTier) return null;

    const nextTier = tiers.find((t) => t.min_points > currentTier.min_points);
    return nextTier;
  };

  const nextTier = getNextTier();
  const progressPercentage = nextTier
    ? Math.min(100, ((loyaltyPoints?.points || 0) / nextTier.min_points) * 100)
    : 100;

  if (loading) {
    return (
      <div className="container mx-auto px-2 space-y-6 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-2 py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Customer Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The customer with ID {userId} does not exist.
            </p>
            <Button onClick={() => router.push("/admin/customers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Loyalty Management
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{customer.full_name || "Unnamed Customer"}</span>
              <span>•</span>
              <span
                className="cursor-pointer hover:text-primary"
                onClick={copyCustomerId}
              >
                ID: {userId.slice(0, 8)}...
              </span>
              <Copy
                className="h-3 w-3 cursor-pointer"
                onClick={copyCustomerId}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/accounts/${userId}`)}
          >
            View Profile
          </Button>
          <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adjust Points
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust Loyalty Points</DialogTitle>
                <DialogDescription>
                  Add or deduct points from{" "}
                  {customer.full_name || customer.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Adjustment Type */}
                <div>
                  <Label className="mb-2 block">Adjustment Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={adjustmentType === "add" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setAdjustmentType("add")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Points
                    </Button>
                    <Button
                      type="button"
                      variant={
                        adjustmentType === "subtract"
                          ? "destructive"
                          : "outline"
                      }
                      className="flex-1"
                      onClick={() => setAdjustmentType("subtract")}
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Deduct Points
                    </Button>
                  </div>
                </div>

                {/* Points Amount */}
                <div>
                  <Label htmlFor="points" className="mb-2 block">
                    Points to {adjustmentType === "add" ? "Add" : "Deduct"}
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={adjustmentPoints}
                    onChange={(e) => setAdjustmentPoints(e.target.value)}
                    placeholder="Enter points amount"
                  />
                </div>

                {/* Reason */}
                <div>
                  <Label htmlFor="reason" className="mb-2 block">
                    Reason for Adjustment
                  </Label>
                  <Textarea
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Enter reason for adjustment..."
                    rows={3}
                  />
                </div>

                {/* Notification */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="notify" className="font-medium">
                        Send Notification Email
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notify customer about points adjustment
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notify"
                    checked={sendNotification}
                    onCheckedChange={setSendNotification}
                  />
                </div>

                {/* Preview */}
                {adjustmentPoints && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                    <h4 className="font-medium mb-2 text-amber-800">
                      Adjustment Preview
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        Current Balance:{" "}
                        <span className="font-bold">
                          {loyaltyPoints?.points || 0} points
                        </span>
                      </p>
                      <p>
                        Adjustment:{" "}
                        <span
                          className={`font-bold ${adjustmentType === "add" ? "text-green-600" : "text-red-600"}`}
                        >
                          {adjustmentType === "add" ? "+" : "-"}
                          {adjustmentPoints} points
                        </span>
                      </p>
                      <p>
                        New Balance:{" "}
                        <span className="font-bold text-primary">
                          {(loyaltyPoints?.points || 0) +
                            (adjustmentType === "add"
                              ? parseInt(adjustmentPoints)
                              : -parseInt(adjustmentPoints))}{" "}
                          points
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjustPoints}
                  disabled={!adjustmentPoints || !adjustmentReason}
                >
                  Confirm Adjustment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Customer Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {customer.full_name || "No name provided"}
                    </p>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {customer.phone || "No phone provided"}
                    </p>
                    <p className="text-sm text-muted-foreground">Phone</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(customer.created_at), "PP")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Member Since
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Points & Tier */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Loyalty Status</h3>
              <div className="space-y-4">
                <div
                  className={`${getTierColor(loyaltyPoints?.tier)} text-white rounded-lg p-6 text-center`}
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {getTierIcon(loyaltyPoints?.tier)}
                    <h2 className="text-2xl font-bold">
                      {loyaltyPoints?.tier?.toUpperCase() || "BRONZE"} TIER
                    </h2>
                  </div>
                  <p className="text-lg opacity-90">Current Tier</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Points</span>
                    <span className="text-2xl font-bold">
                      {loyaltyPoints?.points || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Points Earned</span>
                    <span className="text-lg font-semibold">
                      {loyaltyPoints?.points_earned || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Points Redeemed
                    </span>
                    <span className="text-lg font-semibold">
                      {loyaltyPoints?.points_redeemed || 0}
                    </span>
                  </div>
                  {loyaltyPoints?.last_updated && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Last Updated
                      </span>
                      <span className="text-sm">
                        {format(new Date(loyaltyPoints.last_updated), "PP")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Next Tier Progress */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Progress to Next Tier</h3>
                {nextTier && (
                  <Badge
                    className={`${getTierColor(nextTier.tier)} text-white`}
                  >
                    {nextTier.tier.toUpperCase()}
                  </Badge>
                )}
              </div>

              {nextTier ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: {loyaltyPoints?.points || 0} pts</span>
                      <span>Required: {nextTier.min_points} pts</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {Math.round(progressPercentage)}% complete
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Next Tier Benefits:</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>
                          {nextTier.points_per_shilling}x points per shilling
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Gift className="h-3 w-3 text-purple-500" />
                        <span>
                          {nextTier.discount_percentage}% discount on orders
                        </span>
                      </li>
                      {nextTier.free_shipping_threshold && (
                        <li className="flex items-center gap-2">
                          <Wallet className="h-3 w-3 text-blue-500" />
                          <span>
                            Free shipping over KES{" "}
                            {nextTier.free_shipping_threshold}
                          </span>
                        </li>
                      )}
                      {nextTier.priority_support && (
                        <li className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-amber-500" />
                          <span>Priority customer support</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Label className="mb-2 block">Manually Update Tier</Label>
                    <Select
                      value={loyaltyPoints?.tier}
                      onValueChange={handleUpdateTier}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map((tier) => (
                          <SelectItem key={tier.tier} value={tier.tier}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${getTierColor(tier.tier)}`}
                              />
                              {tier.tier.toUpperCase()}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto mb-4 text-amber-400" />
                  <h4 className="font-semibold mb-2">
                    Maximum Tier Achieved! 🎉
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Customer has reached the highest loyalty tier.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Points History</CardTitle>
              <CardDescription>
                {totalTransactions} transactions found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={transactionFilter}
                onValueChange={setTransactionFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="earned">Points Earned</SelectItem>
                  <SelectItem value="redeemed">Points Redeemed</SelectItem>
                  <SelectItem value="adjusted">Manual Adjustments</SelectItem>
                  <SelectItem value="expired">Points Expired</SelectItem>
                  <SelectItem value="signup_bonus">Signup Bonuses</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points Change</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDate(transaction.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.transaction_type === "earned" ||
                            transaction.transaction_type === "signup_bonus"
                              ? "default"
                              : transaction.transaction_type === "redeemed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {transaction.transaction_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`font-bold ${
                            transaction.points_change > 0
                              ? "text-green-600"
                              : transaction.points_change < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {transaction.points_change > 0 ? "+" : ""}
                          {transaction.points_change}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {transaction.current_points}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {transaction.description}
                        {transaction.metadata?.admin_note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Note: {transaction.metadata.admin_note}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.order_id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() =>
                              router.push(
                                `/admin/orders/${transaction.order_id}`,
                              )
                            }
                          >
                            Order #{transaction.order_id.slice(0, 8)}...
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {Math.ceil(totalTransactions / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of{" "}
                {Math.ceil(totalTransactions / itemsPerPage)}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(totalTransactions / itemsPerPage),
                      ),
                    )
                  }
                  disabled={
                    currentPage === Math.ceil(totalTransactions / itemsPerPage)
                  }
                >
                  Next
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Benefits Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Tiers Comparison</CardTitle>
          <CardDescription>
            Benefits and requirements for each loyalty tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <Card
                key={tier.tier}
                className={`border-2 ${
                  loyaltyPoints?.tier === tier.tier
                    ? "border-primary shadow-lg"
                    : "border-border"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`${getTierColor(tier.tier)} text-white px-3 py-1 rounded-full`}
                    >
                      <span className="font-bold">
                        {tier.tier.toUpperCase()}
                      </span>
                    </div>
                    {loyaltyPoints?.tier === tier.tier && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Minimum Points
                      </p>
                      <p className="text-xl font-bold">
                        {tier.min_points.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Points per KES
                      </p>
                      <p className="text-lg font-semibold">
                        {tier.points_per_shilling}x
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Discount</p>
                      <p className="text-lg font-semibold">
                        {tier.discount_percentage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Free Shipping
                      </p>
                      <p className="font-medium">
                        {tier.free_shipping_threshold
                          ? `KES ${tier.free_shipping_threshold}+`
                          : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Priority Support
                      </p>
                      <p className="font-medium">
                        {tier.priority_support ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Birthday Bonus
                      </p>
                      <p className="font-medium">
                        {tier.birthday_bonus_points} points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
