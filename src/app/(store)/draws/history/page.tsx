// app/(store)/draws/history/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gift,
  Trophy,
  Calendar,
  Users,
  Ticket,
  CheckCircle,
  Clock,
  ChevronRight,
  Search,
  TrendingUp,
  Award,
  Crown,
  ShoppingBag,
  Share2,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface DrawHistory {
  id: string;
  name: string;
  description: string;
  prize_name: string;
  prize_value: number;
  prize_image_url: string;
  draw_time: string;
  status: string;
  winner_id: string | null;
  winner_name: string | null;
  winner_announced_at: string | null;
  total_entries: number;
  total_participants: number;
  consolation_points_amount: number;
}

interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  winner_name: string;
  winner_rank: number;
  prize_name: string;
  prize_value: number;
  claim_status: string;
  claimed_at: string | null;
  draw_name: string;
  draw_time: string;
}

interface UserDrawEntry {
  order_id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  draw_entries_awarded: number;
  draw_id: string;
  draw_name: string;
  draw_time: string;
  prize_name: string;
  draw_status: string;
  draw_entry_details: any;

  // New winner fields from the updated view
  is_winner: boolean;
  winner_rank: number | null;
  winner_claim_status: string | null;
}

interface UserEntryStats {
  total_entries: number;
  total_draws_entered: number;
  total_wins: number;
  claimed_wins: number;
  pending_wins: number;
}

