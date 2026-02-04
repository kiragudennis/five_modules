"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Mail,
  Phone,
  Calendar,
  User,
  Shield,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Gift,
  Cake,
  Send,
  Sparkles,
  Award,
  Bell,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Customer {
  id: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
  metadata: {
    name?: string;
    phone?: string;
    avatar_url?: string;
  };
  loyalty_points?: {
    points: number;
    tier: string;
  };
}

interface BirthdayGift {
  id: string;
  customer_id: string;
  points_awarded: number;
  year: number;
  sent_at: string;
  email_sent: boolean;
}

export default function CustomersPage() {
  const { supabase } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showBirthdayDialog, setShowBirthdayDialog] = useState(false);
  const [birthdayPoints, setBirthdayPoints] = useState(100);
  const [customMessage, setCustomMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [birthdayHistory, setBirthdayHistory] = useState<BirthdayGift[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");

  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, filterRole, filterTier, supabase]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("users")
        .select(
          `
          *,
          loyalty_points (
            points,
            tier
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filterRole !== "all") {
        query = query.eq("role", filterRole);
      }

      if (searchTerm) {
        query = query.or(
          `email.ilike.%${searchTerm}%,metadata->>name.ilike.%${searchTerm}%`,
        );
      }

      const { data, error, count } = await query.range(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage - 1,
      );

      if (error) throw error;

      // Filter by tier if needed
      let filteredData = data || [];
      if (filterTier !== "all") {
        filteredData = filteredData.filter(
          (customer: any) => customer.loyalty_points?.tier === filterTier,
        );
      }

      setCustomers(filteredData);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchBirthdayHistory = async (customerId: string) => {
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from("birthday_gifts")
        .select("*")
        .eq("customer_id", customerId)
        .order("year", { ascending: false });

      if (error) throw error;
      setBirthdayHistory(data || []);
    } catch (error) {
      console.error("Error fetching birthday history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendBirthdayGift = async () => {
    if (!selectedCustomer) return;

    try {
      // 1. Award birthday points via RPC
      const { data: awardData, error: awardError } = await supabase.rpc(
        "award_birthday_points",
        {
          p_user_id: selectedCustomer.id,
          p_points: birthdayPoints,
          p_description: `Birthday gift ${new Date().getFullYear()}`,
        },
      );

      if (awardError) throw awardError;

      // 2. Record birthday gift in database
      const { error: giftError } = await supabase
        .from("birthday_gifts")
        .insert({
          customer_id: selectedCustomer.id,
          points_awarded: birthdayPoints,
          year: new Date().getFullYear(),
          sent_at: new Date().toISOString(),
          email_sent: sendEmail,
        });

      if (giftError) throw giftError;

      // 3. Send birthday email if requested
      if (sendEmail) {
        await sendBirthdayEmail(selectedCustomer);
      }

      toast.success(
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4" />
          <span>
            {birthdayPoints} birthday points awarded to{" "}
            {selectedCustomer.metadata?.name || selectedCustomer.email}!
          </span>
        </div>,
      );

      // Refresh customer data
      fetchCustomers();
      setShowBirthdayDialog(false);
      setCustomMessage("");
    } catch (error: any) {
      console.error("Error awarding birthday points:", error);
      toast.error("Failed to send birthday gift");
    }
  };

  const sendBirthdayEmail = async (customer: Customer) => {
    try {
      const response = await fetch("/api/email/birthday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customer.email,
          name: customer.metadata?.name || "Valued Customer",
          points: birthdayPoints,
          customMessage,
          tier: customer.loyalty_points?.tier || "bronze",
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      toast.success("Birthday email sent successfully!");
    } catch (error) {
      console.error("Error sending birthday email:", error);
      toast.error("Failed to send birthday email");
    }
  };

  const handleSendEmail = async (customer: Customer) => {
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customer.email,
          subject: `Message from Blessed Two Electronics`,
          template: "custom",
          data: {
            name: customer.metadata?.name || "Valued Customer",
            message: `Hello from Blessed Two Electronics! We appreciate your business.`,
          },
        }),
      });

      if (response.ok) {
        toast.success(`Email sent to ${customer.email}`);
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    }
  };

  const handleSendSMS = (phone?: string) => {
    if (!phone) {
      toast.error("No phone number available");
      return;
    }
    window.location.href = `sms:${phone}`;
  };

  const getCustomerBirthday = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    return {
      date: format(createdDate, "MMMM d"),
      anniversary: `Member for ${new Date().getFullYear() - createdDate.getFullYear()} years`,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : "U";
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="container mx-auto px-2 space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage customers, send birthday gifts, and communicate
          </p>
        </div>

        <div className="flex gap-2">
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Birthday Gift Dialog */}
      <Dialog open={showBirthdayDialog} onOpenChange={setShowBirthdayDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-pink-500" />
              Send Birthday Gift
            </DialogTitle>
            <DialogDescription>
              Send loyalty points and a birthday message to{" "}
              {selectedCustomer?.metadata?.name || selectedCustomer?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold">
                  {getInitials(
                    selectedCustomer.metadata?.name,
                    selectedCustomer.email,
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">
                    {selectedCustomer.metadata?.name || "No name"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.email}
                  </p>
                  {selectedCustomer.loyalty_points && (
                    <Badge
                      className={`${getTierColor(selectedCustomer.loyalty_points.tier)} text-white mt-1`}
                    >
                      {selectedCustomer.loyalty_points.tier.toUpperCase()} Tier
                    </Badge>
                  )}
                </div>
              </div>

              {/* Points Selection */}
              <div>
                <Label className="mb-2 block">Birthday Points</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000].map((points) => (
                    <Button
                      key={points}
                      type="button"
                      variant={
                        birthdayPoints === points ? "default" : "outline"
                      }
                      className={`${birthdayPoints === points ? getTierColor(selectedCustomer.loyalty_points?.tier) : ""}`}
                      onClick={() => setBirthdayPoints(points)}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      {points} pts
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Birthday bonus based on tier:{" "}
                  {selectedCustomer.loyalty_points?.tier === "platinum"
                    ? "1000"
                    : selectedCustomer.loyalty_points?.tier === "gold"
                      ? "500"
                      : selectedCustomer.loyalty_points?.tier === "silver"
                        ? "200"
                        : "100"}{" "}
                  points
                </p>
              </div>

              {/* Custom Message */}
              <div>
                <Label htmlFor="message" className="mb-2 block">
                  Birthday Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  placeholder={`Happy Birthday! Here's ${birthdayPoints} loyalty points to celebrate your special day.`}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Email Option */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="send-email" className="font-medium">
                      Send Birthday Email
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Includes birthday message and points notification
                    </p>
                  </div>
                </div>
                <Switch
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                />
              </div>

              {/* Birthday History */}
              {birthdayHistory.length > 0 && (
                <div>
                  <Label className="mb-2 block">Previous Birthday Gifts</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {birthdayHistory.map((gift) => (
                      <div
                        key={gift.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Cake className="h-4 w-4 text-pink-500" />
                          <span className="font-medium">{gift.year}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">
                            {gift.points_awarded} points
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(gift.sent_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingHistory && (
                <div className="text-center py-4">
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBirthdayDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendBirthdayGift}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              <Gift className="h-4 w-4 mr-2" />
              Send Birthday Gift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customers Table */}
      <Card className="border-none shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>{totalCount} customers found</CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <Cake className="h-3 w-3" />
              <span>Birthday Mode</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="rounded-md border px-0 pb-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Customer
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Tier & Points
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Contact
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Member Since
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr
                        key={i}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-4 w-40" />
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="p-4 align-middle">
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </td>
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No customers found</p>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer: Customer) => {
                      const birthday = getCustomerBirthday(customer.created_at);
                      return (
                        <tr
                          key={customer.id}
                          className="border-b transition-colors hover:bg-muted/50 group"
                        >
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 relative">
                                {customer.metadata?.avatar_url ? (
                                  <img
                                    src={customer.metadata.avatar_url}
                                    alt={
                                      customer.metadata.name || customer.email
                                    }
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary/10 to-primary/20 flex items-center justify-center relative">
                                    <span className="text-sm font-medium text-primary">
                                      {getInitials(
                                        customer.full_name,
                                        customer.email,
                                      )}
                                    </span>
                                    <div className="absolute -top-1 -right-1">
                                      <div className="h-4 w-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                        <Cake className="h-2 w-2 text-white" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {customer.full_name || "No name"}
                                  {birthday && (
                                    <span className="ml-2 text-xs bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 px-2 py-0.5 rounded-full">
                                      🎂 {birthday.date}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {customer.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {birthday.anniversary}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="space-y-2">
                              {customer.loyalty_points ? (
                                <>
                                  <Badge
                                    className={`${getTierColor(customer.loyalty_points.tier)} text-white`}
                                  >
                                    {customer.loyalty_points.tier.toUpperCase()}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <Award className="h-3 w-3 text-amber-500" />
                                    <span className="text-sm font-medium">
                                      {customer.loyalty_points.points.toLocaleString()}{" "}
                                      points
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <Badge variant="outline">No points yet</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {customer.email}
                                </span>
                              </div>
                              {customer.metadata?.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {customer.metadata.phone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {formatDate(customer.created_at)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {new Date().getFullYear() -
                                  new Date(
                                    customer.created_at,
                                  ).getFullYear()}{" "}
                                years
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setBirthdayPoints(
                                      customer.loyalty_points?.tier ===
                                        "platinum"
                                        ? 1000
                                        : customer.loyalty_points?.tier ===
                                            "gold"
                                          ? 500
                                          : customer.loyalty_points?.tier ===
                                              "silver"
                                            ? 200
                                            : 100,
                                    );
                                    fetchBirthdayHistory(customer.id);
                                    setShowBirthdayDialog(true);
                                  }}
                                  className="text-pink-600"
                                >
                                  <Cake className="h-4 w-4 mr-2" />
                                  Send Birthday Gift
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSendEmail(customer)}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSendSMS(customer.phone)}
                                >
                                  <Phone className="h-4 w-4 mr-2" />
                                  Send SMS
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/accounts/${customer.id}?tab=orders`,
                                    )
                                  }
                                >
                                  View Orders
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/accounts/${customer.id}`)
                                  }
                                >
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/admin/customers/${customer.id}/loyalty`,
                                    )
                                  }
                                  className="text-amber-600"
                                >
                                  <Award className="h-4 w-4 mr-2" />
                                  Manage Points
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                {totalCount} customers
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
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
