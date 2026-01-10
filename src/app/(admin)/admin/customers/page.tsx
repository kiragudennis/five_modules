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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

interface Customer {
  id: string;
  email: string;
  role: string;
  created_at: string;
  metadata: {
    name?: string;
    phone?: string;
    avatar_url?: string;
  };
}

export default function CustomersPage() {
  const { supabase } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, supabase]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `email.ilike.%${searchTerm}%,metadata->>name.ilike.%${searchTerm}%`
        );
      }

      const { data, error, count } = await query.range(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage - 1
      );

      if (error) throw error;

      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleSendSMS = (phone?: string) => {
    if (!phone) {
      toast.error("No phone number available");
      return;
    }
    window.location.href = `sms:${phone}`;
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

  return (
    <div className="container mx-auto px-2 space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage and communicate with your customers
          </p>
        </div>

        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>All Customers</DropdownMenuItem>
                <DropdownMenuItem>Admins</DropdownMenuItem>
                <DropdownMenuItem>Customers</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>{totalCount} customers found</CardDescription>
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
                      Contact
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Role
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      Joined
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
                    customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {customer.metadata?.avatar_url ? (
                                <img
                                  src={customer.metadata.avatar_url}
                                  alt={customer.metadata.name || customer.email}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {getInitials(
                                      customer.metadata?.name,
                                      customer.email
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {customer.metadata?.name || "No name"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {customer.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{customer.email}</span>
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
                          <Badge
                            variant={
                              customer.role === "admin"
                                ? "default"
                                : "secondary"
                            }
                            className="flex items-center gap-1 w-min"
                          >
                            {customer.role === "admin" && (
                              <Shield className="h-3 w-3" />
                            )}
                            {customer.role}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(customer.created_at)}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleSendEmail(customer.email)}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSendSMS(customer.metadata?.phone)
                                }
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Send SMS
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>View Orders</DropdownMenuItem>
                              <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
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