export default function DrawHistoryPage() {
  const { supabase, profile } = useAuth();
  const [completedDraws, setCompletedDraws] = useState<DrawHistory[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [userEntries, setUserEntries] = useState<UserDrawEntry[]>([]);
  const [userEntryStats, setUserEntryStats] = useState<UserEntryStats>({
    total_entries: 0,
    total_draws_entered: 0,
    total_wins: 0,
    claimed_wins: 0,
    pending_wins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedPrize, setSelectedPrize] = useState<string>("all");
  const router = useRouter();

  // Fetch completed draws
  const fetchCompletedDraws = useCallback(async () => {
    const { data, error } = await supabase
      .from("draws")
      .select(
        `
        id,
        name,
        description,
        prize_name,
        prize_value,
        prize_image_url,
        draw_time,
        status,
        winner_id,
        winner_announced_at,
        consolation_points_amount,
        draw_entries:draw_entries(count),
        draw_participants:draw_entries(user_id)
      `,
      )
      .eq("status", "completed")
      .not("winner_id", "is", null)
      .order("draw_time", { ascending: false });

    if (error) {
      console.error("Error fetching draws:", error);
      return;
    }

    const drawsWithStats = await Promise.all(
      (data || []).map(async (draw: any) => {
        const totalEntries = draw.draw_entries?.[0]?.count || 0;
        const uniqueParticipants = draw.draw_participants
          ? new Set(draw.draw_participants.map((p: any) => p.user_id)).size
          : 0;

        let winnerName = null;
        if (draw.winner_id) {
          const { data: winner } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", draw.winner_id)
            .single();
          winnerName = winner?.full_name || "Anonymous";
        }

        return {
          ...draw,
          total_entries: totalEntries,
          total_participants: uniqueParticipants,
          winner_name: winnerName,
        };
      }),
    );

    setCompletedDraws(drawsWithStats);
  }, [supabase]);

  // Fetch winners leaderboard
  const fetchWinners = useCallback(async () => {
    const { data, error } = await supabase
      .from("draw_winners")
      .select(
        `
        id,
        draw_id,
        user_id,
        winner_rank,
        prize_name,
        prize_value,
        claim_status,
        claimed_at,
        draws!inner (
          name,
          draw_time
        ),
        users!inner (
          full_name
        )
      `,
      )
      .eq("winner_rank", 1)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching winners:", error);
      return;
    }

    setWinners(
      (data || []).map((winner: any) => ({
        id: winner.id,
        draw_id: winner.draw_id,
        user_id: winner.user_id,
        winner_name: winner.users?.full_name || "Anonymous",
        winner_rank: winner.winner_rank,
        prize_name: winner.prize_name,
        prize_value: winner.prize_value,
        claim_status: winner.claim_status,
        claimed_at: winner.claimed_at,
        draw_name: winner.draws?.name,
        draw_time: winner.draws?.draw_time,
      })),
    );
  }, [supabase]);

  // Fetch user's personal draw entries using the view
  const fetchUserEntries = useCallback(async () => {
    if (!profile?.id) return;

    // Use the customer_draw_entry_history view
    const { data: entriesData, error: entriesError } = await supabase
      .from("customer_draw_entry_history")
      .select("*")
      .order("order_date", { ascending: false });

    if (entriesError) {
      console.error("Error fetching user entries:", entriesError);
      return;
    }

    // Fetch user stats from the stats view
    const { data: statsData, error: statsError } = await supabase
      .from("user_draw_stats")
      .select("*")
      .eq("user_id", profile.id)
      .single();

    if (statsError && statsError.code !== "PGRST116") {
      console.error("Error fetching user stats:", statsError);
    }

    setUserEntries(entriesData || []);
    setUserEntryStats({
      total_entries:
        entriesData?.reduce((sum, e) => sum + e.draw_entries_awarded, 0) || 0,
      total_draws_entered: statsData?.total_draws_entered || 0,
      total_wins: statsData?.total_wins || 0,
      claimed_wins: statsData?.claimed_wins || 0,
      pending_wins: statsData?.pending_wins || 0,
    });
  }, [supabase, profile?.id]);

  useEffect(() => {
    Promise.all([
      fetchCompletedDraws(),
      fetchWinners(),
      fetchUserEntries(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [fetchCompletedDraws, fetchWinners, fetchUserEntries]);

  // Filter draws
  const filteredDraws = completedDraws.filter((draw) => {
    const matchesSearch =
      draw.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draw.prize_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear =
      selectedYear === "all" ||
      new Date(draw.draw_time).getFullYear().toString() === selectedYear;
    const matchesPrize =
      selectedPrize === "all" ||
      draw.prize_name.toLowerCase().includes(selectedPrize.toLowerCase());
    return matchesSearch && matchesYear && matchesPrize;
  });

  const availableYears = [
    ...new Set(
      completedDraws.map((draw) =>
        new Date(draw.draw_time).getFullYear().toString(),
      ),
    ),
  ]
    .sort()
    .reverse();

  const prizeCategories = [
    ...new Set(completedDraws.map((draw) => draw.prize_name)),
  ].slice(0, 10);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getEntryMethodIcon = (method: string) => {
    switch (method) {
      case "purchase":
        return <ShoppingBag className="h-3 w-3" />;
      case "referral":
        return <Users className="h-3 w-3" />;
      case "social_share":
        return <Share2 className="h-3 w-3" />;
      case "live_stream_entry":
        return <Eye className="h-3 w-3" />;
      default:
        return <Ticket className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Draw History</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            See all our past draws, winners, and your personal entry history
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="draws" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="draws">Past Draws</TabsTrigger>
            <TabsTrigger value="my-entries">My Entries</TabsTrigger>
          </TabsList>

          {/* Past Draws Tab */}
          <TabsContent value="draws" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content - Draws List */}
              <div className="lg:col-span-2 space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search draws or prizes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-2 rounded-lg border bg-background text-sm"
                    >
                      <option value="all">All Years</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedPrize}
                      onChange={(e) => setSelectedPrize(e.target.value)}
                      className="px-3 py-2 rounded-lg border bg-background text-sm max-w-[150px]"
                    >
                      <option value="all">All Prizes</option>
                      {prizeCategories.map((prize) => (
                        <option key={prize} value={prize}>
                          {prize}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredDraws.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No draws found
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm ||
                      selectedYear !== "all" ||
                      selectedPrize !== "all"
                        ? "Try adjusting your filters"
                        : "No completed draws yet. Check back soon!"}
                    </p>
                  </Card>
                ) : (
                  filteredDraws.map((draw) => (
                    <Card
                      key={draw.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center p-4">
                          {draw.prize_image_url ? (
                            <img
                              src={draw.prize_image_url}
                              alt={draw.prize_name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Gift className="h-12 w-12 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 p-6">
                          {/* ... existing draw card content ... */}
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                            <div>
                              <h3 className="text-xl font-semibold">
                                {draw.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {draw.description}
                              </p>
                            </div>
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4 text-purple-500" />
                              <span className="font-medium">
                                {draw.prize_name}
                              </span>
                              {draw.prize_value > 0 && (
                                <Badge variant="outline">
                                  {formatPrice(draw.prize_value)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(draw.draw_time), "PPP")}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Ticket className="h-4 w-4 text-blue-500" />
                              <span>
                                {draw.total_entries.toLocaleString()} entries
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-green-500" />
                              <span>
                                {draw.total_participants.toLocaleString()}{" "}
                                participants
                              </span>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <span className="font-medium">Winner:</span>
                                <span>{draw.winner_name || "Anonymous"}</span>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/draws/${draw.id}`}>
                                  View Details
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Sidebar - same as before */}
              <div className="space-y-6">
                {/* Winners Leaderboard */}
                <Card>
                  <div className="p-4 border-b">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Recent Winners
                    </h2>
                  </div>
                  <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                    {winners.slice(0, 20).map((winner, idx) => (
                      <div
                        key={winner.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-shrink-0 w-8 text-center">
                          {idx === 0 && (
                            <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />
                          )}
                          {idx === 1 && (
                            <Award className="h-5 w-5 text-gray-400 mx-auto" />
                          )}
                          {idx === 2 && (
                            <Award className="h-5 w-5 text-amber-600 mx-auto" />
                          )}
                          {idx > 2 && (
                            <span className="text-xs text-muted-foreground">
                              #{idx + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">
                            {winner.winner_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {winner.prize_name}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {winner.claim_status === "claimed"
                            ? "Claimed"
                            : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Stats Summary */}
                <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <div className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-3" />
                    <h3 className="text-lg font-bold mb-1">Total Giveaways</h3>
                    <p className="text-3xl font-bold">
                      {completedDraws.length}
                    </p>
                    <p className="text-sm opacity-90 mt-2">
                      {completedDraws
                        .reduce((sum, d) => sum + d.total_participants, 0)
                        .toLocaleString()}{" "}
                      participants
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Entries Tab - NEW */}
          <TabsContent value="my-entries" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Entries
                    </p>
                    <p className="text-2xl font-bold">
                      {userEntryStats.total_entries}
                    </p>
                  </div>
                  <Ticket className="h-8 w-8 text-purple-500 opacity-50" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Draws Entered
                    </p>
                    <p className="text-2xl font-bold">
                      {userEntryStats.total_draws_entered}
                    </p>
                  </div>
                  <Gift className="h-8 w-8 text-orange-500 opacity-50" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Wins</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {userEntryStats.total_wins}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500 opacity-50" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending Claims
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {userEntryStats.pending_wins}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500 opacity-50" />
                </CardContent>
              </Card>
            </div>

            {/* Entries List */}
            {userEntries.length === 0 ? (
              <Card className="p-12 text-center">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Entries Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't entered any draws yet. Start earning entries
                  today!
                </p>
                <Button asChild>
                  <Link href="/draws">Browse Active Draws</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {userEntries.map((entry) => (
                  <Card
                    key={entry.order_id}
                    className={cn(
                      "hover:shadow-md transition-shadow",
                      entry.is_winner &&
                        "border-yellow-500/50 bg-gradient-to-r from-yellow-500/5 to-orange-500/5",
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <ShoppingBag className="h-4 w-4 text-green-500" />
                            <h3 className="font-semibold">{entry.draw_name}</h3>
                            {entry.is_winner && (
                              <Badge className="bg-yellow-500 text-white">
                                <Trophy className="h-3 w-3 mr-1" />
                                Winner! Rank #{entry.winner_rank}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                entry.draw_status === "completed"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {entry.draw_status === "completed"
                                ? "Ended"
                                : "Active"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Prize: {entry.prize_name}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Draw:{" "}
                              {format(new Date(entry.draw_time), "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Earned:{" "}
                              {formatDistanceToNow(new Date(entry.order_date), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">
                            {entry.draw_entries_awarded}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Entries
                          </p>
                          {entry.is_winner &&
                            entry.winner_claim_status === "pending" && (
                              <Badge className="mt-1 bg-yellow-500 text-white text-xs animate-pulse">
                                Awaiting Claim
                              </Badge>
                            )}
                          {entry.is_winner &&
                            entry.winner_claim_status === "claimed" && (
                              <Badge className="mt-1 bg-green-500 text-white text-xs">
                                ✓ Claimed
                              </Badge>
                            )}
                          {!entry.is_winner && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              via Purchase
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            Order #{entry.order_number}
                          </span>
                          <span>{formatPrice(entry.total_amount)}</span>
                        </div>
                        {entry.draw_entry_details?.calculation && (
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            Every KSH{" "}
                            {Math.round(
                              entry.total_amount / entry.draw_entries_awarded,
                            )}{" "}
                            spent = 1 entry
                          </div>
                        )}
                      </div>

                      {/* Winner Action Button */}
                      {entry.is_winner &&
                        entry.winner_claim_status === "pending" && (
                          <div className="mt-3 pt-2 border-t">
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                              onClick={() => {
                                // Handle prize claim
                                router.push(`/draws/${entry.draw_id}/claim`);
                              }}
                            >
                              <Trophy className="h-3 w-3 mr-1" />
                              Claim Your Prize
                            </Button>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Call to Action */}
            {userEntries.length > 0 && (
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Want more entries? Check out our active draws!
                  </p>
                  <Button asChild className="mt-2">
                    <Link href="/draws">View Active Draws</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
